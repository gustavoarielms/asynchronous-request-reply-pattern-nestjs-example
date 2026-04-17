import { Test, TestingModule } from '@nestjs/testing';
import { ASYNC_PATTERN_GET_STATUS } from '../../lib/async/async.tokens';
import { createAsyncStatusController } from '../../lib/async/controllers/async-status.controller';

describe('AsyncStatusController', () => {
  const AsyncStatusController = createAsyncStatusController('async-status');
  let controller: InstanceType<typeof AsyncStatusController>;
  const asyncPatternGetStatusMock = {
    getStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AsyncStatusController],
      providers: [
        {
          provide: ASYNC_PATTERN_GET_STATUS,
          useValue: asyncPatternGetStatusMock,
        },
      ],
    }).compile();

    controller = module.get<InstanceType<typeof AsyncStatusController>>(AsyncStatusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
