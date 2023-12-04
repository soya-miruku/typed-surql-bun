import { parseType, qlFn } from "./index.ts";

export function count(value?: any) {
  return qlFn.create(`count(${parseType(value)})`)
}