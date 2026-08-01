import {
  CallHandler,
  Controller,
  ExecutionContext,
  Get,
  HttpCode,
  INestApplication,
  MethodNotAllowedException,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { lastValueFrom } from 'rxjs';
import { of } from 'rxjs';
import request = require('supertest');
import { ExampleAsyncController } from '../apps/example/src/example/controllers/async.controller';
import { AsyncRequestPipe } from '../apps/example/src/example/pipes/async-request.pipe';
import {
  ASYNC_JOB_NAME,
  ASYNC_PATTERN_GET_STATUS,
  ASYNC_PATTERN_QUEUE,
  ASYNC_PATTERN_START_PROCESS,
  ASYNC_STATUS_LOCATION_BASE_PATH,
  ASYNC_STATUS_STORE,
} from '../src/lib/async/async.tokens';
import { createAsyncStatusController } from '../src/lib/async/controllers/async-status.controller';
import { Async, ASYNC_OPTIONS } from '../src/lib/async/decorators/async.decorator';
import { AsyncInterceptor } from '../src/lib/async/interceptors/async.interceptor';
import { AsyncStatusResponse } from '../src/lib/async/interfaces/http/async-status-response.interface';
import { AsyncPatternService } from '../src/lib/async/services/async-pattern.service';

type AsyncStatusControllerContract = {
  getStatus(id: string): Promise<AsyncStatusResponse>;
};

const guardCanActivate = jest.fn(() => true);

@Controller('default-payload')
class DefaultPayloadController {
  @Post()
  @Async()
  @HttpCode(202)
  handleRequest() {
    return undefined;
  }
}

@Controller('exceptional-get')
class ExceptionalGetController {
  @Get()
  @Async({ allowMethods: ['GET'] })
  @HttpCode(202)
  handleRequest() {
    return undefined;
  }
}

const unexpectedPipeError = new Error('Unexpected pipe failure');

@Controller('unexpected-pipe')
class UnexpectedPipeController {
  @Post()
  @Async({
    pipe: {
      transform: () => {
        throw unexpectedPipeError;
      },
    },
  })
  @HttpCode(202)
  handleRequest() {
    return undefined;
  }
}

describe('Async flow integration', () => {
  const AsyncStatusController = createAsyncStatusController('async-status');
  let app: INestApplication;
  let asyncController: ExampleAsyncController;
  let asyncStatusController: AsyncStatusControllerContract;
  let asyncInterceptor: AsyncInterceptor;
  let reflector: Reflector;

  const asyncQueueMock = {
    add: jest.fn(),
  };
  const asyncPatternGetStatusMock = {
    getStatus: jest.fn<Promise<AsyncStatusResponse>, []>(),
  };
  const asyncStatusStoreMock = {
    get: jest.fn(),
    setAccepted: jest.fn(),
    setCompleted: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        ExampleAsyncController,
        AsyncStatusController,
        DefaultPayloadController,
        ExceptionalGetController,
        UnexpectedPipeController,
      ],
      providers: [
        AsyncInterceptor,
        AsyncPatternService,
        {
          provide: ASYNC_PATTERN_START_PROCESS,
          useExisting: AsyncPatternService,
        },
        {
          provide: ASYNC_PATTERN_GET_STATUS,
          useValue: asyncPatternGetStatusMock,
        },
        {
          provide: ASYNC_STATUS_STORE,
          useValue: asyncStatusStoreMock,
        },
        {
          provide: ASYNC_PATTERN_QUEUE,
          useValue: asyncQueueMock,
        },
        {
          provide: ASYNC_JOB_NAME,
          useValue: 'processJob',
        },
        {
          provide: ASYNC_STATUS_LOCATION_BASE_PATH,
          useValue: 'async-status',
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    app.useGlobalGuards({
      canActivate: guardCanActivate,
    });
    await app.init();

    asyncController = moduleFixture.get(ExampleAsyncController);
    asyncStatusController = moduleFixture.get<AsyncStatusControllerContract>(AsyncStatusController);
    asyncInterceptor = moduleFixture.get(AsyncInterceptor);
    reflector = moduleFixture.get(Reflector);
    jest.clearAllMocks();
    guardCanActivate.mockReturnValue(true);
    asyncQueueMock.add.mockResolvedValue({ id: '123' });
    asyncStatusStoreMock.get.mockResolvedValue(null);
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns accepted response through the async interceptor', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          body: { data: { name: 'job', milliseconds: 10 } },
        }),
      }),
      getHandler: () => ExampleAsyncController.prototype.handleRequest,
    } as unknown as ExecutionContext;

    const next = {
      handle: () => of(null),
    } as CallHandler;

    const response$ = await asyncInterceptor.intercept(context, next);

    await expect(lastValueFrom(response$)).resolves.toEqual({
      status: 'accepted',
      location: '/async-status/status/123',
    });
    expect(asyncController).toBeDefined();
    expect(asyncQueueMock.add).toHaveBeenCalledWith('processJob', {
      name: 'job',
      milliseconds: 10,
    });
    expect(
      reflector.get(ASYNC_OPTIONS, ExampleAsyncController.prototype.handleRequest)
    ).toEqual({
      payloadPath: 'data',
      pipe: expect.any(AsyncRequestPipe),
    });
  });

  it('validates and transforms a nested payload over HTTP before enqueueing it', async () => {
    asyncQueueMock.add.mockResolvedValue({ id: '321' });

    const response = await request(app.getHttpServer())
      .post('/async/save')
      .send({
        data: {
          name: '  job  ',
          milliseconds: '10',
        },
      })
      .expect(202);

    expect(response.body).toEqual({
      status: 'accepted',
      location: '/async-status/status/321',
    });
    expect(guardCanActivate).toHaveBeenCalled();
    expect(guardCanActivate.mock.invocationCallOrder[0]).toBeLessThan(
      asyncQueueMock.add.mock.invocationCallOrder[0],
    );
    expect(asyncQueueMock.add).toHaveBeenCalledWith('processJob', {
      name: 'job',
      milliseconds: 10,
    });
  });

  it('returns HTTP 400 and does not enqueue when the explicit pipe rejects the payload', async () => {
    await request(app.getHttpServer())
      .post('/async/save')
      .send({
        data: {
          milliseconds: '10',
        },
      })
      .expect(400);

    expect(guardCanActivate).toHaveBeenCalled();
    expect(asyncQueueMock.add).not.toHaveBeenCalled();
  });

  it('returns HTTP 500 and does not enqueue when the explicit pipe throws an arbitrary error', async () => {
    await request(app.getHttpServer())
      .post('/unexpected-pipe')
      .send({ name: 'job' })
      .expect(500);

    expect(asyncQueueMock.add).not.toHaveBeenCalled();
  });

  it('preserves HTTP behavior for endpoints without a pipe', async () => {
    asyncQueueMock.add.mockResolvedValue({ id: '654' });
    const body = {
      name: 'job',
      milliseconds: 10,
    };

    const response = await request(app.getHttpServer())
      .post('/default-payload')
      .send(body)
      .expect(202);

    expect(response.body).toEqual({
      status: 'accepted',
      location: '/async-status/status/654',
    });
    expect(asyncQueueMock.add).toHaveBeenCalledWith('processJob', body);
  });

  it('uses the whole body as payload when no payloadPath is configured', async () => {
    asyncQueueMock.add.mockResolvedValue({ id: '456' });

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          body: { name: 'job', milliseconds: 10 },
        }),
      }),
      getHandler: () => DefaultPayloadController.prototype.handleRequest,
    } as unknown as ExecutionContext;

    const next = {
      handle: () => of(null),
    } as CallHandler;

    const response$ = await asyncInterceptor.intercept(context, next);

    await expect(lastValueFrom(response$)).resolves.toEqual({
      status: 'accepted',
      location: '/async-status/status/456',
    });
    expect(asyncQueueMock.add).toHaveBeenCalledWith('processJob', {
      name: 'job',
      milliseconds: 10,
    });
  });

  it('rejects GET by default even when @Async() is present', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          body: { name: 'job', milliseconds: 10 },
        }),
      }),
      getHandler: () => DefaultPayloadController.prototype.handleRequest,
    } as unknown as ExecutionContext;

    const next = {
      handle: () => of(null),
    } as CallHandler;

    await expect(asyncInterceptor.intercept(context, next)).rejects.toBeInstanceOf(
      MethodNotAllowedException
    );
  });

  it('allows explicitly configured GET methods', async () => {
    asyncQueueMock.add.mockResolvedValue({ id: '789' });

    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'GET',
          body: { name: 'job', milliseconds: 10 },
        }),
      }),
      getHandler: () => ExceptionalGetController.prototype.handleRequest,
    } as unknown as ExecutionContext;

    const next = {
      handle: () => of(null),
    } as CallHandler;

    const response$ = await asyncInterceptor.intercept(context, next);

    await expect(lastValueFrom(response$)).resolves.toEqual({
      status: 'accepted',
      location: '/async-status/status/789',
    });
    expect(asyncQueueMock.add).toHaveBeenCalledWith('processJob', {
      name: 'job',
      milliseconds: 10,
    });
  });

  it('returns job status from the status controller', async () => {
    asyncPatternGetStatusMock.getStatus.mockResolvedValue({
      status: 'completed',
      result: 'Processed data: job',
      completed: true,
    });

    await expect(asyncStatusController.getStatus('123')).resolves.toEqual({
      status: 'completed',
      result: 'Processed data: job',
      completed: true,
    });
    expect(asyncPatternGetStatusMock.getStatus).toHaveBeenCalledWith('123');
  });

  it('propagates not found errors for unknown job ids', async () => {
    asyncPatternGetStatusMock.getStatus.mockRejectedValue(
      new NotFoundException('Job missing not found')
    );

    await expect(asyncStatusController.getStatus('missing')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });

  it('returns accepted status when the job was accepted but is not visible in BullMQ yet', async () => {
    asyncPatternGetStatusMock.getStatus.mockResolvedValue({
      status: 'accepted',
      result: 'Queued',
      completed: false,
    });

    await expect(asyncStatusController.getStatus('123')).resolves.toEqual({
      status: 'accepted',
      result: 'Queued',
      completed: false,
    });
    expect(asyncPatternGetStatusMock.getStatus).toHaveBeenCalledWith('123');
  });
});
