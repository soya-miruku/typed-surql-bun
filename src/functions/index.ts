export class qlFn {
  constructor(public readonly fn: string) { }

  static create(fn: string) { return new qlFn(fn) }

  toString() {
    return this.fn;
  }

  as(alias: string) { return new qlFn(`${this.fn} AS ${alias}`); }
  lt(val: any) { return qlFn.create(`< ${parseType(val)}`) }
  lte(val: any) { return qlFn.create(`<= ${parseType(val)}`) }
  gt(val: any) { return qlFn.create(`> ${parseType(val)}`) }
  gte(val: any) { return qlFn.create(`>= ${parseType(val)}`) }
  ne(val: any) { return qlFn.create(`!= ${parseType(val)}`) }
  eq(val: any) { return qlFn.create(`= ${parseType(val)}`) }
}

export function parseType(value: any) {
  if (value instanceof qlFn) {
    return value.fn
  } 
  if (typeof value === "string") {
    return `"${value}"`;
  }
  return JSON.stringify(value);
}

export type Input = string | qlFn
