export type NestedKeys<T> = {
  [K in keyof T & string]: T[K] extends object
    ? K | `${K}.${NestedKeys<T[K]>}`
    : K;
}[keyof T & string];


export type LeafNestedKeys<T> = {
  [K in keyof T & string]:
    T[K] extends object
      ? `${K}.${LeafNestedKeys<T[K]>}`
      : K;
}[keyof T & string];