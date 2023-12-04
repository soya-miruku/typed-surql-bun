import { type Static as TStatic, TSchema } from '@sinclair/typebox';
export { Type } from '@sinclair/typebox'
import { OnlyFields, IModel } from "./types/types.ts";
export type Static<T extends IModel | TSchema> = T extends TSchema ? TStatic<T> : OnlyFields<T>;
export type RecordOf<T extends IModel> = T | `${string}:${string}`;
export * from './model.ts';
export * from "./decerators.ts";
export * from "./permissions.ts";
export * from './scope.ts';
export * from "./token.ts";
export * from "./utils/query.ts";