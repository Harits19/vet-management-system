import zod from "zod";
import { stringRequired } from "./zod";
import { NestedKeys } from "./common.type";
import { generateSortFilterSchema } from "./pagination";

export const customerSchema = zod.object({
  name: stringRequired,
  whatsapp: stringRequired.optional(),
  address: stringRequired.optional(),
});

export interface ICustomer extends zod.infer<typeof customerSchema> {}

type CustomerKey = NestedKeys<ICustomer>;

const listSort: CustomerKey[] = ["name"];

export const customerFilterSchema = generateSortFilterSchema({
  sortList: listSort,
  defaultSort: "name",
})
