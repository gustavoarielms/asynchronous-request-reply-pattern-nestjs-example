import { Test, TestingModule } from '@nestjs/testing';
import { ASYNC_PATTERN_START_PROCESS, ASYNC_STATUS_STORE } from '../../../../../src/lib/async/async.tokens';
import { AsyncInterceptor } from '../../../../../src/lib/async/interceptors/async.interceptor';
import { ExampleAsyncController } from './async.controller';

describe('ExampleAsyncController', () => {
  let controller: ExampleAsyncController;
  const asyncPatternStartProcessMock = {
    startProcess: jest.fn(),
  };
  const asyncStatusStoreMock = {
    setCompleted: jest.fn(),
  };

  beforeEach(async () => {
    asyncStatusStoreMock.setCompleted.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExampleAsyncController],
      providers: [
        AsyncInterceptor,
        {
          provide: ASYNC_PATTERN_START_PROCESS,
          useValue: asyncPatternStartProcessMock,
        },
        {
          provide: ASYNC_STATUS_STORE,
          useValue: asyncStatusStoreMock,
        },
      ],
    }).compile();

    controller = module.get<ExampleAsyncController>(ExampleAsyncController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should complete the async status from the webhook payload', async () => {
    await controller.handleWebhook('123', { result: 'Webhook completed' });

    expect(asyncStatusStoreMock.setCompleted).toHaveBeenCalledWith('123', 'Webhook completed');
  });
});
