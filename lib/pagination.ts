// lib/pagination.ts
import { NextRequest } from 'next/server';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  pagination: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

/**
 * Parse and validate offset pagination params from a request.
 */
export function parsePagination(req: NextRequest): PaginationParams {
  const { searchParams } = new URL(req.url);
  
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const rawLimit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Parse cursor pagination params.
 */
export function parseCursorPagination(req: NextRequest): CursorPaginationParams {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor') || undefined;
  const rawLimit = parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10);
  const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit || DEFAULT_LIMIT));
  return { cursor, limit };
}

/**
 * Build a paginated response object.
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);
  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

/**
 * Build a cursor-paginated response.
 * Fetches limit+1 items — if we get limit+1, there are more pages.
 */
export function buildCursorResponse<T extends { id: string }>(
  items: T[],
  limit: number
): CursorPaginatedResponse<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return {
    data,
    pagination: {
      limit,
      nextCursor,
      hasMore,
    },
  };
}

/**
 * Parse sort parameters safely.
 */
export function parseSort(
  req: NextRequest,
  allowedFields: string[],
  defaultField = 'createdAt',
  defaultDir: 'asc' | 'desc' = 'desc'
): Record<string, 'asc' | 'desc'> {
  const { searchParams } = new URL(req.url);
  const sortBy = searchParams.get('sortBy') || defaultField;
  const sortDir = (searchParams.get('sortDir') || defaultDir) as 'asc' | 'desc';

  const field = allowedFields.includes(sortBy) ? sortBy : defaultField;
  const dir = ['asc', 'desc'].includes(sortDir) ? sortDir : defaultDir;

  return { [field]: dir };
}
