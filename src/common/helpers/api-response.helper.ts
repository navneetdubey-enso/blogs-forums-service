export function apiSuccess<T>(
  statusCode: number,
  message: string,
  data: T,
  extras?: Record<string, unknown>,
) {
  return {
    statusCode,
    success: true as const,
    message,
    data,
    ...extras,
  };
}
