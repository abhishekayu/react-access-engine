/**
 * Shared type utilities used across react-access-engine packages.
 */

/** Make specific keys of T required */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Extract string literal union from a readonly array */
export type ArrayElement<T extends readonly unknown[]> = T[number];

/** Deep partial type */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Ensure a type is not never */
export type IsNever<T> = [T] extends [never] ? true : false;
