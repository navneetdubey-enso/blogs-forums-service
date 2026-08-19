import { CommentsRepository } from './comments.repository';

describe('CommentsRepository.softDelete', () => {
  it('issues a recursive CTE that deletes a parent and its descendants', async () => {
    const execute = jest.fn().mockResolvedValue({
      rows: [{ id: 'parent-1' }, { id: 'child-1' }],
    });
    const repository = new CommentsRepository({
      db: { execute },
    } as never);

    const rows = await repository.softDelete('parent-1');

    expect(execute).toHaveBeenCalledTimes(1);
    expect(rows).toEqual([{ id: 'parent-1' }, { id: 'child-1' }]);
    const firstCall = execute.mock.calls[0] as unknown[] | undefined;
    const serialized = JSON.stringify(firstCall?.[0]);
    expect(serialized).toContain('comment_tree');
    expect(serialized).toContain('parent_comment_id');
  });
});
