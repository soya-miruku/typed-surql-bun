import type { Constructor, Simplify } from "type-fest";
import { qlFn } from "../functions/index.ts";
import { DotNestedKeys, IModel, OnlyFields } from "../types/types.ts";
import { alias, arrays, count, cryptos, durations, http, math, meta, operations, parse, rands, search, session, strings, time, type } from "../functions/mod.ts";

export type StringContains<T extends string, U extends string> = T extends `${string}${U}${string}` ? true : false;
export type SQLInput<T extends string> = StringContains<T, "'"> extends true ? "USE VARS, INSTEAD OF '" : T;

export type Instance<SubModel extends Constructor<IModel>> = Simplify<OnlyFields<InstanceType<SubModel>>>
export interface FnBody<InstanceType> extends FunContext, Operation {
  (k: DotNestedKeys<InstanceType> | InstanceType | InstanceType[]): qlFn;
  TABLE: qlFn;
  ql: typeof ql;
  field: (k: DotNestedKeys<InstanceType> | InstanceType | InstanceType[]) => qlFn;
}

export class SQL {
  constructor(protected readonly q: string[]) { }
  static Create(q: [string, string]) {
    return new SQL(q);
  }

  toString(seperator = "") {
    return this.q.join(seperator);
  }
}

export const fx = {
  VALUE: qlFn.create("VALUE"),
  LIMIT: (limit: number) => qlFn.create(`LIMIT ${limit}`),
  val: (value: string) => qlFn.create(`${value}`),
  string: strings,
  array: arrays,
  count: count,
  crypto: cryptos,
  duration: durations,
  http: http,
  math: math,
  parse: parse,
  rand: rands,
  session: session,
  search: search,
  time: time,
  meta: meta,
  type: type,
  ...alias
}

export type FunContext = typeof fx;
export type Operation = typeof operations;

export function ql<T>(strings: TemplateStringsArray, ...values: unknown[]): SQL {
  let finalQuery = '';
  let letStatements = '';

  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (value instanceof qlFn) {
      finalQuery += strings[i] + value;
      continue;
    }

    if (typeof value === "object" && !Array.isArray(value) && value !== null) {
      const [varName, obj] = Object.entries(value)[0];
      letStatements += `LET $${varName} = ${obj instanceof qlFn ? obj.toString() : typeof obj === "string" ? obj.includes(":") ? obj : JSON.stringify(obj) : JSON.stringify(obj)};\n`;
      finalQuery += strings[i] + `$${varName}`;
    } else {
      finalQuery += strings[i] + (typeof value === "string" ? `'${value}'` : `${value}`);
    }
  }

  finalQuery += strings[strings.length - 1];
  return SQL.Create([letStatements, finalQuery]);
}