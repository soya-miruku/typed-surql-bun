import { qlFn, parseType } from "./index.ts";

export const operations = {
  and: qlFn.create("AND"),
  or: qlFn.create("OR"),
  is: qlFn.create("IS"),
  isNot: qlFn.create("IS NOT"),
  in: qlFn.create("IN"),
  notIn: qlFn.create("NOT IN"),
  contains: qlFn.create("CONTAINS"),
  containsNot: qlFn.create("CONTAINSNOT"),
  containsAll: qlFn.create("CONTAINSALL"),
  containsAny: qlFn.create("CONTAINSANY"),
  containsNone: qlFn.create("CONTAINSNONE"),
  inside: qlFn.create("INSIDE"),
  notInside: qlFn.create("NOTINSIDE"),
  allInside: qlFn.create("ALLINSIDE"),
  anyInside: qlFn.create("ANYINSIDE"),
  noneInside: qlFn.create("NONEINSIDE"),
  intersects: qlFn.create("INTERSECTS"),
  lt: (val: any) => qlFn.create(`< ${parseType(val)}`),
  lte: (val: any) => qlFn.create(`<= ${parseType(val)}`),
  gt: (val: any) => qlFn.create(`> ${parseType(val)}`),
  gte: (val: any) => qlFn.create(`>= ${parseType(val)}`),
  ne: (val: any) => qlFn.create(`!= ${parseType(val)}`),
  eq: (val: any) => qlFn.create(`= ${parseType(val)}`),
  "@@": qlFn.create("@@"),
  "??": qlFn.create("??"),
  "?:": qlFn.create("?:"),
  "=": qlFn.create("="),
  "!=": qlFn.create("!="),
  "==": qlFn.create("=="),
  "?=": qlFn.create("?="),
  "*=": qlFn.create("*="),
  "~": qlFn.create("~"),
  "!~": qlFn.create("!~"),
  "?~": qlFn.create("?~"),
  "*~": qlFn.create("*~"),
  "<": qlFn.create("<"),
  "<=": qlFn.create("<="),
  ">": qlFn.create(">"),
  ">=": qlFn.create(">="),
  "+": qlFn.create("+"),
  "-": qlFn.create("-"),
  "*": qlFn.create("*"),
  "/": qlFn.create("/"),
  "**": qlFn.create("**"),
}

export function mapBooleanOperator(value: any, key?: string) {
  if (value?.eq) return `${key ? key : ""} = ${value.eq}`;
  return null;
}

export const mapOperator = (value: any, key?: string) => {
  return mapNumberOrDateOperator(value, key) || mapStringOperator(value, key) || mapBooleanOperator(value, key);
};

export function mapNumberOrDateOperator(value: any, key?: string) {
  if (value?.gt) return `${key ? key : ""} > ${value.gt}`;
  if (value?.lt) return `${key ? key : ""} < ${value.lt}`;
  if (value?.gte) return `${key ? key : ""} >= ${value.gte}`;
  if (value?.lte) return `${key ? key : ""} <= ${value.lte}`;
  return null;
}

export function mapStringOperator(value: any, key?: string) {
  if (value?.contains) {
    if (Array.isArray(value?.contains)) {
      return `${key ? key : ""} ${operations.contains.fn} [${value.contains.map((v: any) => `"${v}"`).join(",")}]`;
    }
    return `${key ? key : ""} ${operations.contains.fn} "${value.contains}"`;
  }
  if (value?.containsAny) {
    if (Array.isArray(value?.containsAny)) {
      return `${key ? key : ""} ${operations.containsAny.fn} [${value.containsAny.map((v: any) => `"${v}"`).join(",")}]`;
    }
    return `${key ? key : ""} ${operations.containsAny.fn} "${value.containsAny}"`;
  }
  if (value?.containsAll) {
    if (Array.isArray(value?.containsAll)) {
      return `${key ? key : ""} ${operations.containsAll.fn} [${value.containsAll.map((v: any) => `"${v}"`).join(",")}]`;
    }
    return `${key ? key : ""} ${operations.containsAll.fn} "${value.containsAll}"`;
  }
  if (value?.containsNone) {
    if (Array.isArray(value?.containsNone)) {
      return `${key ? key : ""} ${operations.containsNone.fn} [${value.containsNone.map((v: any) => `"${v}"`).join(",")}]`;
    }
    return `${key ? key : ""} ${operations.containsNone.fn} "${value.containsNone}"`;
  }
  return null;
}
