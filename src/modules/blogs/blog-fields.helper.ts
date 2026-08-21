export const BLOG_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

export function requiresCompleteBlogFields(status?: BlogStatus) {
  return status === 'PENDING_REVIEW' || status === 'PUBLISHED';
}

export function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
