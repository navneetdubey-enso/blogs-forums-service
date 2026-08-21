import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateBlogDto } from './create-blog.dto';
import { UpdateBlogDto } from './update-blog.dto';

async function validateCreate(plain: Record<string, unknown>) {
  const dto = plainToInstance(CreateBlogDto, plain);
  return validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
}

async function validateUpdate(plain: Record<string, unknown>) {
  const dto = plainToInstance(UpdateBlogDto, plain);
  return validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
}

describe('CreateBlogDto', () => {
  it('allows omitted status as an incomplete draft', async () => {
    expect(await validateCreate({})).toHaveLength(0);
  });

  it('allows explicit empty DRAFT', async () => {
    expect(await validateCreate({ status: 'DRAFT' })).toHaveLength(0);
  });

  it('allows DRAFT with only title', async () => {
    expect(
      await validateCreate({ title: 'My Draft', status: 'DRAFT' }),
    ).toHaveLength(0);
  });

  it('rejects PENDING_REVIEW with missing title', async () => {
    const errors = await validateCreate({
      slug: 'approval-test',
      content: 'Complete blog content.',
      status: 'PENDING_REVIEW',
    });
    expect(errors.some((error) => error.property === 'title')).toBe(true);
  });

  it('rejects PENDING_REVIEW with missing slug', async () => {
    const errors = await validateCreate({
      title: 'Approval Test',
      content: 'Complete blog content.',
      status: 'PENDING_REVIEW',
    });
    expect(errors.some((error) => error.property === 'slug')).toBe(true);
  });

  it('rejects PENDING_REVIEW with missing content', async () => {
    const errors = await validateCreate({
      title: 'Approval Test',
      slug: 'approval-test',
      status: 'PENDING_REVIEW',
    });
    expect(errors.some((error) => error.property === 'content')).toBe(true);
  });

  it('accepts complete PENDING_REVIEW', async () => {
    expect(
      await validateCreate({
        title: 'Approval Test',
        slug: 'approval-test-2026',
        content: 'Complete blog content.',
        status: 'PENDING_REVIEW',
      }),
    ).toHaveLength(0);
  });

  it('rejects unknown action field', async () => {
    const errors = await validateCreate({
      status: 'DRAFT',
      action: 'SAVE_DRAFT',
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('UpdateBlogDto', () => {
  it('allows incomplete DRAFT patches', async () => {
    expect(await validateUpdate({ title: 'Only title' })).toHaveLength(0);
  });

  it('requires title, slug, and content when patching to PENDING_REVIEW', async () => {
    const errors = await validateUpdate({ status: 'PENDING_REVIEW' });
    const properties = errors.map((error) => error.property);
    expect(properties).toEqual(
      expect.arrayContaining(['title', 'slug', 'content']),
    );
  });

  it('accepts a complete PENDING_REVIEW patch', async () => {
    expect(
      await validateUpdate({
        title: 'Approval Test',
        slug: 'approval-test-2026',
        content: 'Complete blog content.',
        status: 'PENDING_REVIEW',
      }),
    ).toHaveLength(0);
  });
});
