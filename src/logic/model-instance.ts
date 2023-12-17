import { Surreal } from "surrealdb.js";
import { Constructor } from "type-fest";
import { LiveQueryResponse, OnlyFields, ModelKeysDot, LengthGreaterThanOne, UnionToArray, TransformSelected, CreateInput, ActionResult, AsBasicModel, Patch, RecFields, TransformFetches, KeyofRecs } from "..";
import { fx, ql, SQL, Instance, FnBody } from "../exports";
import { Model, RelationEdge } from "../model";
import { InfoForTable, LiveOptions } from "../types/model-types";
import { floatJSONReplacer, extractToId } from "../utils/parsers";
import { SubscriptionAsyncIterator } from "../utils/subscriptions";
import TypedSurQL from "../client.ts";
import { WhereFilter } from "./where.ts";
import { WhereSelector } from "../types/filter.ts";

export class ModelInstance<SubModel extends Model> {
  private activeSubscriptions: {
    isSubscribed: boolean,
    kill: () => Promise<void>,
  } | null = null
  constructor(private readonly ctor: Constructor<SubModel>, private readonly surql = TypedSurQL) { }

  public async migrate() {
    const table = this.surql.getTable(this.ctor);
    const tableName = table?.name ?? this.constructor.name;
    const queries: string[] = [];

    const info = (await this.surql.client.query<InfoForTable[]>(`INFO FOR TABLE ${tableName};`))[0];
    const fields = this.surql.getFields(this.ctor);

    const tableIndexes = table?.indexes;

    if (tableIndexes) {
      const columns = tableIndexes.columns.map((column) => fx.val(column as string));
      const index = fx.val(`DEFINE INDEX ${columns.at(0)}_${columns.at(-1)}_${tableIndexes.suffix ?? "idx"} ON TABLE ${tableName} COLUMNS ${columns.join(", ")} ${tableIndexes.unique ? fx.val("UNIQUE") : ""} ${tableIndexes.search ? "SEARCH ANALYZER ascii BM25 HIGHLIGHTS" : ""};`);
      queries.push(index.toString());
    }

    for (const field of fields) {
      if (field.index && !info.indexes[field.index.name]) {
        const query = ql`DEFINE INDEX ${fx.val(field.index.name)} ON TABLE ${fx.val(tableName)} COLUMNS ${fx.val(field.name as string)} ${field.index.unique ? fx.val("UNIQUE") : ""} ${field.index.search ? "SEARCH ANALYZER ascii BM25 HIGHLIGHTS" : ""};`;
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

  /**
   * 
   * @param callback   public static async live<SubModel extends Model,
    Fetch extends ModelKeysDot<Pick<SubModel, ModelKeys> & Model>,
    ModelKeys extends keyof OnlyModelsFields<SubModel> = keyof OnlyModelsFields<SubModel>>(this: { new(): SubModel },
      callback?: (data: LiveQueryResponse<TransformFetches<SubModel, Fetch>>) => unknown, opts?: LiveOptions<SubModel, ModelKeys, Fetch>): Promise<string> {
    return await new ModelInstance(this).live(callback, opts);
  }

   * @param condition 
   * @param diff 
   * @returns 
   */
  public async live<Fetch extends ModelKeysDot<Pick<SubModel, ModelKeys> & Model>, ModelKeys extends KeyofRecs<SubModel> = KeyofRecs<SubModel>>(callback?: (data: LiveQueryResponse<TransformFetches<SubModel, Fetch>>) => unknown, opts?: LiveOptions<SubModel, ModelKeys, Fetch>): Promise<string> {
    if (this.surql.STRATEGY === "HTTP") throw new Error("Live queries are not supported in HTTP mode");

    let where = "";
    if (opts?.where) {
      if (opts.where instanceof SQL)
        where = opts.where.toString();
      else
        where = new WhereFilter(this.ctor, opts.where).parse();
    }

    const actionSpecific = /*opts?.methods && opts.methods !== "*" ? `action in ${JSON.stringify(opts.methods)}` :*/ "";
    const query = `LIVE SELECT ${opts?.diff ? "DIFF" : "*"} FROM ${this.surql.getTableName(this.ctor)}${where ? ` WHERE ${where} ${actionSpecific ? `AND ${actionSpecific}` : ""}` : actionSpecific ? ` WHERE ${actionSpecific}` : ""}${opts?.fetch && opts.fetch.length > 0 ? ` FETCH ${opts.fetch.join(", ")}` : ""}`;
    console.log(query)
    const response = await this.surql.client.query(query);
    if (response.length <= 0 || !response[0]) throw new Error("Live query failed to start");
    if (callback) this.surql.client.listenLive(response[0] as string, callback);
    return response[0] as string;
  }

  public subscribe<Fetch extends ModelKeysDot<Pick<SubModel, ModelKeys> & Model>, ModelKeys extends KeyofRecs<SubModel> = KeyofRecs<SubModel>>(opts?: LiveOptions<SubModel, ModelKeys, Fetch>) {
    const subsriber = new SubscriptionAsyncIterator<SubModel, Fetch, ModelKeys>(this.ctor, { ...opts });
    this.activeSubscriptions = {
      isSubscribed: subsriber.isSubscribed,
      kill: async () => {
        await subsriber.return();
      }
    }
    return subsriber;
  }

  public unsubscribe() {
    if (this.activeSubscriptions?.isSubscribed) {
      this.activeSubscriptions.kill();
      this.activeSubscriptions = null;
    }
  }
  public async select<Key extends keyof OnlyFields<SubModel>,
    Fetch extends ModelKeysDot<Pick<SubModel, Key> & Model> = never,
    WithValue extends boolean | undefined = undefined,
    IgnoreRelations extends boolean | undefined = undefined
  >(
    keys: Key[] | "*",
    options?: {
      fetch?: Fetch[],
      id?: string,
      value?: WithValue extends LengthGreaterThanOne<UnionToArray<Key>> ? false : WithValue,
      where?: SQL | WhereSelector<SubModel>,
      limit?: number,
      start?: number,
      orderBy?: keyof OnlyFields<SubModel>,
      order?: "ASC" | "DESC",
      ignoreRelations?: IgnoreRelations,
      logQuery?: boolean
    }
  ): Promise<TransformSelected<SubModel, Key, Fetch, WithValue, IgnoreRelations>[]> {
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
      if (field.type === "Relation" && field.params && !options?.ignoreRelations) {
        const viaTableName = this.surql.getTableName(field.params.via as Constructor<Model>);
        const toTableName = field.params?.to ? this.surql.getTableName(field.params.to as Constructor<Model>) : undefined;
        const toPath = toTableName ? `${field.params.select}${toTableName}` : field.params.select ? `${field.params.select}` : "";
        const viaPath = `${field.params.dirVia}${viaTableName}${id ? `:${id}` : ""}`;
        return `${viaPath}${toPath} as ${name as string}`;
      }
      return `${field.name as string}`;
    });

    let where = "";
    if (options?.where) {
      if (options?.where instanceof SQL)
        where = options?.where.toString();
      else
        where = new WhereFilter(this.ctor, options?.where).parse();
    }

    const from = options?.id ? options?.id.includes(":") ? `${tableName}:${options?.id.split(":")[1]}` : `${tableName}:${options?.id}` : tableName;
    const orderBy = options?.orderBy ? ` ORDER BY ${this.surql.getField(this.ctor, options.orderBy).name.toString()} ${options?.order ?? "ASC"}` : "";
    const limit = options?.limit ? ` LIMIT ${options?.limit}` : "";
    const start = options?.start ? ` START ${options?.start}` : "";
    const fetches = options?.fetch && options?.fetch.length > 0 ? ` FETCH ${options?.fetch.join(", ")}` : ""

    const query = `SELECT${options?.value ? " VALUE" : ""} ${selections.join(", ")} FROM ${from}${options?.where ? ` WHERE ${where}` : ""}${orderBy}${limit}${start}${fetches}`;
    options?.logQuery && console.log(query);
    const results = (await this.surql.client.query(query)).at(-1) as TransformSelected<SubModel, Key, Fetch, WithValue, IgnoreRelations>[];

    if (options?.ignoreRelations) {
      // return with relations removed
      return results.map((result) => {
        const newResult = { ...result };
        for (const field of fields) {
          if (field.type === "Relation") {
            delete newResult[field.name as keyof typeof newResult];
          }
        }
        return newResult;
      })
    }

    return results;
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
    return await this.surql.client.insert<OnlyFields<SubModel>, U>(this.surql.getTableName(this.ctor), transformedData);
    // if (Array.isArray(transformedData)) {
    //   if (!transformedData.length) return [];
    //   return (await this.surql.client.query(`INSERT INTO ${this.surql.getTableName(this.ctor)} ${JSON.stringify(transformedData, floatJSONReplacer, 2)}`))?.at(-1) as ActionResult<OnlyFields<SubModel>, U>[];
    // }
    // return (await this.surql.client.query(`INSERT INTO ${this.surql.getTableName(this.ctor)} ${JSON.stringify(transformedData, floatJSONReplacer, 2)}`))?.at(-1) as ActionResult<OnlyFields<SubModel>, U>[];
  }

  public async update<U extends AsBasicModel<SubModel>>(id?: string, data?: U | undefined): Promise<ActionResult<AsBasicModel<SubModel>, U>[]> {
    const thing = id ? `${this.surql.getTableName(this.ctor)}:${extractToId(id)}` : this.surql.getTableName(this.ctor);
    return await this.surql.client.update<AsBasicModel<SubModel>, U>(thing, data);
  }

  public async merge<U extends Partial<AsBasicModel<SubModel>>>(id?: string, data?: U | undefined): Promise<ActionResult<AsBasicModel<SubModel>, U>[]> {
    const thing = id ? `${this.surql.getTableName(this.ctor)}:${extractToId(id)}` : this.surql.getTableName(this.ctor);
    return await this.surql.client.merge<AsBasicModel<SubModel>, U>(thing, data);
  }

  public async patch(data?: Patch[] | undefined): Promise<Patch[]> {
    if (this.surql.STRATEGY === "HTTP") throw new Error("Patch queries are not supported in HTTP mode")
    return await (this.surql.client as Surreal).patch(this.surql.getTableName(this.ctor), data);
  }

  public async delete(id?: string, where?: WhereSelector<SubModel>): Promise<ActionResult<AsBasicModel<SubModel>>[]> {
    const thing = id ? `${this.surql.getTableName(this.ctor)}:${extractToId(id)}` : this.surql.getTableName(this.ctor);
    const condition = where ? new WhereFilter(this.ctor, where).parse() : "";
    if (condition) {
      return await this.surql.client.query(`DELETE FROM ${thing} WHERE ${condition}`);
    }
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