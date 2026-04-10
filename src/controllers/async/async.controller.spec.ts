import { Test, TestingModule } from '@nestjs/testing';
import { AsyncController } from './async.controller';
import { AsyncInterceptor } from '../../interceptors/async/async.interceptor';

describe('AsyncController', () => {
  let controller: AsyncController;
  const asyncPatternStartProcessMock = {
    startProcess: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AsyncController],
      providers: [
        AsyncInterceptor,
        {
          provide: 'IAsyncPatternStartProcess',
          useValue: asyncPatternStartProcessMock,
        },
      ],
    }).compile();

    controller = module.get<AsyncController>(AsyncController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
