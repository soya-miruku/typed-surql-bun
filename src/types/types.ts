import type { ConditionalExcept, ConditionalPick, ConditionalPickDeepOptions, EmptyObject, Except, IsEqual, Merge, ReadonlyKeysOf, SetOptional, SetRequired, Simplify, UnknownRecord } from "type-fest";

/**
Simplifies a type while including and/or excluding certain types from being simplified. Useful to improve type hints shown in editors. And also to transform an interface into a type to aide with assignability.

This type is **experimental** and was introduced as a result of this {@link https://github.com/sindresorhus/type-fest/issues/436 issue}. It should be used with caution.

@internal
@experimental
@see Simplify
@category Object
*/
export type ConditionalSimplify<Type, ExcludeType = never, IncludeType = unknown> = Type extends ExcludeType
	? Type
	: Type extends IncludeType
		? {[TypeKey in keyof Type]: Type[TypeKey]}
		: Type;

/**
Recursively simplifies a type while including and/or excluding certain types from being simplified.

This type is **experimental** and was introduced as a result of this {@link https://github.com/sindresorhus/type-fest/issues/436 issue}. It should be used with caution.

See {@link ConditionalSimplify} for usages and examples.

@internal
@experimental
@category Object
*/
export type ConditionalSimplifyDeep<Type, ExcludeType = never, IncludeType = unknown> = Type extends ExcludeType
	? Type
	: Type extends IncludeType
		? {[TypeKey in keyof Type]: ConditionalSimplifyDeep<Type[TypeKey], ExcludeType, IncludeType>}
		: Type;

/**
Used to mark properties that should be excluded.
*/
declare const conditionalPickDeepSymbol: unique symbol;

/**
Assert the condition according to the {@link ConditionalPickDeepOptions.condition|condition} option.
*/
type AssertCondition<Type, Condition, Options extends ConditionalPickDeepOptions> = Options['condition'] extends 'equality'
	? IsEqual<Type, Condition>
	: Type extends Condition
		? true
		: false;
export type Primitives = string | number | bigint | boolean;
export type IsUndefined<T> = undefined extends T ? true : false;
export type FunctionType = (...args: unknown[]) => unknown;
export type SameType<T1, T2> = T1 extends T2 ? (T2 extends T1 ? true : false) : false;
export type OfArray<T> = IsUndefined<T> extends true
  ? NonNullable<T> extends ReadonlyArray<infer U>
  ? {
    type: U;
    isReadonly: true;
    isUndefined: true;
    isPrimitive: NonNullable<U> extends Primitives ? true : false;
  }
  : NonNullable<T> extends (infer U)[]
  ? {
    type: U;
    isReadonly: false;
    isUndefined: true;
    isPrimitive: NonNullable<U> extends Primitives ? true : false;
  }
  : T
  : T extends ReadonlyArray<infer U>
  ? {
    type: U;
    isReadonly: true;
    isUndefined: false;
    isPrimitive: NonNullable<U> extends Primitives ? true : false;
  }
  : T extends (infer U)[]
  ? {
    type: U;
    isReadonly: false;
    isUndefined: false;
    isPrimitive: NonNullable<U> extends Primitives ? true : false;
  }
  : T;

export type UnionToIntersection<U> =
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I
  : never;
export type UnionToOvlds<U> = UnionToIntersection<
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  U extends any ? (f: U) => void : never
>;
export type PopUnion<U> = UnionToOvlds<U> extends (a: infer A) => void ? A
  : never;
export type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true;
export type UnionToArray<T, A extends unknown[] = []> = IsUnion<T> extends true
  ? UnionToArray<Exclude<T, PopUnion<T>>, [PopUnion<T>, ...A]>
  : [T, ...A];
export type SimplifyDeep<T> = T extends object ? {
  [KeyType in keyof T]: OfArray<T[KeyType]> extends { type: infer U }
  ? Simplify<U>[]
  : Simplify<T[KeyType]>;
}
  : T;

export type ContainsAllKeys<BaseType, CheckType> = {
  [Key in keyof CheckType]: Key extends keyof BaseType
  ? (BaseType[Key] extends CheckType[Key] ? true : false)
  : false;
} extends {
    [K in keyof CheckType]: true;
  } ? true
  : false;

export type ArrayToUnion<T> = T extends [infer A, ...infer B]
  ? A | ArrayToUnion<B>
  : never;
export type UnionToCommaString<T> = UnionToArray<T> extends
  [infer A, ...infer B]
  ? `${A & string}${B extends [] ? ""
  : `_${UnionToCommaString<ArrayToUnion<B>>}`}`
  : never;


export type RemoveReadonly<T> = Except<T, ReadonlyKeysOf<T>>

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type Constructor<T, Arguments extends any[] = any[]> = new (...arguments_: Arguments) => T;
export type LengthGreaterThanOne<T extends unknown[]> = T extends [unknown, unknown, ...unknown[]] ? true : false;
export type ConditionalPickDeep<
  Type,
  Condition,
  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  Options extends ConditionalPickDeepOptions = {},
> = ConditionalSimplifyDeep<ConditionalExcept<{
  [Key in keyof Type]: AssertCondition<Type[Key], Condition, Options> extends true
  ? Type[Key]
  : Type[Key] extends Array<infer U> ? ConditionalPickDeep<U, Condition, Options> : Type[Key] extends UnknownRecord
  ? ConditionalPickDeep<Type[Key], Condition, Options>
  : typeof conditionalPickDeepSymbol;
}, (typeof conditionalPickDeepSymbol | undefined) | EmptyObject>, never, UnknownRecord>;

export type DotPrefix<T extends string, Prefix extends string = "."> = T extends "" ? "" : `${Prefix}${T}`;

export type DotNestedKeys<T> = T extends IModel ? "" :
  (T extends object
  ? { [K in Exclude<keyof T, symbol>]
    : T[K] extends Array<infer R> ? `${K}` | `${K}${DotPrefix<DotNestedKeys<R>>}`
    : T[K] extends Date ? `${K}`
    : T[K] extends object ? `${K}` | `${K}${DotPrefix<DotNestedKeys<T[K]>>}`
    : `${K}${DotPrefix<DotNestedKeys<T[K]>>}`
    }[Exclude<keyof T, symbol>]
    : ""
  ) extends infer D ? Extract<D, string> : never;


export interface IModel {
  id: string;
  tableName: string;
}

export abstract class ModelBase implements IModel {
  public id!: string;
  public tableName!: string;
}

export type RecordLink<Name extends string> = `${Name}:${string}`

export type StaticModel = Constructor<IModel>;
export type IsModel<T> = T extends IModel ? T : T extends RecordLink<string> ? T : never;
export type OnlyModelsFields<T extends IModel, Basic = OnlyFields<T>> = ConditionalPick<Basic, IModel | IModel[] | RecordLink<string> | RecordLink<string>[]>;
export type ModelKeysDot<SubModel extends IModel> = DotNestedKeys<ConditionalPickDeep<Required<OnlyFields<SubModel>>, IModel | IModel[] | `${string}:${string}` | `${string}:${string}`[]>>
export type OnlyFields<T> = Simplify<{ [K in keyof T as K extends "table" | "fields" | "field" | "tableName" ? never : T[K] extends FunctionType ? never : K]: T[K]; }>;

export type TransformSelected<SubModel extends IModel,
  Key extends keyof Basic,
  FetchKeys,
  WithValue extends boolean | undefined = undefined,
  IgnoreRelations extends boolean | undefined = undefined,
  Basic = OnlyFields<SubModel>,
  R = ReadonlyKeysOf<Basic>,
  A = Pick<AsBasicModel<Basic>, IgnoreRelations extends true ? Exclude<Key, R> : Key>,
  B = Pick<Basic, (IgnoreRelations extends true ? Exclude<FetchKeys, R> : FetchKeys) & keyof Basic>,
> = WithValue extends true ? Merge<A, B>[keyof Merge<A, B>] : Merge<A, B>

export type AsBasicModel<T> = {
  [P in keyof T]: T[P] extends IModel
  ? string
  : T[P] extends IModel[]
  ? string[]
  : T[P] extends Date
  ? T[P]
  : T[P] extends object
  ? AsBasicModel<T[P]>
  : OfArray<T[P]> extends { type: infer U }
  ? AsBasicModel<U>[]
  : T[P];
};

export type NonNullableVersion<SubModel> = SetRequired<SubModel, keyof ConditionalPick<SubModel, IModel | (IModel | undefined)>>

export type AsBoth<T> = {
  [P in keyof T]: T[P] extends IModel | (IModel | undefined)
  ? string | T[P]
  : T[P] extends OfArray<IModel>
  ? string[] | T[P][]
  : T[P] extends Date
  ? T[P]
  : T[P] extends object
  ? AsBasicModel<T[P]>
  : OfArray<T[P]> extends { type: infer U }
  ? AsBasicModel<U>[]
  : T[P];
};

export type OptionalIdModel<T extends IModel> = SetOptional<T, "id">;
export type CreateInput<SubModel extends IModel, Optional = OptionalIdModel<SubModel>, Cleaned = RemoveReadonly<Optional>> = AsBoth<OnlyFields<Cleaned>>;
