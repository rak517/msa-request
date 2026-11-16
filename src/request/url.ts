interface BuildURLOptions {
  baseURL: string;
  path: string;
  params?: Record<string, unknown>;
}

export function buildURL({ baseURL, path, params }: BuildURLOptions): URL {
  const url = new URL(path, baseURL);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}
