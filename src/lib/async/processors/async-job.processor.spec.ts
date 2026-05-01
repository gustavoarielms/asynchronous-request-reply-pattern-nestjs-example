import { Job } from 'bullmq';
import { IAsyncStatusStore } from '../interfaces/services/async-status-store.interface';
import { AsyncExecutionMode, AsyncJobProcessor } from './async-job.processor';

class TestAsyncJobProcessor extends AsyncJobProcessor<{ id: string }, string> {
  constructor(
    asyncStatusStore: IAsyncStatusStore,
    private readonly handler: (payload: { id: string }, job: Job<{ id: string }, string>) => Promise<string>,
    private readonly executionMode: AsyncExecutionMode = 'resolve_now',
    private readonly externalStarter: (
      payload: { id: string },
      job: Job<{ id: string }, string>
    ) => Promise<string | undefined> = async () => undefined
  ) {
    super(asyncStatusStore);
  }

  protected getExecutionMode(): AsyncExecutionMode {
    return this.executionMode;
  }

  protected resolve(
    payload: { id: string },
    job: Job<{ id: string }, string>
  ): Promise<string> {
    return this.handler(payload, job);
  }

  protected startExternal(
    payload: { id: string },
    job: Job<{ id: string }, string>
  ): Promise<string | undefined> {
    return this.externalStarter(payload, job);
  }
}

describe('AsyncJobProcessor', () => {
  const asyncStatusStore = {
    get: jest.fn(),
    setAccepted: jest.fn(),
    setActive: jest.fn(),
    setWaitingExternal: jest.fn(),
    setCompleted: jest.fn(),
    setFailed: jest.fn(),
  } as jest.Mocked<IAsyncStatusStore>;

  const createJob = (
    overrides: Partial<Job<{ id: string }, string>> = {}
  ): Job<{ id: string }, string> =>
    ({
      id: 'job-1',
      data: { id: '123' },
      ...overrides,
    }) as Job<{ id: string }, string>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets the job to active before executing business logic', async () => {
    const order: string[] = [];
    asyncStatusStore.setActive.mockImplementation(async () => {
      order.push('active');
    });
    const processor = new TestAsyncJobProcessor(asyncStatusStore, async payload => {
      order.push(`handle:${payload.id}`);
      return 'ok';
    });

    await processor.process(createJob());

    expect(order).toEqual(['active', 'handle:123']);
  });

  it('stores completed results and returns them', async () => {
    const processor = new TestAsyncJobProcessor(asyncStatusStore, async payload => `done:${payload.id}`);

    await expect(processor.process(createJob())).resolves.toBe('done:123');
    expect(asyncStatusStore.setCompleted).toHaveBeenCalledWith('job-1', 'done:123');
  });

  it('starts external work and stores the waiting status without resolving the job result', async () => {
    const startExternal = jest.fn(async payload => `waiting:${payload.id}`);
    const handler = jest.fn(async payload => `done:${payload.id}`);
    const processor = new TestAsyncJobProcessor(
      asyncStatusStore,
      handler,
      'wait_external',
      startExternal
    );

    await expect(processor.process(createJob())).resolves.toBeUndefined();

    expect(startExternal).toHaveBeenCalledWith(
      { id: '123' },
      expect.objectContaining({ id: 'job-1' })
    );
    expect(handler).not.toHaveBeenCalled();
    expect(asyncStatusStore.setWaitingExternal).toHaveBeenCalledWith('job-1', 'waiting:123');
    expect(asyncStatusStore.setCompleted).not.toHaveBeenCalled();
  });

  it('stores a default waiting message when external work does not return one', async () => {
    const processor = new TestAsyncJobProcessor(
      asyncStatusStore,
      async payload => `done:${payload.id}`,
      'wait_external'
    );

    await processor.process(createJob());

    expect(asyncStatusStore.setWaitingExternal).toHaveBeenCalledWith(
      'job-1',
      'Waiting for external response'
    );
  });

  it('stores the error message and rethrows original errors', async () => {
    const error = new Error('boom');
    const processor = new TestAsyncJobProcessor(asyncStatusStore, async () => {
      throw error;
    });

    await expect(processor.process(createJob())).rejects.toThrow(error);
    expect(asyncStatusStore.setFailed).toHaveBeenCalledWith('job-1', 'boom');
  });

  it('stores a fallback message for non-Error throws', async () => {
    const processor = new TestAsyncJobProcessor(asyncStatusStore, async () => {
      throw 'boom';
    });

    await expect(processor.process(createJob())).rejects.toBe('boom');
    expect(asyncStatusStore.setFailed).toHaveBeenCalledWith('job-1', 'Unexpected error');
  });
});
