// lib/apiHelpers.ts
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { Prisma } from '@/app/generated/prisma/client';

/** Standard success response */
export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

/** Standard error response */
export function err(
  message: string,
  status = 500,
  details?: unknown
): NextResponse {
  const body: Record<string, unknown> = { error: message };

  if (details && process.env.NODE_ENV !== 'production') {
    body.details = details;
  }

  return NextResponse.json(body, { status });
}
/** Convert Prisma Decimal fields to numbers recursively */
/** Convert Prisma Decimal fields to numbers recursively, preserving Dates as ISO strings */
export function serializeDecimals<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  // ✅ Must check Date BEFORE the generic object loop — Date is typeof 'object'
  // and iterating its keys produces nothing useful, mangling it into {}.
  if (obj instanceof Date) return obj.toISOString() as unknown as T;

  if (Array.isArray(obj)) return obj.map(serializeDecimals) as unknown as T;

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value !== null && typeof value === 'object' && 'toNumber' in value) {
      // Prisma Decimal
      result[key] = (value as { toNumber: () => number }).toNumber();
    } else {
      result[key] = serializeDecimals(value);
    }
  }
  return result as T;
}
/**
 * Centralised error handler — maps known error types to appropriate HTTP codes.
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  console.error(`[${context}]`, error);

  // Zod validation error
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        issues: error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 400 }
    );
  }

  // Prisma known request errors (unique, not-found, foreign key, etc.)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const fields = (error.meta?.target as string[])?.join(', ') ?? 'field';
        return NextResponse.json(
          { error: `A record with this ${fields} already exists` },
          { status: 409 }
        );
      }
      case 'P2025':
        return NextResponse.json(
          { error: 'Record not found' },
          { status: 404 }
        );
      case 'P2003':
        return NextResponse.json(
          { error: 'Referenced record does not exist' },
          { status: 400 }
        );
      case 'P2014':
        return NextResponse.json(
          { error: 'The change would violate a required relation' },
          { status: 400 }
        );
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json(
      { error: 'Invalid data provided' },
      { status: 400 }
    );
  }

  // Generic fallback
 const message =
    error instanceof Error ? error.message : 'An unexpected error occurred';
  return NextResponse.json({ error: message }, { status: 500 });
}
