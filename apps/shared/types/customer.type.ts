import { z } from "zod";
import { BaseFilter } from "./common.type";
import { stringRequired } from "./zod";

export interface ICustomer {
  _id: string;
  name: string;
  whatsapp?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const customerCreateSchema = z.object({
  name: stringRequired,
  whatsapp: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export interface ICustomerCreateRequest extends z.infer<typeof customerCreateSchema> { }

export interface ICustomerListFilter extends BaseFilter<ICustomer> {

}
