import { Test, TestingModule } from '@nestjs/testing';
import { ASYNC_MODULE_OPTIONS, ASYNC_PATTERN_QUEUE } from '../async.tokens';
import { AsyncStatusResponse } from '../interfaces/http/async-status-response.interface';
import { AsyncStatusStoreService } from './async-status-store.service';

describe('AsyncStatusStoreService', () => {
  const redisClientMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const queueMock = {
    client: Promise.resolve(redisClientMock),
  };

  const buildService = async (
    moduleOptions?: Record<string, unknown>
  ): Promise<AsyncStatusStoreService> => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsyncStatusStoreService,
        {
          provide: ASYNC_PATTERN_QUEUE,
          useValue: queueMock,
        },
        ...(moduleOptions
          ? [
              {
                provide: ASYNC_MODULE_OPTIONS,
                useValue: moduleOptions,
              },
            ]
          : []),
      ],
    }).compile();

    return module.get<AsyncStatusStoreService>(AsyncStatusStoreService);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    redisClientMock.get.mockResolvedValue(null);
  });

  it('should store status entries with the configured TTL', async () => {
    const service = await buildService({
      statusTtlSeconds: 3600,
    });

    await service.setAccepted('123');

    expect(redisClientMock.set).toHaveBeenCalledWith(
      'async:status:123',
      JSON.stringify({
        status: 'accepted',
        result: 'Queued',
        completed: false,
      }),
      'EX',
      3600
    );
  });

  it('should allow disabling expiration for the default status store', async () => {
    const service = await buildService({
      statusTtlSeconds: null,
    });

    await service.setAccepted('123');

    expect(redisClientMock.set).toHaveBeenCalledWith(
      'async:status:123',
      JSON.stringify({
        status: 'accepted',
        result: 'Queued',
        completed: false,
      })
    );
  });

  it('should store structured completed results as JSON', async () => {
    const service = await buildService();

    await service.setCompleted('123', {
      orderId: 123,
      ok: true,
      items: ['a', 'b'],
    });

    expect(redisClientMock.set).toHaveBeenCalledWith(
      'async:status:123',
      JSON.stringify({
        status: 'completed',
        result: {
          orderId: 123,
          ok: true,
          items: ['a', 'b'],
        },
        completed: true,
      }),
      'EX',
      86400
    );
  });

  it('returns null when a status entry does not exist', async () => {
    const service = await buildService();

    await expect(service.get('missing')).resolves.toBeNull();
    expect(redisClientMock.get).toHaveBeenCalledWith('async:status:missing');
  });

  it('parses a stored status entry from Redis', async () => {
    const storedStatus: AsyncStatusResponse = {
      status: 'failed',
      result: 'boom',
      completed: true,
    };
    redisClientMock.get.mockResolvedValueOnce(JSON.stringify(storedStatus));
    const service = await buildService();

    await expect(service.get('123')).resolves.toEqual(storedStatus);
    expect(redisClientMock.get).toHaveBeenCalledWith('async:status:123');
  });

  it('stores the active status using the default TTL', async () => {
    const service = await buildService();

    await service.setActive('123');

    expect(redisClientMock.set).toHaveBeenCalledWith(
      'async:status:123',
      JSON.stringify({
        status: 'active',
        result: 'Processing',
        completed: false,
      }),
      'EX',
      86400
    );
  });

  it('stores failed results using the default TTL', async () => {
    const service = await buildService();

    await service.setFailed('123', 'boom');

    expect(redisClientMock.set).toHaveBeenCalledWith(
      'async:status:123',
      JSON.stringify({
        status: 'failed',
        result: 'boom',
        completed: true,
      }),
      'EX',
      86400
    );
  });

  it('stores waiting external results using the default TTL', async () => {
    const service = await buildService();

    await service.setWaitingExternal('123', 'Waiting for provider webhook');

    expect(redisClientMock.set).toHaveBeenCalledWith(
      'async:status:123',
      JSON.stringify({
        status: 'waiting_external',
        result: 'Waiting for provider webhook',
        completed: false,
      }),
      'EX',
      86400
    );
  });
});
