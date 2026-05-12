import zod from 'zod'
import { stringRequired } from './zod'


export const petSchema = zod.object({
    name: stringRequired,
    kind: stringRequired,
    gender: zod.enum(["male", "female"]),
    notes: stringRequired.optional(),
    ownerId: stringRequired,

})

export interface IPet extends zod.infer<typeof petSchema> { }
