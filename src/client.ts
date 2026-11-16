import { buildURL } from "./request/url";

export function createClient(clientOptions) {
  async function request(method, path, callOptions) {
    const authValue = await clientOptions.auth();

    const url = buildURL({
      baseURL: clientOptions.baseURL,
      path,
      params: callOptions?.params,
    });

    const headers = buildHeader({ authType: clientOptions.authType, authValue, customHeaders: callOptions.headers });
  }

  return {
    get: (path, callOptions) => request("GET", path, callOptions),
    post: (path, body, callOptions) => request("POST", path, { ...callOptions, body }),
    put: (path, body, callOptions) => request("PUT", path, { ...callOptions, body }),
    delete: (path, callOptions) => request("DELETE", path, callOptions),
  };
}
