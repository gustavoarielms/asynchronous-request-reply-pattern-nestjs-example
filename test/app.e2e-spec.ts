import { CallHandler, ExecutionContext, INestApplication, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { lastValueFrom } from 'rxjs';
import { of } from 'rxjs';
import { ExampleAsyncController } from '../src/example/controllers/async.controller';
import { ExampleAsyncStatusController } from '../src/example/controllers/async-status.controller';
import { ASYNC_PATTERN_GET_STATUS, ASYNC_PATTERN_START_PROCESS } from '../src/lib/async/async.tokens';
import { AsyncInterceptor } from '../src/lib/async/interceptors/async.interceptor';
import { AsyncAcceptedResponse } from '../src/lib/async/interfaces/http/async-accepted-response.interface';
import { AsyncStatusResponse } from '../src/lib/async/interfaces/http/async-status-response.interface';

describe('Async flow integration', () => {
  let app: INestApplication;
  let asyncController: ExampleAsyncController;
  let asyncStatusController: ExampleAsyncStatusController;
  let asyncInterceptor: AsyncInterceptor;

  const asyncPatternStartProcessMock = {
    startProcess: jest.fn<Promise<AsyncAcceptedResponse>, []>(),
  };
  const asyncPatternGetStatusMock = {
    getStatus: jest.fn<Promise<AsyncStatusResponse>, []>(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ExampleAsyncController, ExampleAsyncStatusController],
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
    asyncStatusController = moduleFixture.get(ExampleAsyncStatusController);
    asyncInterceptor = moduleFixture.get(AsyncInterceptor);
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
    } as ExecutionContext;

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
