import { sql } from 'drizzle-orm';
import { BlogsRepository } from './blogs.repository';

describe('BlogsRepository full-text search', () => {
  it('refreshes search_vector with to_tsvector for the same blog id', async () => {
    const execute = jest.fn().mockResolvedValue(undefined);
    const repository = new BlogsRepository({
      db: { execute },
    } as never);

    await repository.refreshSearchVector('blog-1');

    expect(execute).toHaveBeenCalledTimes(1);
    const firstCall = execute.mock.calls[0] as unknown[] | undefined;
    const serialized = JSON.stringify(firstCall?.[0] ?? sql``);
    expect(serialized).toContain('to_tsvector');
    expect(serialized).toContain('search_vector');
    expect(serialized).toContain('english');
  });
});
