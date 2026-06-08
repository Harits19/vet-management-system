import z from "zod";
import { Types } from "mongoose"


export const stringRequired = z.string().trim().min(1, "Required");
export const numberRequired = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) {
      return undefined;
    }
    return Number(val);
  },
  z.number().min(0, "Minimal 0"),
);

export const numberOptional = z.preprocess(
  (val) => {
    if (val === "" || val === null || val === undefined) {
      return undefined;
    }
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  },
  z.number().min(0).optional(), // 🔥 optional di sini
);


export const objectId = z
  .string().min(1)
  .refine(Types.ObjectId.isValid)
  .transform((id) => new Types.ObjectId(id));