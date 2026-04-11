import { CallHandler, ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { lastValueFrom } from 'rxjs';
import { of } from 'rxjs';
import { AsyncController } from '../src/controllers/async/async.controller';
import { AsyncStatusController } from '../src/controllers/async-status/async-status.controller';
import { AsyncInterceptor } from '../src/interceptors/async/async.interceptor';
import { AsyncAcceptedResponse } from '../src/interfaces/http/async/async-accepted-response.interface';
import { AsyncStatusResponse } from '../src/interfaces/http/async/async-status-response.interface';

describe('Async flow integration', () => {
  let app: INestApplication;
  let asyncController: AsyncController;
  let asyncStatusController: AsyncStatusController;
  let asyncInterceptor: AsyncInterceptor;

  const asyncPatternStartProcessMock = {
    startProcess: jest.fn<Promise<AsyncAcceptedResponse>, []>(),
  };
  const asyncPatternGetStatusMock = {
    getStatus: jest.fn<Promise<AsyncStatusResponse>, []>(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AsyncController, AsyncStatusController],
      providers: [
        AsyncInterceptor,
        {
          provide: 'IAsyncPatternStartProcess',
          useValue: asyncPatternStartProcessMock,
        },
        {
          provide: 'IAsyncPatternGetStatus',
          useValue: asyncPatternGetStatusMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    asyncController = moduleFixture.get(AsyncController);
    asyncStatusController = moduleFixture.get(AsyncStatusController);
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
    });

    await expect(asyncStatusController.getStatus('123')).resolves.toEqual({
      status: 'completed',
      result: 'Processed data: job',
    });
    expect(asyncPatternGetStatusMock.getStatus).toHaveBeenCalledWith('123');
  });
});
