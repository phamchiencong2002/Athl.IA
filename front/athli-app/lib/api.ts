export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const baseUrl = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');
console.log('[API] baseUrl:', baseUrl);

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token?: string;
  body?: Record<string, unknown> | unknown[] | FormData;
  headers?: Record<string, string>;
};

// Module-level refresh state so apiFetch can auto-refresh without importing AuthContext
let _refreshToken: string | null = null;
let _onTokensRefreshed: ((token: string, refreshToken: string) => void) | null = null;

export function setRefreshHandlers(
  refreshToken: string | null,
  onRefreshed: (token: string, refreshToken: string) => void,
) {
  _refreshToken = refreshToken;
  _onTokensRefreshed = onRefreshed;
}

async function doFetch(path: string, options: RequestOptions): Promise<Response> {
  const { method = 'GET', token, body, headers = {} } = options;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const requestHeaders: Record<string, string> = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
  return fetch(`${baseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
  });
}

export async function apiFetch<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  let response = await doFetch(path, options);

  // Auto-refresh on 401 when we have a refresh token
  if (response.status === 401 && _refreshToken && _onTokensRefreshed) {
    try {
      const refreshResponse = await doFetch('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: _refreshToken },
      });
      if (refreshResponse.ok) {
        const refreshData = (await refreshResponse.json()) as { token: string; refreshToken: string };
        _onTokensRefreshed(refreshData.token, refreshData.refreshToken);
        // Retry the original request with the new token
        response = await doFetch(path, { ...options, token: refreshData.token });
      }
    } catch {
      // Refresh failed — fall through and let the 401 surface to the caller
    }
  }

  const text = await response.text();
  console.log(`[API] ${options.method ?? 'GET'} ${path} → ${response.status}`, text.slice(0, 300));
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const apiMessage =
      (data as { error?: string; detail?: string })?.error ||
      (data as { error?: string; detail?: string })?.detail ||
      'API error';
    throw new ApiError(response.status, apiMessage, data);
  }

  return data as TResponse;
}
