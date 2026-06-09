import { BaseFilter } from "./common.type";

export interface ICustomer {
  _id: string;
  name: string;
  whatsapp?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerListFilter extends BaseFilter<ICustomer> {
  
}

