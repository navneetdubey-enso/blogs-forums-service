import { normalizeOptionalText } from './blog-fields.helper';

describe('blog-fields.helper', () => {
  it('normalizes missing and whitespace text to null', () => {
    expect(normalizeOptionalText(undefined)).toBeNull();
    expect(normalizeOptionalText('   ')).toBeNull();
    expect(normalizeOptionalText(' Hello ')).toBe('Hello');
  });
});
