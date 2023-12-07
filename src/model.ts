import type { Constructor } from "type-fest";
import type { AsBasicModel, CreateInput, IModel, LengthGreaterThanOne, ModelKeysDot, OnlyFields, TransformSelected, UnionToArray } from "./types/types.ts";
import { ql, SQL, Instance, FnBody } from "./utils/query.ts";
import { ActionResult, AnyAuth, LiveQueryResponse, Patch, Token } from "./types/surreal-types.ts";
import { Idx } from "./decerators.ts";
import TypedSurQL from "./client.ts";
import { ModelInstance } from "./logic/model-instance.ts";
import { WhereSelector } from "./types/filter.ts";

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

  public static async scopedAuth<SubModel extends Model>(this: { new(): SubModel }, auth: AnyAuth | Token, url?: string) {
    const newScope = await TypedSurQL.scopedAuth(auth, url);
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

  public static async live<SubModel extends Model>(this: { new(): SubModel }, callback?: (data: LiveQueryResponse<OnlyFields<SubModel>>) => unknown, filter?: SQL | WhereSelector<SubModel>, diff?: boolean): Promise<string> {
    return await new ModelInstance(this).live(callback, filter, diff);
  }

  public static $subscribe<SubModel extends Model>(this: { new(): SubModel }, action?: LiveQueryResponse['action'] | "ALL", filter?: SQL | WhereSelector<SubModel>, diff?: boolean) {
    return new ModelInstance(this).subscribe(action, filter, diff);
  }

  public static $unsubscribe<SubModel extends Model>(this: { new(): SubModel }) {
    return new ModelInstance(this).unsubscribe();
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
      where?: SQL | WhereSelector<SubModel>,
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