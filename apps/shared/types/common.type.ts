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
  T[K] extends object
  ? `${K}.${LeafNestedKeys<T[K]>}`
  : K;
}[keyof T & string];