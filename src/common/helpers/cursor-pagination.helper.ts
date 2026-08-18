import { BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { and, eq, lt, or, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

export type CursorPayload = {
  createdAt: Date;
  id: string;
};

export function encodeCursor(createdAt: Date, id: string) {
  return Buffer.from(
    JSON.stringify({ createdAt: createdAt.toISOString(), id }),
  ).toString('base64url');
}

export function decodeCursor(cursor: string): CursorPayload {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as { createdAt?: string; id?: string };

    if (!parsed.createdAt || !parsed.id || !isUUID(parsed.id)) {
      throw new Error('invalid');
    }

    const createdAt = new Date(parsed.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      throw new Error('invalid');
    }

    return { createdAt, id: parsed.id };
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
}

export function buildCursorCondition(
  createdAtColumn: PgColumn,
  idColumn: PgColumn,
  cursor: CursorPayload,
): SQL | undefined {
  return or(
    lt(createdAtColumn, cursor.createdAt),
    and(eq(createdAtColumn, cursor.createdAt), lt(idColumn, cursor.id)),
  );
}

export function sliceCursorPage<T extends { createdAt: Date; id: string }>(
  rows: T[],
  limit: number,
) {
  const hasNextPage = rows.length > limit;
  const items = hasNextPage ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];

  return {
    items,
    hasNextPage,
    nextCursor:
      hasNextPage && last ? encodeCursor(last.createdAt, last.id) : null,
  };
}
