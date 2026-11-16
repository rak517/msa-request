import { buildHeader } from "./request/buildHeader";
import { buildURL } from "./request/url";

export function createClient(clientOptions) {
  async function request(method, path, callOptions) {
    const authValue = await clientOptions.auth();

    const url = buildURL({
      baseURL: clientOptions.baseURL,
      path,
      params: callOptions?.params,
    });

    const signal = callOptions?.signal ?? AbortSignal.timeout(callOptions?.timeout ?? clientOptions.timeout ?? 10000);

    const headers = buildHeader({ authType: clientOptions.authType, authValue, customHeaders: callOptions.headers });

    const response = await fetch(url, {
      method,
      headers,
      signal,
      body: callOptions.body ? JSON.stringify(callOptions.body) : undefined,
    });

    const text = await response.text();
    const json = text ? JSON.parse(text) : null;
  }

  return {
    get: (path, callOptions) => request("GET", path, callOptions),
    post: (path, body, callOptions) => request("POST", path, { ...callOptions, body }),
    put: (path, body, callOptions) => request("PUT", path, { ...callOptions, body }),
    delete: (path, callOptions) => request("DELETE", path, callOptions),
  };
}
