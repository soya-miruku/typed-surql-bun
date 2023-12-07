import * as Types from '../types/opts.types';
import { IFieldParams } from "../decerators";
import { OfArray } from "../types";

export interface IFilterable<T> {
  parse(): string;
}

export type ParentItem = {
  key: string;
  parent: string;
  fieldItem: IFieldParams<any> | null;
  // relation: BasicRelationType | null;
};

export type OfDateOrNumberOperators = {
  eq?: number | Types.SDateTime;
  gt?: number | Types.SDateTime;
  gte?: number | Types.SDateTime;
  lt?: number | Types.SDateTime;
  lte?: number | Types.SDateTime;
};

export type OfStringOperators = {
  eq?: string;
  contains?: string[] | string;
  containsAny?: string[] | string;
  containsAll?: string[] | string;
  containsNone?: string[] | string;
};

export type ExtractRelevant<T> = OfArray<T> extends { type: infer U; isPrimitive: infer P }
  ? P extends true
  ? ExtractRelevant<U>
  : WhereSelector<U>
  : T extends Types.SDateTime | number
  ? OfDateOrNumberOperators | ((item: T) => boolean)
  : T extends string
  ? OfStringOperators | string
  : T extends boolean
  ? boolean
  : T extends object
  ? WhereSelector<T>
  : never;

export type WhereSelector<M> = M extends object
  ?
  | { AND: WhereSelector<M> }
  | { OR: WhereSelector<M> }
  | { NOT: WhereSelector<M> }
  | Partial<{
    [P in keyof M]: ExtractRelevant<M[P]>;
  }>
  : never;