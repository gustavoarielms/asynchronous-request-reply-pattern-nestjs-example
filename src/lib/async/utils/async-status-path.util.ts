export function normalizeStatusBasePath(statusBasePath: string): string {
  return statusBasePath.replace(/^\/+|\/+$/g, '');
}

export function buildStatusLocation(statusBasePath: string, jobId: string): string {
  return `/${normalizeStatusBasePath(statusBasePath)}/status/${jobId}`;
}
