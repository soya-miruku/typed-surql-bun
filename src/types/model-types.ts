import { OnlyFields, ModelKeysDot, LengthGreaterThanOne, UnionToArray, WhereSelector, RecFields, KeyofRecs } from "."
import { Model, SQL } from ".."

export type InfoForTable = {
  events: Record<string, string>;
  fields: Record<string, string>;
  indexes: Record<string, string>;
  lives: Record<string, string>;
  tables: Record<string, string>;
}

export type SelectOptions<SubModel extends Model,
  Key extends keyof OnlyFields<SubModel>,
  Fetch extends ModelKeysDot<Pick<SubModel, Key> & Model> = never,
  WithValue extends boolean | undefined = undefined,
  IgnoreRelations extends boolean | undefined = undefined> = {
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


export type LiveOptions<SubModel extends Model,
  ModelKeys extends KeyofRecs<SubModel> = KeyofRecs<SubModel>,
  Fetch extends ModelKeysDot<Pick<SubModel, ModelKeys> & Model> = ModelKeysDot<Pick<SubModel, ModelKeys> & Model>,
> = {
  where?: SQL | WhereSelector<SubModel>,
  fetch?: Fetch[],
  diff?: boolean,
}