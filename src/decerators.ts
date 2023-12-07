import "reflect-metadata";
import { Kind, Optional, TObject, TProperties, TRecord } from "@sinclair/typebox";
import type { OnlyFields, StaticModel, Constructor, IModel, DotNestedKeys, FunctionType } from "./types/types.ts";
import type { Class } from "type-fest";

export type ITable<SubModel extends IModel, K extends keyof SubModel = keyof SubModel, P = keyof OnlyFields<SubModel> & K> = {
  name: string;
  indexes?: { columns: P[], suffix?: string, unique?: boolean, search?: boolean };
};

export type DirViaOptions<Via extends StaticModel> = "->" | "<-" | ".*" | `.*.${DotNestedKeys<Via extends Constructor<infer V> ? OnlyFields<V> : never>}`;
export type DirToOptions<DirTo> = DirTo extends "->" | "<-" ? StaticModel : never;

export type IRelationParams<From extends IModel, Via extends StaticModel, To extends StaticModel> = {
  from: From;
  via: Via;
  to?: To;
  dirVia: DirViaOptions<Via>;
  select?: DirViaOptions<Via> | "->" | "<-";
};

export type ObjType = Record<string, { type: ObjType, required: boolean, name: string, isObject: boolean }>;
export type TypeValue = Class<unknown> | string | ObjType
export type RecursiveArray<TValue> = Array<RecursiveArray<TValue> | TValue>;
export type ReturnTypeFuncValue = TypeValue | RecursiveArray<TypeValue> | TObject | TProperties;
// biome-ignore lint/suspicious/noConfusingVoidType: <explanation>
export type ReturnTypeFunc = (returns?: void) => ReturnTypeFuncValue;

export type IFieldParams<SubModel extends IModel> = {
  name: keyof SubModel;
  type?: TypeValue;
  typeName?: string;
  isArray: boolean;
  isObject: boolean;
  index?: { name: string, unique?: boolean, search?: boolean };
  params?: IRelationParams<SubModel, StaticModel, StaticModel>;
};

export interface IFieldProps<SubModel extends IModel> {
  index?: { name: string, unique?: boolean, search?: boolean }
}

export function table<SubModel extends IModel>(props?: ITable<SubModel, keyof SubModel>) {
  return (ctor: Constructor<SubModel>) => {
    Reflect.defineMetadata('table', { name: props?.name ?? ctor.name, indexes: props?.indexes }, ctor);
  }
}

function parseTObject<T extends TObject | TRecord>(t: T) {
  const properties: ObjType | Record<string, any> = {};
  const kind = t[Kind] === "Record" ? "Record" : "Object";
  for (const [k, v] of Object.entries(kind === "Record" ? t.patternProperties as T['properties'] : t.properties as T['properties'])) {
    const val = v as any;
    if (val.type === "object") {
      properties[k] = { type: parseTObject(v as TObject), required: val[Optional] !== "Optional", name: k, isObject: true, isArray: false };
      continue;
    }
    properties[k] = { type: val.type, required: val[Optional] !== "Optional", name: k, isObject: val.type === "object", isArray: val.type === "array" };
  }

  return properties;
}


export interface TypeDecoratorParams<T> {
  options: Partial<T>;
  returnTypeFunc?: ReturnTypeFunc;
}

export function getTypeDecoratorParams<T extends object>(returnTypeFuncOrOptions: ReturnTypeFunc | T | undefined, maybeOptions: T | undefined): TypeDecoratorParams<T> {
  if (typeof returnTypeFuncOrOptions === "function") {
    return {
      returnTypeFunc: returnTypeFuncOrOptions as ReturnTypeFunc,
      options: maybeOptions || {},
    };
  }
  return {
    options: returnTypeFuncOrOptions || {},
  };
}

function findTypeValueArrayDepth([typeValueOrArray]: RecursiveArray<TypeValue>, innerDepth = 1): { depth: number; returnType: TypeValue } {
  if (!Array.isArray(typeValueOrArray)) {
    return { depth: innerDepth, returnType: typeValueOrArray };
  }
  return findTypeValueArrayDepth(typeValueOrArray, innerDepth + 1);
}

function isTypeboxType(value: any): boolean {
  return typeof value === 'object' && value !== null && Kind in value;
}

function findType(returnTypeFunc: ReturnTypeFunc): { type: TypeValue, options: { isArray: boolean, isObject: boolean, arrayDepth: number } } {
  const options: { isArray: boolean, isObject: boolean, arrayDepth: number } = { isArray: false, isObject: false, arrayDepth: 0 };

  const getType = () => {
    const typeval = returnTypeFunc();

    if (Array.isArray(typeval)) {
      const { depth, returnType } = findTypeValueArrayDepth(typeval);
      options.arrayDepth = depth;
      options.isArray = true;

      if (isTypeboxType(returnType))
        return parseTObject(returnType as TObject);

      return returnType;
    }

    if (isTypeboxType(typeval)) {
      return parseTObject(typeval as TObject);
    }

    return typeval;
  }

  const type = getType();
  return { type, options };
}

export function prop<SubModel extends IModel>(_type?: ReturnTypeFunc, fieldProps?: IFieldProps<SubModel>) {
  return (target: SubModel, propertyKey: keyof SubModel) => {
    if (typeof propertyKey === "symbol") {
      throw new Error("Symbol properties are not supported");
    }

    const name = propertyKey;
    const fields: IFieldParams<SubModel>[] = Reflect.getMetadata("fields", target.constructor, target.constructor.name) || [];
    let field: IFieldParams<SubModel>;
    if (_type) {
      const { type, options } = findType(_type);
      field = {
        name,
        isArray: options.isArray,
        isObject: options.isObject,
        type,
        typeName: type instanceof Function ? type.name : typeof type === "string" ? type : "Object",
        index: fieldProps?.index,
      }
    } else {
      const type = Reflect.getMetadata("design:type", target, propertyKey.toString());
      field = {
        name,
        isObject: type?.name === "Object",
        isArray: Array.isArray(type) || type?.name === "Array",
        type,
        typeName: type instanceof Function ? type.name : type,
        index: fieldProps?.index,
      }
    }

    fields.push(field);
    Reflect.defineMetadata("fields", fields, target.constructor, target.constructor.name);
    Reflect.defineMetadata("field", field, target.constructor, propertyKey.toString());
  }
}

export function idx() {
  return <SubModel extends IModel>(target: SubModel, propertyKey: keyof SubModel) => {
    Reflect.defineMetadata("Idx", { name: propertyKey, isArray: false, type: "Id" }, target.constructor);
  }
}

export function record<ModelType extends Constructor<IModel>>(recType: ModelType) {
  return <SubModel extends IModel>(target: SubModel, propertyKey: keyof SubModel) => {
    const name = propertyKey;
    const fields: IFieldParams<SubModel>[] = Reflect.getMetadata("fields", target.constructor, target.constructor.name) || [];
    const type = Reflect.getMetadata("design:type", target, propertyKey.toString());
    const isArray = type?.name === "Array";
    const isObject = type?.name === "Object";
    const field = {
      name,
      isArray,
      isObject,
      type: `Record:${recType.name}`,
    }

    fields.push(field);

    Reflect.defineMetadata("fields", fields, target.constructor, target.constructor.name);
    Reflect.defineMetadata("field", field, target.constructor, propertyKey.toString());
  };
}


export function relation<SubModel extends IModel,
  DirVia extends "->" | "<-",
  DirTo extends "->" | "<-",
  Via extends StaticModel,
  ViaSelectors extends DirViaOptions<Via>,
  To extends StaticModel>(dirVia: DirVia, via: Via, select?: ViaSelectors | DirTo, to?: To) {
  return (target: SubModel, propertyKey: keyof SubModel) => {
    const name = propertyKey;
    const fields: IFieldParams<SubModel>[] = Reflect.getMetadata("fields", target.constructor, target.constructor.name) || [];
    const field = {
      name,
      type: "Relation",
      isArray: true,
      isObject: false,
      params: { from: target, via, to: to, dirVia, select },
    }

    fields.push(field);
    Reflect.defineMetadata("fields", fields, target.constructor, target.constructor.name);
    Reflect.defineMetadata("field", field, target.constructor, propertyKey.toString());
  };
}