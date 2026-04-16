import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "./auth";

export const getAuthUserFromRequest = async (req: NextRequest) => {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    return await verifyAuthToken(token);
  } catch (_error) {
    return null;
  }
};

export const getAuthUserFromCookies = async () => {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    return await verifyAuthToken(token);
  } catch (_error) {
    return null;
  }
};
