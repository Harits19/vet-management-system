import { z } from 'zod'
import { customerCreateSchema, petCreateSchema } from '../../../../../../shared/types';
export const createFormSchema = customerCreateSchema.extend({
    pets: z.array(petCreateSchema).optional(),
});

export type CustomerCreateForm = z.infer<typeof createFormSchema>;
