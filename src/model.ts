import type { Constructor } from "type-fest";
import { Surreal } from "surrealdb.js";
import type { AsBasicModel, CreateInput, IModel, LengthGreaterThanOne, ModelKeysDot, OnlyFields, TransformSelected, UnionToArray } from "./types/types.ts";
import { ql, SQL, Instance, FnBody, funcs } from "./utils/query.ts";
import { ActionResult, AnyAuth, LiveQueryResponse, Patch, Token } from "./types/surreal-types.ts";
import { extractToId, floatJSONReplacer } from "./utils/parsers.ts";
import { Idx } from "./decerators.ts";
import TypedSurQL from "./client.ts";
import { sleep } from "bun";

export type SubscribeResponse<T> = {
  [Symbol.asyncIterator](): {
    next(): Promise<{
      value: T;
      done: boolean;
    }>;
    return(id: string): Promise<{
      value: undefined;
      done: boolean;
    }>;
  }
}

export type InfoForTable = {
  events: Record<string, string>;
  fields: Record<string, string>;
  indexes: Record<string, string>;
  lives: Record<string, string>;
  tables: Record<string, string>;
}

export class ModelInstance<SubModel extends Model> {
  constructor(private readonly ctor: Constructor<SubModel>, private readonly surql = TypedSurQL) { }

  public async migrate() {
    const table = this.surql.getTable(this.ctor);
    const tableName = table?.name ?? this.constructor.name;
    const queries: string[] = [];

    const info = (await this.surql.client.query<InfoForTable[]>(`INFO FOR TABLE ${tableName};`))[0];
    const fields = this.surql.getFields(this.ctor);

    const tableIndexes = table?.indexes;

    if (tableIndexes) {
      const columns = tableIndexes.columns.map((column) => funcs.val(column as string));
      const index = funcs.val(`DEFINE INDEX ${columns.at(0)}_${columns.at(-1)}_${tableIndexes.suffix ?? "idx"} ON TABLE ${tableName} COLUMNS ${columns.join(", ")} ${tableIndexes.unique ? funcs.val("UNIQUE") : ""} ${tableIndexes.search ? "SEARCH ANALYZER ascii BM25 HIGHLIGHTS" : ""};`);
      queries.push(index.toString());
    }

    for (const field of fields) {
      if (field.index && !info.indexes[field.index.name]) {
        const query = ql`DEFINE INDEX ${funcs.val(field.index.name)} ON TABLE ${funcs.val(tableName)} COLUMNS ${funcs.val(field.name as string)} ${field.index.unique ? funcs.val("UNIQUE") : ""} ${field.index.search ? "SEARCH ANALYZER ascii BM25 HIGHLIGHTS" : ""};`;
        queries.push(query.toString());
      }
    }

    const fullQuery = queries.join("\n");
    await this.surql.client.query(fullQuery);
  }

  public async info() {
    return (await this.surql.client.query<InfoForTable[]>(`INFO FOR TABLE ${this.surql.getTableName(this.ctor)};`))[0];
  }

  public async kill(uuid: string) {
    return await this.surql.client.kill(uuid);
  }

  public async live(callback?: (data: LiveQueryResponse<OnlyFields<SubModel>>) => unknown, diff?: boolean): Promise<string> {
    if (this.surql.STRATEGY === "HTTP") throw new Error("Live queries are not supported in HTTP mode");
    return await (this.surql.client as Surreal).live<Record<string, OnlyFields<SubModel>>>(this.surql.getTableName(this.ctor), callback as any, diff);
  }

  public subscribe(filter?: LiveQueryResponse['action'], diff?: boolean) {
    if (this.surql.STRATEGY === "HTTP") throw new Error("Live queries are not supported in HTTP mode");
    const live = this.live.bind(this);
    const kill = this.kill.bind(this);
    return {
      [Symbol.asyncIterator]() {
        let output: LiveQueryResponse<OnlyFields<SubModel>> | { action: "EMPTY", result: [] } = { action: "EMPTY", result: [] }
        let killId: string | null = null;

        live((data) => {
          if (filter && data.action !== filter) return;
          output = data ?? null;
        }, diff)
          .then(id => { killId = id; });

        return {
          async next() {
            await sleep(100);
            return Promise.resolve({ value: output, done: false })
          },
          return(id: string) {
            console.log("Killing", id);
            kill(killId!);
            return Promise.resolve({ value: undefined, done: true });
          },
          throw(e: Error) {
            console.log("Killing", killId);
            kill(killId!);
            return Promise.reject(e);
          }
        }
      }
    }
  }

  public async select<Key extends keyof OnlyFields<SubModel>, Fetch extends ModelKeysDot<Pick<SubModel, Key> & Model> = never, WithValue extends boolean | undefined = undefined>(
    keys: Key[] | "*",
    options?: {
      fetch?: Fetch[],
      id?: string,
      value?: WithValue extends LengthGreaterThanOne<UnionToArray<Key>> ? false : WithValue,
      where?: SQL
      logQuery?: boolean
    }
  ): Promise<TransformSelected<SubModel, Key, Fetch, WithValue>[]> {
    const tableName = this.surql.getTableName(this.ctor);
    const fields = keys === "*" ? this.surql.getFields(this.ctor)
      : keys.map((key) => {
        const field = this.surql.getField(this.ctor, key);
        if (!field) throw new Error(`Field ${key.toString()} does not exist on ${tableName}`);
        return field;
      });

    const selections = fields.map((field) => {
      const specifier = field.name.toString().includes(":") ? field.name.toString().split(":") : undefined;
      const [name, id] = specifier ? specifier : [field.name, undefined];
      if (field.type === "Relation" && field.params) {
        const viaTableName = this.surql.getTableName(field.params.via as Constructor<Model>);
        const toTableName = field.params?.to ? this.surql.getTableName(field.params.to as Constructor<Model>) : undefined;
        const toPath = toTableName ? `${field.params.select}${toTableName}` : field.params.select ? `${field.params.select}` : "";
        const viaPath = `${field.params.dirVia}${viaTableName}${id ? `:${id}` : ""}`;
        return `${viaPath}${toPath} as ${name as string}`;
      }
      return `${field.name as string}`;
    });

    const from = options?.id ? options?.id.includes(":") ? `${tableName}:${options?.id.split(":")[1]}` : `${tableName}:${options?.id}` : tableName;
    const query = `SELECT${options?.value ? " VALUE" : ""} ${selections.join(", ")} FROM ${from}${options?.where ? ` WHERE ${options?.where.toString()}` : ""}${options?.fetch && options?.fetch.length > 0 ? ` FETCH ${options?.fetch.join(", ")}` : ""}`;
    options?.logQuery && console.log(query);
    return (await this.surql.client.query(query)).at(-1) as TransformSelected<SubModel, Key, Fetch, WithValue>[];
  }

  public async create(props: CreateInput<SubModel>) {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const transformedProps: any = {};
    for (const [key, value] of Object.entries(props))
      transformedProps[key] = this.surql.transform(key, value as object | Model);

    return (await this.surql.client.query(`CREATE ${this.surql.getTableName(this.ctor)} CONTENT ${JSON.stringify(transformedProps, floatJSONReplacer, 2)}`, { value: transformedProps }))?.at(-1) as ActionResult<OnlyFields<SubModel>, CreateInput<SubModel>>[];
  }

  public async insert<U extends Partial<CreateInput<SubModel>>>(data: U | U[] | undefined): Promise<ActionResult<OnlyFields<SubModel>, U>[]> {
    let transformedData: U | U[] | undefined;
    if (!data) return [];
    if (Array.isArray(data)) {
      transformedData = data.map((val) => {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        const transformedProps: any = {};
        for (const [key, value] of Object.entries(val))
          transformedProps[key] = this.surql.transform(key, value as object | Model);
        return transformedProps;
      });
    } else {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const transformedProps: any = {};
      for (const [key, value] of Object.entries(data))
        transformedProps[key] = this.surql.transform(key, value as object | Model);
      transformedData = transformedProps;
    }

    if (!transformedData) {
      throw new Error("transformedData is undefined");
    }
    if (Array.isArray(transformedData)) {
      if (!transformedData.length) return [];
      return (await this.surql.client.query(`INSERT INTO ${this.surql.getTableName(this.ctor)} ${JSON.stringify(transformedData, floatJSONReplacer, 2)}`))?.at(-1) as ActionResult<OnlyFields<SubModel>, U>[];
    } else {
      return (await this.surql.client.query(`INSERT INTO ${this.surql.getTableName(this.ctor)} ${JSON.stringify(transformedData, floatJSONReplacer, 2)}`))?.at(-1) as ActionResult<OnlyFields<SubModel>, U>[];
    }
  }

  public async update<U extends AsBasicModel<SubModel>>(data?: U | undefined): Promise<ActionResult<AsBasicModel<SubModel>, U>[]> {
    return await this.surql.client.update<AsBasicModel<SubModel>, U>(this.surql.getTableName(this.ctor), data);
  }

  public async merge<U extends Partial<AsBasicModel<SubModel>>>(data?: U | undefined): Promise<ActionResult<AsBasicModel<SubModel>, U>[]> {
    return await this.surql.client.merge<AsBasicModel<SubModel>, U>(this.surql.getTableName(this.ctor), data);
  }

  public async patch(data?: Patch[] | undefined): Promise<Patch[]> {
    if (this.surql.STRATEGY === "HTTP") throw new Error("Patch queries are not supported in HTTP mode")
    return await (this.surql.client as Surreal).patch(this.surql.getTableName(this.ctor), data);
  }

  public async delete(id?: string): Promise<ActionResult<AsBasicModel<SubModel>>[]> {
    const thing = id ? id.includes(":") ? id : `${this.surql.getTableName(this.ctor)}:${id}` : this.surql.getTableName(this.ctor);
    return await this.surql.client.delete<AsBasicModel<SubModel>>(thing);
  }

  public async relate<Via extends Constructor<RelationEdge<SubModel, To extends Constructor<infer X> ? X : never>>, To extends Constructor<Model>>(id: string, via: [Via, string] | Via, to: [To, string], content?: Partial<Omit<InstanceType<Via>, "in" | "out">>): Promise<ActionResult<AsBasicModel<SubModel>>[]> {
    const viaCtor = Array.isArray(via) ? via[0] : via;
    const toCtor = Array.isArray(to) ? to[0] : to;
    const viaTableName = this.surql.getTableName(viaCtor)
    const toTableName = this.surql.getTableName(toCtor)

    const viaName = Array.isArray(via) ? `${viaTableName}:${extractToId(via[1])}` : viaTableName;
    const from = `${this.surql.getTableName(this.ctor)}:${extractToId(id)}`;
    return await this.surql.client.query(`RELATE ${from}->${viaName}->${`${toTableName}:${extractToId(to[1])}`}${content ? ` CONTENT ${JSON.stringify(content, floatJSONReplacer, 2)}` : ""};`);
  }

  public query<T, Ins = Instance<Constructor<SubModel>>>(fn: (q: typeof ql<T>, field: FnBody<Ins>) => SQL) {
    return this.surql.magic(this.ctor, fn);
  }
}

export class Model implements IModel {
  @Idx() public id!: string;

  public get tableName() {
    return (Reflect.getMetadata("table", this.constructor)?.name ?? this.constructor.name) as string;
  }

  public toString() {
    return `${this.tableName}:${this.id}`;
  }

  public static toString() {
    return TypedSurQL.getTableName(this);
  }

  constructor(props?: Partial<IModel>) {
    this.id = props?.id ?? "";
    Object.assign(this, props);
  }

  public static async scopedAuth<SubModel extends Model>(this: { new(): SubModel }, auth: AnyAuth | Token) {
    const newScope = await TypedSurQL.scopedAuth(auth);
    const instance = new ModelInstance(this, newScope.conn);
    return {
      model: instance,
      [Symbol.asyncDispose]: async () => await newScope[Symbol.asyncDispose](),
    }
  }

  public static async migrate<SubModel extends Model>(this: { new(): SubModel }) {
    return await new ModelInstance(this).migrate();
  }

  public static async info<SubModel extends Model>(this: { new(): SubModel }) {
    return await new ModelInstance(this).info();
  }

  public static async live<SubModel extends Model>(this: { new(): SubModel }, callback?: (data: LiveQueryResponse<OnlyFields<SubModel>>) => unknown, diff?: boolean): Promise<string> {
    return await new ModelInstance(this).live(callback, diff);
  }

  public static $subscribe<SubModel extends Model>(this: { new(): SubModel }, filter?: LiveQueryResponse['action'], diff?: boolean) {
    return new ModelInstance(this).subscribe(filter, diff);
  }

  public static async kill<SubModel extends Model>(this: { new(): SubModel }, uuid: string) {
    return await new ModelInstance(this).kill(uuid);
  }

  public static async select<SubModel extends Model, Key extends keyof OnlyFields<SubModel>, Fetch extends ModelKeysDot<Pick<SubModel, Key> & Model> = never, WithValue extends boolean | undefined = undefined>(
    this: { new(props?: Partial<SubModel>): SubModel },
    keys: Key[] | "*",
    options?: {
      fetch?: Fetch[],
      id?: string,
      value?: WithValue extends LengthGreaterThanOne<UnionToArray<Key>> ? false : WithValue,
      where?: SQL
      logQuery?: boolean
    }
  ): Promise<TransformSelected<SubModel, Key, Fetch, WithValue>[]> {
    return await new ModelInstance(this).select(keys, options);
  }

  public static async create<SubModel extends Model>(this: { new(props?: CreateInput<SubModel>): SubModel }, props: CreateInput<SubModel>) {
    // Object.assign(this, props)
    return await new ModelInstance(this).create(props); 
  }

  public static async insert<SubModel extends Model, U extends Partial<CreateInput<SubModel>>>(this: { new(): SubModel }, data: U | U[] | undefined): Promise<ActionResult<OnlyFields<SubModel>, U>[]> {
    return await new ModelInstance(this).insert(data);
  }

  public static async update<SubModel extends Model, U extends AsBasicModel<SubModel>>(this: { new(): SubModel }, data?: U | undefined): Promise<ActionResult<AsBasicModel<SubModel>, U>[]> {
    return await new ModelInstance(this).update(data);
  }

  public static async merge<SubModel extends Model, U extends Partial<AsBasicModel<SubModel>>>(this: { new(): SubModel }, data?: U | undefined): Promise<ActionResult<AsBasicModel<SubModel>, U>[]> {
    return await new ModelInstance(this).merge(data);
  }

  public static async patch<SubModel extends Model>(this: { new(): SubModel }, data?: Patch[] | undefined): Promise<Patch[]> {
    return await new ModelInstance(this).patch(data);
  }

  public static async delete<SubModel extends Model>(this: { new(): SubModel }, id?: string): Promise<ActionResult<AsBasicModel<SubModel>>[]> {
    return await new ModelInstance(this).delete(id);
  }

  public static async relate<SubModel extends Model,
    Via extends Constructor<RelationEdge<SubModel, To extends Constructor<infer X> ? X : never>>,
    To extends Constructor<Model>>(this: { new(props?: Partial<Model>): SubModel }, id: string, via: [Via, string] | Via, to: [To, string], content?: Partial<Omit<InstanceType<Via>, "in" | "out">>): Promise<ActionResult<AsBasicModel<SubModel>>[]> {
    return await new ModelInstance(this).relate(id, via, to, content);
  }

  public static query<SubModel extends Model, T, Ins = Instance<Constructor<SubModel>>>(this: { new(): SubModel }, fn: (q: typeof ql<T>, field: FnBody<Ins>) => SQL) {
    return new ModelInstance(this).query(fn);
  }
}

export class RelationEdge<In extends IModel, Out extends IModel> extends Model {
  public in!: In | string;
  public out!: Out | string;
}