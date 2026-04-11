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

  it('should enqueue the request data and return an accepted response', async () => {
    queueMock.add.mockResolvedValue({ id: '123' });

    await expect(
      service.startProcess({ name: 'job', milliseconds: 10 })
    ).resolves.toEqual({
      status: 'accepted',
      location: '/async-status/status/123',
    });
    expect(queueMock.add).toHaveBeenCalledWith('processJob', {
      name: 'job',
      milliseconds: 10,
    });
  });

  it('should return the queue state and result for an existing job', async () => {
    queueMock.getJob.mockResolvedValue({
      getState: jest.fn().mockResolvedValue('completed'),
      returnvalue: 'Processed data: job',
      failedReason: null,
    });

    await expect(service.getStatus('123')).resolves.toEqual({
      status: 'completed',
      result: 'Processed data: job',
    });
  });
});
