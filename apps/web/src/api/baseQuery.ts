import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { mapApiError, type AppApiError } from '@/lib/apiError';

export type ApiRequest = {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  idempotencyKey?: string;
  auth?: boolean;
};

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export const apiBaseQuery: BaseQueryFn<ApiRequest, unknown, AppApiError> = async (args, api) => {
  const state = api.getState() as { session: { token: string | null } };
  const method = args.method ?? 'GET';
  const headers: Record<string, string> = {};

  if (args.body !== undefined) headers['Content-Type'] = 'application/json';
  if (args.auth !== false && state.session.token) {
    headers.Authorization = `Bearer ${state.session.token}`;
  }
  if (args.idempotencyKey) headers['Idempotency-Key'] = args.idempotencyKey;

  try {
    const response = await fetch(`${API_URL}${args.url}`, {
      method,
      headers,
      body: args.body === undefined ? undefined : JSON.stringify(args.body),
      signal: api.signal,
    });

    if (response.status === 204) return { data: undefined };

    const json: unknown = await response.json().catch(() => null);
    if (!response.ok) return { error: mapApiError(response.status, json) };

    if (json && typeof json === 'object' && 'data' in json) {
      return { data: (json as { data: unknown }).data };
    }
    return { data: json };
  } catch {
    if (api.signal.aborted) {
      return { error: { status: 0, code: 'ABORTED', message: 'Запрос отменён.' } };
    }
    return {
      error: {
        status: 0,
        code: 'NETWORK_ERROR',
        message: 'Нет связи с сервером. Проверьте подключение и повторите.',
      },
    };
  }
};
