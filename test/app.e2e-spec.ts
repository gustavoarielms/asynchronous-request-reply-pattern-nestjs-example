import {
  CallHandler,
  ExecutionContext,
  INestApplication,
  MethodNotAllowedException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { lastValueFrom } from 'rxjs';
import { of } from 'rxjs';
import { ExampleAsyncController } from '../apps/example/src/example/controllers/async.controller';
import { ASYNC_PATTERN_GET_STATUS, ASYNC_PATTERN_START_PROCESS } from '../src/lib/async/async.tokens';
import { createAsyncStatusController } from '../src/lib/async/controllers/async-status.controller';
import { Async, ASYNC_OPTIONS } from '../src/lib/async/decorators/async.decorator';
import { AsyncInterceptor } from '../src/lib/async/interceptors/async.interceptor';
import { AsyncAcceptedResponse } from '../src/lib/async/interfaces/http/async-accepted-response.interface';
import { AsyncStatusResponse } from '../src/lib/async/interfaces/http/async-status-response.interface';

type AsyncStatusControllerContract = {
  getStatus(id: string): Promise<AsyncStatusResponse>;
};

class DefaultPayloadController {
  @Async()
  handleRequest() {
    return undefined;
  }
}

class ExceptionalGetController {
  @Async({ allowMethods: ['GET'] })
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

  const asyncPatternStartProcessMock = {
    startProcess: jest.fn<Promise<AsyncAcceptedResponse>, []>(),
  };
  const asyncPatternGetStatusMock = {
    getStatus: jest.fn<Promise<AsyncStatusResponse>, []>(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ExampleAsyncController, AsyncStatusController],
      providers: [
        AsyncInterceptor,
        {
          provide: ASYNC_PATTERN_START_PROCESS,
          useValue: asyncPatternStartProcessMock,
        },
        {
          provide: ASYNC_PATTERN_GET_STATUS,
          useValue: asyncPatternGetStatusMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    asyncController = moduleFixture.get(ExampleAsyncController);
    asyncStatusController = moduleFixture.get<AsyncStatusControllerContract>(AsyncStatusController);
    asyncInterceptor = moduleFixture.get(AsyncInterceptor);
    reflector = moduleFixture.get(Reflector);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns accepted response through the async interceptor', async () => {
    asyncPatternStartProcessMock.startProcess.mockResolvedValue({
      status: 'accepted',
      location: '/async-status/status/123',
    });

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
    expect(asyncPatternStartProcessMock.startProcess).toHaveBeenCalledWith({
      name: 'job',
      milliseconds: 10,
    });
    expect(
      reflector.get(ASYNC_OPTIONS, ExampleAsyncController.prototype.handleRequest)
    ).toEqual({ payloadPath: 'data' });
  });

  it('uses the whole body as payload when no payloadPath is configured', async () => {
    asyncPatternStartProcessMock.startProcess.mockResolvedValue({
      status: 'accepted',
      location: '/async-status/status/456',
    });

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
    expect(asyncPatternStartProcessMock.startProcess).toHaveBeenCalledWith({
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
    asyncPatternStartProcessMock.startProcess.mockResolvedValue({
      status: 'accepted',
      location: '/async-status/status/789',
    });

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
    expect(asyncPatternStartProcessMock.startProcess).toHaveBeenCalledWith({
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
