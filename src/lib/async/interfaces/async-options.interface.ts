export type AsyncAllowedMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface AsyncOptions {
  allowMethods?: AsyncAllowedMethod[];
  payloadPath?: string;
}
