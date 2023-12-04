import { SQL } from "./utils/query.ts";

export type TScopeSessionTimeout = `${string}m` | `${string}h` | `${string}`;

export interface ISurrealScope<Name extends string, InputVars> {
  name: Name;
  session: TScopeSessionTimeout;
  signin?: (vars: InputVars) => SQL;
  signup?: (vars: InputVars) => SQL;
}

export type TScopeCtx = string;

export type TScopeAuthCtx<A, B> = Awaited<unknown>;

