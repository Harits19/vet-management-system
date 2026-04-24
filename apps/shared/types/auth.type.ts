import z from "zod";
import { stringRequired } from "./zod";

export const authLoginSchema = z.object({
  email: stringRequired,
  password: stringRequired,
});

export interface AuthLoginRequest extends z.infer<typeof authLoginSchema> {}
