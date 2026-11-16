import { ApiError } from "./ApiError";
import { buildHeader } from "./request/buildHeader";
import { buildURL } from "./request/url";

interface ClientOptions {
  baseURL: string;
  authType: "bearer" | "apikey";
  auth: () => string | Promise<string>;
  unwrapData: (res: any) => any;
  unwrapError: (res: any) => any;
  timeout?: number;
}

export interface CallOptions {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
  params?: Record<string, unknown>;
  body?: unknown;
}

export function createClient(clientOptions: ClientOptions) {
  async function request(method: string, path: string, callOptions: CallOptions = {}) {
    const authValue = await clientOptions.auth();

    const url = buildURL({
      baseURL: clientOptions.baseURL,
      path,
      params: callOptions.params,
    });

    const signal =
      callOptions.signal ??
      AbortSignal.timeout(callOptions.timeout ?? clientOptions.timeout ?? 10000);

    const headers = buildHeader({
      authType: clientOptions.authType,
      authValue,
      customHeaders: callOptions.headers,
    });

    const response = await fetch(url, {
      method,
      headers,
      signal,
      body: callOptions.body ? JSON.stringify(callOptions.body) : undefined,
    });

    const text = await response.text();
    const json = text ? JSON.parse(text) : null;

    if (response.ok) {
      return clientOptions.unwrapData(json);
    } else {
      const message = clientOptions.unwrapError(json);
      throw new ApiError(message, response.status);
    }
  }

  return {
    get: (path: string, callOptions: CallOptions = {}) => request("GET", path, callOptions),
    post: (path: string, body: unknown, callOptions: CallOptions = {}) =>
      request("POST", path, { ...callOptions, body }),
    put: (path: string, body: unknown, callOptions: CallOptions = {}) =>
      request("PUT", path, { ...callOptions, body }),
    delete: (path: string, callOptions: CallOptions = {}) => request("DELETE", path, callOptions),
  };
}
