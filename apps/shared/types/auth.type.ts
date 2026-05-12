import z from "zod";
import { stringRequired } from "./zod";

export const authLoginSchema = z.object({
  email: stringRequired,
  password: stringRequired,
});

export interface AuthLoginRequest extends z.infer<typeof authLoginSchema> { }


export const cookieSchema = z.object({
  cookie: z.string()
})

export interface ICookie extends z.infer<typeof cookieSchema> { }



export interface CookieRequest extends ICookie { }
export interface CookieResponse extends ICookie { }

