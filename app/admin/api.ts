// admin/api.ts

import { ApiResponse } from './types';

const API_BASE_URL = '/api/admin';
const DEFAULT_TIMEOUT_MS = 15_000;
const RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 500;

// ─── Error class that carries HTTP status ─────────────────────────────────────
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Parse error body regardless of shape ────────────────────────────────────
async function parseErrorBody(response: Response): Promise<{ message: string; details?: string }> {
  try {
    const body = await response.json();
    return {
      message: body.error || body.message || `HTTP ${response.status}`,
      details: body.details || body.issues
        ? JSON.stringify(body.issues ?? body.details)
        : undefined,
    };
  } catch {
    return { message: `HTTP ${response.status}: ${response.statusText}` };
  }
}

// ─── Fetch with timeout ───────────────────────────────────────────────────────
function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS
): { promise: Promise<Response>; abort: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const promise = fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );

  return { promise, abort: () => controller.abort() };
}

// ─── Retry wrapper (only on network errors, never on 4xx) ────────────────────
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  attempts = RETRY_ATTEMPTS
): Promise<Response> {
  for (let i = 0; i <= attempts; i++) {
    try {
      const { promise } = fetchWithTimeout(url, options);
      const response = await promise;

      // Don't retry client errors (4xx) — only server errors (5xx) or network failures
      if (response.status >= 400 && response.status < 500) return response;
      if (response.ok) return response;

      if (i < attempts) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (i + 1)));
        continue;
      }

      return response;
    } catch (err: unknown) {
  if (err instanceof Error) {
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out', 408);
    }
  }

  if (i < attempts) {
    await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (i + 1)));
    continue;
  }

  throw new ApiError('Network error — please check your connection', 0);
}
  }
  throw new ApiError('Request failed after retries', 500);
}

// ─── Public API client ────────────────────────────────────────────────────────
export const api = {
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetchWithRetry(`${API_BASE_URL}/upload-image`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });

    if (!response.ok) {
      const { message, details } = await parseErrorBody(response);
      throw new ApiError(message, response.status, details);
    }

    const data = await response.json();
    return data.url;
  },

  async fetchData<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    const queryString = new URLSearchParams(
      // Strip out empty/undefined values
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
    ).toString();

    const url = `${API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;

    const response = await fetchWithRetry(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!response.ok) {
      const { message, details } = await parseErrorBody(response);
      throw new ApiError(message, response.status, details);
    }

    return response.json();
  },

async saveData<T>(
  endpoint: string,
  data: unknown,           
  method: 'POST' | 'PUT' = 'POST'
): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetchWithRetry(
      url,
      {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      },
      0 // No retries for mutations
    );

    if (!response.ok) {
      const { message, details } = await parseErrorBody(response);
      throw new ApiError(message, response.status, details);
    }

    return response.json();
  },

  async deleteData(endpoint: string, id: string): Promise<ApiResponse> {
    const response = await fetchWithRetry(
      `${API_BASE_URL}${endpoint}/${id}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      },
      0 // No retries for mutations
    );

    if (!response.ok) {
      const { message, details } = await parseErrorBody(response);
      throw new ApiError(message, response.status, details);
    }

    return response.json();
  },

  async bulkImport(type: string, file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetchWithRetry(
      `${API_BASE_URL}/bulk-import`,
      {
        method: 'POST',
        credentials: 'include',
        body: formData,
      },
      0 // No retries for bulk mutations
    );

    if (!response.ok) {
      const { message, details } = await parseErrorBody(response);
      throw new ApiError(message, response.status, details);
    }

    return response.json();
  },

  async downloadTemplate(type: string): Promise<void> {
    const response = await fetchWithRetry(`${API_BASE_URL}/templates/${type}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      const { message } = await parseErrorBody(response);
      throw new ApiError(message, response.status);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.xlsx`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    // Clean up after next tick so the click registers
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  },
};

// ─── Type guard ───────────────────────────────────────────────────────────────
export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}