import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  MethodNotAllowedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom } from 'rxjs';
import { ASYNC_OPTIONS } from '../decorators/async.decorator';
import { AsyncModuleOptions } from '../interfaces/async-module-options.interface';
import { AsyncOptions } from '../interfaces/async-options.interface';
import { AsyncAcceptedResponse } from '../interfaces/http/async-accepted-response.interface';
import { IAsyncPatternStartProcess } from '../interfaces/services/async-pattern-start-process.interface';
import { AsyncInterceptor } from './async.interceptor';

describe('AsyncInterceptor', () => {
  const handler = jest.fn();
  const startProcess = jest.fn<Promise<AsyncAcceptedResponse>, [unknown]>();
  const reflector = {
    get: jest.fn<AsyncOptions | undefined, [string, unknown]>(),
  } as unknown as Reflector;

  const createContext = (request: { method?: string; body?: unknown }): ExecutionContext =>
    ({
      getHandler: () => handler,
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as unknown as ExecutionContext;

  const next = {} as CallHandler;

  const createInterceptor = (moduleOptions?: AsyncModuleOptions) =>
    new AsyncInterceptor(
      reflector,
      { startProcess } as unknown as IAsyncPatternStartProcess,
      moduleOptions
    );

  beforeEach(() => {
    jest.clearAllMocks();
    reflector.get = jest.fn().mockImplementation((key: string) => {
      if (key === ASYNC_OPTIONS) {
        return undefined;
      }

      return undefined;
    });
    startProcess.mockResolvedValue({
      status: 'accepted',
      location: '/async-status/status/1',
    });
  });

  it('starts the async process with the full body by default', async () => {
    const interceptor = createInterceptor();
    const body = {
      name: 'job',
      milliseconds: 100,
    };

    const response = await lastValueFrom(
      await interceptor.intercept(createContext({ method: 'post', body }), next)
    );

    expect(startProcess).toHaveBeenCalledWith(body);
    expect(response).toEqual({
      status: 'accepted',
      location: '/async-status/status/1',
    });
  });

  it('uses a configured payloadPath from decorator metadata', async () => {
    (reflector.get as jest.Mock).mockImplementation((key: string) => {
      if (key === ASYNC_OPTIONS) {
        return {
          payloadPath: 'data.attributes',
        } satisfies AsyncOptions;
      }

      return undefined;
    });

    const interceptor = createInterceptor();

    await lastValueFrom(
      await interceptor.intercept(
        createContext({
          method: 'POST',
          body: {
            data: {
              attributes: {
                orderId: '123',
              },
            },
          },
        }),
        next
      )
    );

    expect(startProcess).toHaveBeenCalledWith({
      orderId: '123',
    });
  });

  it('applies a configured pipe to the resolved payload before starting the process', async () => {
    const pipe = {
      transform: jest.fn().mockResolvedValue({
        orderId: 123,
      }),
    };

    (reflector.get as jest.Mock).mockImplementation((key: string) => {
      if (key === ASYNC_OPTIONS) {
        return {
          payloadPath: 'data.attributes',
          pipe,
        } satisfies AsyncOptions;
      }

      return undefined;
    });

    const interceptor = createInterceptor();
    const payload = {
      orderId: '123',
    };

    await lastValueFrom(
      await interceptor.intercept(
        createContext({
          method: 'POST',
          body: {
            data: {
              attributes: payload,
            },
          },
        }),
        next,
      ),
    );

    expect(pipe.transform).toHaveBeenCalledWith(payload, {
      type: 'body',
      metatype: undefined,
      data: 'data.attributes',
    });
    expect(startProcess).toHaveBeenCalledWith({
      orderId: 123,
    });
  });

  it('passes undefined pipe metadata data when the full body is used', async () => {
    const pipe = {
      transform: jest.fn().mockImplementation((value: unknown) => value),
    };

    (reflector.get as jest.Mock).mockImplementation((key: string) => {
      if (key === ASYNC_OPTIONS) {
        return {
          pipe,
        } satisfies AsyncOptions;
      }

      return undefined;
    });

    const interceptor = createInterceptor();
    const body = {
      name: 'job',
    };

    await lastValueFrom(
      await interceptor.intercept(
        createContext({ method: 'POST', body }),
        next,
      ),
    );

    expect(pipe.transform).toHaveBeenCalledWith(body, {
      type: 'body',
      metatype: undefined,
      data: undefined,
    });
    expect(startProcess).toHaveBeenCalledWith(body);
  });

  it('propagates HTTP errors from the pipe without starting the process', async () => {
    const error = new BadRequestException('Invalid async payload');
    const pipe = {
      transform: jest.fn().mockRejectedValue(error),
    };

    (reflector.get as jest.Mock).mockImplementation((key: string) => {
      if (key === ASYNC_OPTIONS) {
        return {
          pipe,
        } satisfies AsyncOptions;
      }

      return undefined;
    });

    const interceptor = createInterceptor();

    await expect(
      interceptor.intercept(
        createContext({ method: 'POST', body: { name: 'invalid' } }),
        next,
      ),
    ).rejects.toBe(error);

    expect(startProcess).not.toHaveBeenCalled();
  });

  it('propagates arbitrary pipe errors without starting the process', async () => {
    const error = new Error('Unexpected pipe failure');
    const pipe = {
      transform: jest.fn().mockImplementation(() => {
        throw error;
      }),
    };

    (reflector.get as jest.Mock).mockImplementation((key: string) => {
      if (key === ASYNC_OPTIONS) {
        return {
          pipe,
        } satisfies AsyncOptions;
      }

      return undefined;
    });

    const interceptor = createInterceptor();

    await expect(
      interceptor.intercept(
        createContext({ method: 'POST', body: { name: 'invalid' } }),
        next,
      ),
    ).rejects.toBe(error);

    expect(startProcess).not.toHaveBeenCalled();
  });

  it('rejects methods outside the default whitelist', async () => {
    const interceptor = createInterceptor();

    await expect(
      interceptor.intercept(createContext({ method: 'GET', body: { ok: true } }), next)
    ).rejects.toThrow(MethodNotAllowedException);

    expect(startProcess).not.toHaveBeenCalled();
  });

  it('uses module-level allowed methods when decorator options are absent', async () => {
    const interceptor = createInterceptor({
      defaultAllowedMethods: ['PUT'],
    });

    await lastValueFrom(
      await interceptor.intercept(createContext({ method: 'put', body: { ok: true } }), next)
    );

    expect(startProcess).toHaveBeenCalledWith({ ok: true });
  });

  it('lets decorator allowMethods override module defaults', async () => {
    (reflector.get as jest.Mock).mockImplementation((key: string) => {
      if (key === ASYNC_OPTIONS) {
        return {
          allowMethods: ['GET'],
        } satisfies AsyncOptions;
      }

      return undefined;
    });

    const interceptor = createInterceptor({
      defaultAllowedMethods: ['POST'],
    });

    await lastValueFrom(
      await interceptor.intercept(createContext({ method: 'GET', body: { ok: true } }), next)
    );

    expect(startProcess).toHaveBeenCalledWith({ ok: true });
  });

  it('throws when a payloadPath is configured but the body is not an object', async () => {
    (reflector.get as jest.Mock).mockImplementation((key: string) => {
      if (key === ASYNC_OPTIONS) {
        return {
          payloadPath: 'data',
        } satisfies AsyncOptions;
      }

      return undefined;
    });

    const interceptor = createInterceptor();

    await expect(
      interceptor.intercept(createContext({ method: 'POST', body: 'invalid' }), next)
    ).rejects.toThrow(new BadRequestException('Payload field "data" is required'));

    expect(startProcess).not.toHaveBeenCalled();
  });

  it('throws when a nested payloadPath cannot be resolved', async () => {
    const pipe = {
      transform: jest.fn(),
    };

    (reflector.get as jest.Mock).mockImplementation((key: string) => {
      if (key === ASYNC_OPTIONS) {
        return {
          payloadPath: 'data.attributes',
          pipe,
        } satisfies AsyncOptions;
      }

      return undefined;
    });

    const interceptor = createInterceptor();

    await expect(
      interceptor.intercept(
        createContext({
          method: 'POST',
          body: {
            data: null,
          },
        }),
        next
      )
    ).rejects.toThrow(new BadRequestException('Payload field "data.attributes" is required'));

    expect(startProcess).not.toHaveBeenCalled();
    expect(pipe.transform).not.toHaveBeenCalled();
  });

  it('throws when the request body is missing and no payloadPath is configured', async () => {
    const interceptor = createInterceptor();

    await expect(interceptor.intercept(createContext({ method: 'POST' }), next)).rejects.toThrow(
      new BadRequestException('Request body is required')
    );

    expect(startProcess).not.toHaveBeenCalled();
  });
});
