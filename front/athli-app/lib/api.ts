// Shared API helper for calling the Express backend.
export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const baseUrl =
  (process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000").replace(/\/$/, "");

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string;
  body?: Record<string, unknown> | FormData;
  headers?: Record<string, string>;
};

export async function apiFetch<TResponse>(
  path: string,
  { method = "GET", token, body, headers = {} }: RequestOptions = {},
): Promise<TResponse> {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const requestHeaders: Record<string, string> = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: requestHeaders,
    body: body
      ? isFormData
        ? body
        : JSON.stringify(body)
      : undefined,
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const apiMessage =
      (data as { error?: string; detail?: string })?.error ||
      (data as { error?: string; detail?: string })?.detail ||
      "API error";
    throw new ApiError(response.status, apiMessage, data);
  }

  return data as TResponse;
}
