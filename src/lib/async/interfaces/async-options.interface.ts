import type { PipeTransform } from '@nestjs/common';

export type AsyncAllowedMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface AsyncOptions {
  allowMethods?: AsyncAllowedMethod[];
  payloadPath?: string;
  pipe?: PipeTransform;
}
