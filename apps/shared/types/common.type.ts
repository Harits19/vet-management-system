import { Types } from "mongoose";
type Primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | null
  | undefined
  | Date
  | Types.ObjectId;

export type NestedKeys<T> = {
  [K in keyof T & string]:
  T[K] extends Primitive
  ? K
  : K | `${K}.${NestedKeys<T[K]>}`
}[keyof T & string];

export type LeafNestedKeys<T> = {
  [K in keyof T & string]:
  T[K] extends Primitive
  ? K
  : `${K}.${LeafNestedKeys<T[K]>}`;
}[keyof T & string];

export interface BaseFilter<T, TSort extends NestedKeys<T> = NestedKeys<T>> {
  page: number;
  limit: number;
  search: string;
  sortBy: TSort;
  order: "asc" | "desc";
}
