import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';
import { AsyncPatternService } from '../../lib/async/services/async-pattern.service';
import { AsyncStatusStoreService } from '../../lib/async/services/async-status-store.service';

describe('AsyncService', () => {
  let service: AsyncPatternService;
  const queueMock = {
    add: jest.fn(),
    getJob: jest.fn(),
  };
  const asyncStatusStoreMock = {
    get: jest.fn(),
    setAccepted: jest.fn(),
    setActive: jest.fn(),
    setCompleted: jest.fn(),
    setFailed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsyncPatternService,
        {
          provide: AsyncStatusStoreService,
          useValue: asyncStatusStoreMock,
        },
        {
          provide: getQueueToken('async'),
          useValue: queueMock,
        },
      ],
    }).compile();

    service = module.get<AsyncPatternService>(AsyncPatternService);
    jest.clearAllMocks();
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
    expect(asyncStatusStoreMock.setAccepted).toHaveBeenCalledWith('123');
  });

  it('should return the queue state and result for an existing job', async () => {
    asyncStatusStoreMock.get.mockResolvedValue(null);
    queueMock.getJob.mockResolvedValue({
      getState: jest.fn().mockResolvedValue('completed'),
      returnvalue: 'Processed data: job',
      failedReason: null,
    });

    await expect(service.getStatus('123')).resolves.toEqual({
      status: 'completed',
      result: 'Processed data: job',
      completed: true,
    });
    expect(asyncStatusStoreMock.setCompleted).toHaveBeenCalledWith('123', 'Processed data: job');
  });

  it('should return a pending response for a queued job', async () => {
    asyncStatusStoreMock.get.mockResolvedValue(null);
    queueMock.getJob.mockResolvedValue({
      getState: jest.fn().mockResolvedValue('waiting'),
      returnvalue: null,
      failedReason: null,
    });

    await expect(service.getStatus('123')).resolves.toEqual({
      status: 'waiting',
      result: 'Processing',
      completed: false,
    });
  });

  it('should return the accepted status from the store when the job is not visible yet', async () => {
    asyncStatusStoreMock.get.mockResolvedValue({
      status: 'accepted',
      result: 'Queued',
      completed: false,
    });
    queueMock.getJob.mockResolvedValue(null);

    await expect(service.getStatus('123')).resolves.toEqual({
      status: 'accepted',
      result: 'Queued',
      completed: false,
    });
  });

  it('should throw not found when the job does not exist', async () => {
    asyncStatusStoreMock.get.mockResolvedValue(null);
    queueMock.getJob.mockResolvedValue(null);

    await expect(service.getStatus('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
