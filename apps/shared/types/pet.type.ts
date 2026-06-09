import { stringRequired } from "./zod";
import { z } from 'zod'
export interface IPet {
    _id: string;
    name: string;
    kind: string;
    gender: "male" | "female";
    notes?: string;
    customerId: string;
}


export const petCreateSchema = z.object({
    name: stringRequired,
    kind: stringRequired,
    gender: z.enum(["male", "female"]),
    notes: z.string().optional(),
});



export interface IPetCreateRequest extends z.infer<typeof petCreateSchema> { }