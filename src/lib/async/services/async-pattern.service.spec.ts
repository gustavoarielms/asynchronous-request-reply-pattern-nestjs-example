import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ASYNC_JOB_NAME,
  ASYNC_PATTERN_QUEUE,
  ASYNC_STATUS_LOCATION_BASE_PATH,
  ASYNC_STATUS_STORE,
} from '../async.tokens';
import { AsyncPatternService } from './async-pattern.service';

describe('AsyncPatternService', () => {
  let service: AsyncPatternService;
  const queueMock = {
    add: jest.fn(),
    getJob: jest.fn(),
  };
  const asyncStatusStoreMock = {
    get: jest.fn(),
    setAccepted: jest.fn(),
    setActive: jest.fn(),
    setWaitingExternal: jest.fn(),
    setCompleted: jest.fn(),
    setFailed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsyncPatternService,
        {
          provide: ASYNC_STATUS_STORE,
          useValue: asyncStatusStoreMock,
        },
        {
          provide: ASYNC_PATTERN_QUEUE,
          useValue: queueMock,
        },
        {
          provide: ASYNC_JOB_NAME,
          useValue: 'processJob',
        },
        {
          provide: ASYNC_STATUS_LOCATION_BASE_PATH,
          useValue: 'async-status',
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
    asyncStatusStoreMock.get.mockResolvedValue(null);

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

  it('should not overwrite a status written by a fast worker while starting the process', async () => {
    queueMock.add.mockResolvedValue({ id: '123' });
    asyncStatusStoreMock.get.mockResolvedValue({
      status: 'waiting_external',
      result: 'Waiting for webhook',
      completed: false,
    });

    await expect(
      service.startProcess({ name: 'job', milliseconds: 0, mode: 'external' })
    ).resolves.toEqual({
      status: 'accepted',
      location: '/async-status/status/123',
    });
    expect(asyncStatusStoreMock.setAccepted).not.toHaveBeenCalled();
  });

  it('should build the accepted location using the configured status base path', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsyncPatternService,
        {
          provide: ASYNC_STATUS_STORE,
          useValue: asyncStatusStoreMock,
        },
        {
          provide: ASYNC_PATTERN_QUEUE,
          useValue: queueMock,
        },
        {
          provide: ASYNC_JOB_NAME,
          useValue: 'processJob',
        },
        {
          provide: ASYNC_STATUS_LOCATION_BASE_PATH,
          useValue: 'jobs',
        },
      ],
    }).compile();

    service = module.get<AsyncPatternService>(AsyncPatternService);
    queueMock.add.mockResolvedValue({ id: '321' });

    await expect(service.startProcess({ task: 'job' })).resolves.toEqual({
      status: 'accepted',
      location: '/jobs/status/321',
    });
  });

  it('should omit location when no public status endpoint is configured', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsyncPatternService,
        {
          provide: ASYNC_STATUS_STORE,
          useValue: asyncStatusStoreMock,
        },
        {
          provide: ASYNC_PATTERN_QUEUE,
          useValue: queueMock,
        },
        {
          provide: ASYNC_JOB_NAME,
          useValue: 'processJob',
        },
        {
          provide: ASYNC_STATUS_LOCATION_BASE_PATH,
          useValue: '',
        },
      ],
    }).compile();

    service = module.get<AsyncPatternService>(AsyncPatternService);
    queueMock.add.mockResolvedValue({ id: '654' });

    await expect(service.startProcess({ task: 'job' })).resolves.toEqual({
      status: 'accepted',
    });
  });

  it('should enqueue using the configured job name', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsyncPatternService,
        {
          provide: ASYNC_STATUS_STORE,
          useValue: asyncStatusStoreMock,
        },
        {
          provide: ASYNC_PATTERN_QUEUE,
          useValue: queueMock,
        },
        {
          provide: ASYNC_JOB_NAME,
          useValue: 'orders.create',
        },
        {
          provide: ASYNC_STATUS_LOCATION_BASE_PATH,
          useValue: '',
        },
      ],
    }).compile();

    service = module.get<AsyncPatternService>(AsyncPatternService);
    queueMock.add.mockResolvedValue({ id: '999' });

    await service.startProcess({ orderId: '123' });

    expect(queueMock.add).toHaveBeenCalledWith('orders.create', {
      orderId: '123',
    });
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

  it('should preserve an empty-string completed result', async () => {
    asyncStatusStoreMock.get.mockResolvedValue(null);
    queueMock.getJob.mockResolvedValue({
      getState: jest.fn().mockResolvedValue('completed'),
      returnvalue: '',
      failedReason: null,
    });

    await expect(service.getStatus('123')).resolves.toEqual({
      status: 'completed',
      result: '',
      completed: true,
    });
    expect(asyncStatusStoreMock.setCompleted).toHaveBeenCalledWith('123', '');
  });

  it('should preserve a numeric completed result', async () => {
    asyncStatusStoreMock.get.mockResolvedValue(null);
    queueMock.getJob.mockResolvedValue({
      getState: jest.fn().mockResolvedValue('completed'),
      returnvalue: 0,
      failedReason: null,
    });

    await expect(service.getStatus('123')).resolves.toEqual({
      status: 'completed',
      result: 0,
      completed: true,
    });
    expect(asyncStatusStoreMock.setCompleted).toHaveBeenCalledWith('123', 0);
  });

  it('should preserve a boolean completed result', async () => {
    asyncStatusStoreMock.get.mockResolvedValue(null);
    queueMock.getJob.mockResolvedValue({
      getState: jest.fn().mockResolvedValue('completed'),
      returnvalue: false,
      failedReason: null,
    });

    await expect(service.getStatus('123')).resolves.toEqual({
      status: 'completed',
      result: false,
      completed: true,
    });
    expect(asyncStatusStoreMock.setCompleted).toHaveBeenCalledWith('123', false);
  });

  it('should preserve a null completed result', async () => {
    asyncStatusStoreMock.get.mockResolvedValue(null);
    queueMock.getJob.mockResolvedValue({
      getState: jest.fn().mockResolvedValue('completed'),
      returnvalue: null,
      failedReason: null,
    });

    await expect(service.getStatus('123')).resolves.toEqual({
      status: 'completed',
      result: null,
      completed: true,
    });
    expect(asyncStatusStoreMock.setCompleted).toHaveBeenCalledWith('123', null);
  });

  it('should preserve an object completed result', async () => {
    asyncStatusStoreMock.get.mockResolvedValue(null);
    queueMock.getJob.mockResolvedValue({
      getState: jest.fn().mockResolvedValue('completed'),
      returnvalue: {
        orderId: 123,
        ok: true,
      },
      failedReason: null,
    });

    await expect(service.getStatus('123')).resolves.toEqual({
      status: 'completed',
      result: {
        orderId: 123,
        ok: true,
      },
      completed: true,
    });
    expect(asyncStatusStoreMock.setCompleted).toHaveBeenCalledWith('123', {
      orderId: 123,
      ok: true,
    });
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

  it('should return active when BullMQ reports active even if the store still says accepted', async () => {
    asyncStatusStoreMock.get.mockResolvedValue({
      status: 'accepted',
      result: 'Queued',
      completed: false,
    });
    queueMock.getJob.mockResolvedValue({
      getState: jest.fn().mockResolvedValue('active'),
      returnvalue: null,
      failedReason: null,
    });

    await expect(service.getStatus('123')).resolves.toEqual({
      status: 'active',
      result: 'Processing',
      completed: false,
    });
    expect(asyncStatusStoreMock.setActive).toHaveBeenCalledWith('123');
  });

  it('should preserve waiting external status even when the initial BullMQ job completed', async () => {
    asyncStatusStoreMock.get.mockResolvedValue({
      status: 'waiting_external',
      result: 'Waiting for provider webhook',
      completed: false,
    });
    queueMock.getJob.mockResolvedValue({
      getState: jest.fn().mockResolvedValue('completed'),
      returnvalue: null,
      failedReason: null,
    });

    await expect(service.getStatus('123')).resolves.toEqual({
      status: 'waiting_external',
      result: 'Waiting for provider webhook',
      completed: false,
    });
    expect(asyncStatusStoreMock.setCompleted).not.toHaveBeenCalled();
  });

  it('should preserve a completed store status when a webhook completes an external process', async () => {
    asyncStatusStoreMock.get.mockResolvedValue({
      status: 'completed',
      result: 'Webhook completed',
      completed: true,
    });
    queueMock.getJob.mockResolvedValue({
      getState: jest.fn().mockResolvedValue('completed'),
      returnvalue: null,
      failedReason: null,
    });

    await expect(service.getStatus('123')).resolves.toEqual({
      status: 'completed',
      result: 'Webhook completed',
      completed: true,
    });
    expect(asyncStatusStoreMock.setCompleted).not.toHaveBeenCalled();
  });

  it('should throw not found when the job does not exist', async () => {
    asyncStatusStoreMock.get.mockResolvedValue(null);
    queueMock.getJob.mockResolvedValue(null);

    await expect(service.getStatus('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
