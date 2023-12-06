import { ExperimentalSurrealHTTP, Surreal } from "surrealdb.js";
import { AsyncReturnType, Class } from "type-fest";
import { Static, TObject, TProperties } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { IModel, ModelBase, Constructor, DotNestedKeys } from "./types/types.ts";
import { ITable } from "./decerators.ts";
import { IFieldParams } from "./decerators.ts";
import { AnyAuth, ConnectionOptions, RawQueryResult, Token } from "./types/surreal-types.ts";
import { FnBody, Instance, SQL, funcs, ql } from "./utils/query.ts";
import { operations } from "./functions/operations.ts";
import { ISurrealScope } from "./scope.ts";
import { AlgoType, ExtendedTokenAuth, ScopeType, extendedTokenAuth } from "./token.ts";

export type StrategyType = "HTTP" | "WS";
export type SurrealClient = AsyncReturnType<InstanceType<Constructor<TypedSurQL>>['init']>;
export type SurrealStratClient<Strategy extends StrategyType = "WS"> = Strategy extends "WS" ? Surreal : ExperimentalSurrealHTTP;

class TypedSurQL {
  public client!: Surreal;
  public STRATEGY: StrategyType = "WS";
  public url!: string;

  public getTableName<SubModel extends IModel>(ctor: Class<SubModel>): string {
    return Reflect.getMetadata("table", ctor)?.name ?? ctor.name;
  }

  public getTable<SubModel extends IModel>(ctor: Class<SubModel>): ITable<SubModel> | undefined {
    const res = Reflect.getMetadata("table", ctor);
    return res ? res as ITable<SubModel> : undefined
  }

  public getFields<SubModel extends IModel>(ctor: Class<SubModel>): IFieldParams<SubModel>[] {
    const fields = Reflect.getMetadata("fields", ctor, ctor.name) as IFieldParams<SubModel>[];
    const id = Reflect.getMetadata("Idx", ctor) as IFieldParams<SubModel>;
    return id ? fields.concat(id) : fields;
  }

  public getField<SubModel extends IModel>(ctor: Class<SubModel>, name: keyof SubModel): IFieldParams<SubModel> {
    if (name === "id") return Reflect.getMetadata("Idx", ctor) as IFieldParams<SubModel>;
    return Reflect.getMetadata("field", ctor, name.toString()) as IFieldParams<SubModel>;
  }

  public isModelType(value: any): value is IModel {
    return value instanceof ModelBase || value instanceof Object && "id" in value;
  }

  public transform(key: string, value: object | IModel) {
    if (Array.isArray(value)) {
      const results = value.map((val) => this.transform(key, val)).filter((val) => val !== undefined) as string[];
      return results;
    }

    if (typeof value === 'object' && !(value instanceof Date) && !(value instanceof ModelBase)) {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const obj: any = {};
      if (!value) return undefined;
      for (const [k, v] of Object.entries(value)) {
        const result = this.transform(k, v);
        if (result !== undefined)
          obj[k] = result;
      }
      return obj;
    }

    return this.isModelType(value) ? `${this.getTableName(value.constructor as Class<IModel>)}:${value.id}` : value;
  }

  public setStrategy<Strategy extends boolean = true>(strategy?: Strategy) {
    if (strategy === undefined || strategy === true)
      this.STRATEGY = "WS";
    else this.STRATEGY = "HTTP";
  }

  public setUrl(url: string) {
    this.url = url;
  }

  public connect<Strategy extends boolean>(opts?: ConnectionOptions & { websocket?: Strategy }) {
    return new Promise<SurrealStratClient<Strategy extends true ? "WS" : "HTTP">>((resolve, reject) => {
      const db = this.STRATEGY === "WS" ? new Surreal() : new ExperimentalSurrealHTTP();
      try {
        void db.connect(this.url, opts as any).then(() => {
          this.client = db as Surreal;
          resolve(db as SurrealStratClient<Strategy extends true ? "WS" : "HTTP">)
        });
      } catch (e) {
        reject(e)
      }
    })
  }

  public init<Strategy extends boolean>(url: string, opts?: ConnectionOptions & { websocket?: Strategy }): Promise<SurrealStratClient<Strategy extends true ? "WS" : "HTTP">>;
  public init<Strategy extends boolean>(opts: ConnectionOptions & { websocket?: Strategy }): Promise<SurrealStratClient<Strategy extends true ? "WS" : "HTTP">>;
  public init<Strategy extends boolean>(urlOrOpts?: string | (ConnectionOptions & { websocket?: Strategy }), opts?: ConnectionOptions & { websocket?: Strategy }): Promise<SurrealStratClient<Strategy extends true ? "WS" : "HTTP">> {
    let url: string | undefined;
    if (typeof urlOrOpts === 'string') {
      url = urlOrOpts;
    } else {
      opts = urlOrOpts;
    }
    if (!url && !this.url) throw new Error("No url provided");
    if (url) {
      this.url = url;
    }
    this.setStrategy(opts?.websocket);
    return this.connect(opts);
  }

  public async scopedAuth(auth: AnyAuth | Token, url?: string) {
    const db = await this.new(url ?? this.url, { auth })
    return {
      conn: db,
      [Symbol.asyncDispose]: async () => {
        await db.client.close();
      }
    }
  }

  public async new<Strategy extends boolean>(url: string, opts?: ConnectionOptions & { websocket?: Strategy }) {
    const db = new TypedSurQL();
    await db.init(url, opts);
    return db;
  }

  public async wait(iterations = 5): Promise<boolean> {
    if (iterations === 0) return false;
    if (!this.client) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return this.wait(iterations - 1);
    }
    return true;
    // return await TypedSurQL.SurrealDB.wait().then(() => true);
  }

  public async raw<T>(strings: TemplateStringsArray, ...value: unknown[]) {
    const q = ql(strings, ...value);
    const full = q.toString()
    return (await this.client.query(full)).at(-1) as T;
  }

  public createFnBody<M extends Constructor<ModelBase>, Ins = Instance<M>>(m: M) {
    const baseFn = (k: DotNestedKeys<Ins> | Ins | Ins[]) => {
      const f = this.getField(m, k as keyof ModelBase);
      if (f && f.type === "Relation" && f.params) {
        const viaTableName = this.getTableName(f.params.via as Constructor<ModelBase>);
        const toTableName = f.params?.to ? this.getTableName(f.params.to as Constructor<ModelBase>) : undefined;
        const toPath = toTableName ? `${f.params.select}${toTableName}` : f.params.select ? `${f.params.select}` : "";
        const viaPath = `${f.params.dirVia}${viaTableName}`;
        return funcs.val(`${viaPath}${toPath} as ${f.name as string}`);
      }
      if (typeof k === "string") return funcs.val(k as string);
      return funcs.val(JSON.stringify(k));
    }

    return Object.assign(baseFn, funcs, operations, { TABLE: funcs.val(this.getTableName(m)), ql: ql, field: baseFn }) as FnBody<Ins>;
  }

  public magic<M extends Constructor<ModelBase>, T, Ins = Instance<M>>(m: M, fn: (q: typeof ql<T>, fn: FnBody<Ins>) => SQL, currentSql = "") {
    const fnBody = this.createFnBody<M, Ins>(m);
    const sql = fn(ql<T>, fnBody);
    currentSql += `${sql.toString()};`;
    return {
      pipe: <NewModel extends Constructor<ModelBase>>(newModel: NewModel, fn: (q: typeof ql<T>, field: FnBody<Instance<NewModel>>) => SQL) => this.magic(newModel, fn, currentSql),
      exec: async <TResponse extends RawQueryResult[]>() => {
        if (!currentSql) throw new Error("No query was provided")
        return (await this.client.query<TResponse>(currentSql)).at(-1) as TResponse
      }
    }
  }

  public async createScope<TModel extends Constructor<ModelBase>, Schema extends TProperties, Name extends string, Ins = Instance<TModel>>
    (model: TModel, props: Schema, handler: ISurrealScope<Name, { ql: typeof ql, fn: FnBody<Ins> } & Static<TObject<Schema>>>): Promise<{ name: Name } & Static<TObject<Schema>>> {
    const { name, session, signin, signup } = handler;
    if (!name) throw new Error("Scope name is required");
    if (!session) throw new Error("Session is required");

    //DEFINE SCOPE @name SESSION @duration (SIGNUP: on exists) @expression (SIGNIN: on exists) @expression
    let query = `DEFINE SCOPE ${name} SESSION ${session}`;
    const fnBody = this.createFnBody<TModel, Ins>(model);
    const parsedProps = Object.entries(props).reduce((acc, [k, v]) => {
      acc[k] = funcs.val(k);
      return acc;
    }, {} as any)

    const signInQuery = signin?.({ ql, fn: fnBody, ...parsedProps });
    const signUpQuery = signup?.({ ql, fn: fnBody, ...parsedProps });

    query += "\n";

    if (signInQuery) query += ` SIGNIN (${signInQuery.toString()})`;
    if (signUpQuery) query += ` SIGNUP (${signUpQuery.toString()})`;
    query += ";";
    const response = await this.client.query(query);
    if (response.length === 0) throw new Error("Scope creation failed");
    const propsObj = Object.entries(props).reduce((acc, [k, v]) => {
      acc[k] = funcs.val(k);
      return acc;
    }, {} as any);

    return { name, ...propsObj };
  }

  public async createToken<N extends string, Props extends TProperties | undefined = undefined>(props: { name: N, on: ScopeType | (() => { name: string }) | { name: string }, type: AlgoType }, value: string, additionalProps?: Props): Promise<ExtendedTokenAuth<Props>> {
    //DEFINE TOKEN @name ON [ NAMESPACE | DATABASE | SCOPE @scope ] TYPE @type VALUE @value
    const { name, on, type } = props;
    let query = `DEFINE TOKEN ${name} ON `;
    if (typeof on === "string") query += on;
    else query += `SCOPE ${typeof on === "function" ? on().name : on.name}`;
    query += ` TYPE ${type} VALUE "${value}";`;
    const response = await this.client.query(query);
    if (response.length === 0) throw new Error("Token creation failed");
    const properties = extendedTokenAuth(additionalProps ?? {});
    const propsObj = Object.entries(Value.Create(properties)).reduce((acc, [k, v]) => {
      acc[k] = funcs.val(k);
      return acc;
    }, {} as any);
    return { name, ...propsObj };
  }

}

export default new TypedSurQL();