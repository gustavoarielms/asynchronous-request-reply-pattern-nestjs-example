import { Test, TestingModule } from '@nestjs/testing';
import { ASYNC_MODULE_OPTIONS, ASYNC_PATTERN_QUEUE } from '../async.tokens';
import { AsyncStatusStoreService } from './async-status-store.service';

describe('AsyncStatusStoreService', () => {
  const redisClientMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const queueMock = {
    client: Promise.resolve(redisClientMock),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should store status entries with the configured TTL', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsyncStatusStoreService,
        {
          provide: ASYNC_PATTERN_QUEUE,
          useValue: queueMock,
        },
        {
          provide: ASYNC_MODULE_OPTIONS,
          useValue: {
            statusTtlSeconds: 3600,
          },
        },
      ],
    }).compile();

    const service = module.get<AsyncStatusStoreService>(AsyncStatusStoreService);

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsyncStatusStoreService,
        {
          provide: ASYNC_PATTERN_QUEUE,
          useValue: queueMock,
        },
        {
          provide: ASYNC_MODULE_OPTIONS,
          useValue: {
            statusTtlSeconds: null,
          },
        },
      ],
    }).compile();

    const service = module.get<AsyncStatusStoreService>(AsyncStatusStoreService);

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
});
