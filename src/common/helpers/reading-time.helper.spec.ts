import { calculateReadingTime } from './reading-time.helper';

describe('calculateReadingTime', () => {
  it('uses 200 words per minute and rounds up', () => {
    expect(calculateReadingTime(Array(200).fill('word').join(' '))).toBe(1);
    expect(calculateReadingTime(Array(201).fill('word').join(' '))).toBe(2);
  });

  it('strips HTML tags before counting', () => {
    const html = `<p>${Array(200).fill('word').join(' ')}</p><div></div>`;
    expect(calculateReadingTime(html)).toBe(1);
  });

  it('normalizes whitespace and returns at least 1 minute', () => {
    expect(calculateReadingTime('  hello   world  ')).toBe(1);
    expect(calculateReadingTime('')).toBe(1);
    expect(calculateReadingTime('<p>   </p>')).toBe(1);
  });
});
