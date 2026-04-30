import { Test, TestingModule } from '@nestjs/testing';
import { ASYNC_PATTERN_START_PROCESS } from '../../../../../src/lib/async/async.tokens';
import { AsyncInterceptor } from '../../../../../src/lib/async/interceptors/async.interceptor';
import { ExampleAsyncController } from './async.controller';

describe('ExampleAsyncController', () => {
  let controller: ExampleAsyncController;
  const asyncPatternStartProcessMock = {
    startProcess: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExampleAsyncController],
      providers: [
        AsyncInterceptor,
        {
          provide: ASYNC_PATTERN_START_PROCESS,
          useValue: asyncPatternStartProcessMock,
        },
      ],
    }).compile();

    controller = module.get<ExampleAsyncController>(ExampleAsyncController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
