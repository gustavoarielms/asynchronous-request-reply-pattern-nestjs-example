import { BadRequestException, PipeTransform } from '@nestjs/common';
import { AsyncRequestData } from '../interfaces/http/async-request-body.interface';

export class AsyncRequestPipe
  implements PipeTransform<unknown, AsyncRequestData>
{
  transform(value: unknown): AsyncRequestData {
    if (!value || typeof value !== 'object') {
      throw new BadRequestException('Async request data must be an object');
    }

    const data = value as Record<string, unknown>;
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    const milliseconds =
      typeof data.milliseconds === 'string' && data.milliseconds.trim()
        ? Number(data.milliseconds)
        : data.milliseconds;

    if (
      !name ||
      typeof milliseconds !== 'number' ||
      !Number.isFinite(milliseconds)
    ) {
      throw new BadRequestException(
        'Async request data requires a name and milliseconds',
      );
    }

    if (data.mode !== undefined && data.mode !== 'external') {
      throw new BadRequestException('Async request mode must be external');
    }

    if (
      data.externalStatusLookup !== undefined &&
      typeof data.externalStatusLookup !== 'boolean'
    ) {
      throw new BadRequestException('externalStatusLookup must be a boolean');
    }

    return {
      name,
      milliseconds,
      ...(data.mode === 'external' ? { mode: data.mode } : {}),
      ...(typeof data.externalStatusLookup === 'boolean'
        ? { externalStatusLookup: data.externalStatusLookup }
        : {}),
    };
  }
}
