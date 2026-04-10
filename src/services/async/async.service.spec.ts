import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { AsyncPatternService } from './async.service';

describe('AsyncService', () => {
  let service: AsyncPatternService;
  const queueMock = {
    add: jest.fn(),
    getJob: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsyncPatternService,
        {
          provide: getQueueToken('async'),
          useValue: queueMock,
        },
      ],
    }).compile();

    service = module.get<AsyncPatternService>(AsyncPatternService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
