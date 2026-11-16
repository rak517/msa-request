interface BuildHeaderOptions {
  authType: "bearer" | "apikey";
  authValue: string;
  customHeaders?: Record<string, string>;
}

export function buildHeader({ authType, authValue, customHeaders }: BuildHeaderOptions) {
  const authHeader: Record<string, string> =
    authType === "bearer" ? { Authorization: `Bearer ${authValue}` } : { "X-Api-Key": authValue };

  return {
    "Content-Type": "application/json",
    ...authHeader,
    ...customHeaders,
  };
}
