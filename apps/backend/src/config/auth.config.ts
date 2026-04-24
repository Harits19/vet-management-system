const DEFAULT_FRONTEND_ORIGINS = [
  "http://localhost:3002",
  "https://sf641vt8-3002.asse.devtunnels.ms",
];

const parseOrigins = (value?: string) =>
  value
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? DEFAULT_FRONTEND_ORIGINS;

export const frontendOrigins = parseOrigins(process.env.FRONTEND_ORIGINS);

export const isAllowedOrigin = (origin?: string) => {
  if (!origin) {
    return true;
  }

  return frontendOrigins.includes(origin);
};

export const isSecureRequest = () =>
  process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";

export const getCookieOptions = () => {
  const secure = isSecureRequest();

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? ("none" as const) : ("lax" as const),
    maxAge: 1000 * 60 * 60 * 24,
    path: "/",
  };
};
