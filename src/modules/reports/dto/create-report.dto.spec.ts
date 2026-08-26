import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateReportDto } from './create-report.dto';

async function validateCreate(plain: Record<string, unknown>) {
  const dto = plainToInstance(CreateReportDto, plain);
  return validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
}

describe('CreateReportDto', () => {
  it('accepts a predefined reason', async () => {
    expect(await validateCreate({ reason: 'SPAM' })).toHaveLength(0);
  });

  it('accepts an optional description', async () => {
    expect(
      await validateCreate({
        reason: 'OTHER',
        description: 'Additional context',
      }),
    ).toHaveLength(0);
  });

  it('rejects a missing reason', async () => {
    const errors = await validateCreate({});
    expect(errors.some((error) => error.property === 'reason')).toBe(true);
  });

  it('rejects an invalid reason', async () => {
    const errors = await validateCreate({ reason: 'NOT_A_REASON' });
    expect(errors.some((error) => error.property === 'reason')).toBe(true);
  });
});
