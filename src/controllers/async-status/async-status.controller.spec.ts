import { Test, TestingModule } from '@nestjs/testing';
import { ExampleAsyncStatusController } from '../../example/controllers/async-status.controller';
import { ASYNC_PATTERN_GET_STATUS } from '../../lib/async/async.tokens';

describe('AsyncStatusController', () => {
  let controller: ExampleAsyncStatusController;
  const asyncPatternGetStatusMock = {
    getStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExampleAsyncStatusController],
      providers: [
        {
          provide: ASYNC_PATTERN_GET_STATUS,
          useValue: asyncPatternGetStatusMock,
        },
      ],
    }).compile();

    controller = module.get<ExampleAsyncStatusController>(ExampleAsyncStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
