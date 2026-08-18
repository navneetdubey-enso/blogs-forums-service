const WORDS_PER_MINUTE = 200;

export function calculateReadingTime(content: string): number {
  const text = content
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const wordCount = text === '' ? 0 : text.split(' ').length;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
