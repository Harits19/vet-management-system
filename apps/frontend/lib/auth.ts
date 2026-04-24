export const FRONTEND_AUTH_COOKIE = "frontend_auth";

const isHttps = () =>
  typeof window !== "undefined" && window.location.protocol === "https:";

export const setFrontendAuthCookie = () => {
  if (typeof document === "undefined") {
    return;
  }

  const secure = isHttps() ? "; Secure" : "";
  document.cookie = `${FRONTEND_AUTH_COOKIE}=1; Path=/; SameSite=Lax${secure}`;
};

export const clearFrontendAuthCookie = () => {
  if (typeof document === "undefined") {
    return;
  }

  const secure = isHttps() ? "; Secure" : "";
  document.cookie = `${FRONTEND_AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
};
