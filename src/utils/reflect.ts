import { Class } from "type-fest";
import { IFieldParams, ITable } from "../decerators";
import { IModel } from "../types";

export function getTableName<SubModel extends IModel>(ctor: Class<SubModel>): string {
  return Reflect.getMetadata("table", ctor)?.name ?? ctor.name;
}

export function getTable<SubModel extends IModel>(ctor: Class<SubModel>): ITable<SubModel> | undefined {
  const res = Reflect.getMetadata("table", ctor);
  return res ? res as ITable<SubModel> : undefined
}

export function getFields<SubModel extends IModel>(ctor: Class<SubModel>): IFieldParams<SubModel>[] {
  const fields = Reflect.getMetadata("fields", ctor, ctor.name) as IFieldParams<SubModel>[];
  const id = Reflect.getMetadata("Idx", ctor) as IFieldParams<SubModel>;
  return id ? fields.concat(id) : fields;
}

export function getField<SubModel extends IModel>(ctor: Class<SubModel>, name: keyof SubModel): IFieldParams<SubModel> {
  if (name === "id") return Reflect.getMetadata("Idx", ctor) as IFieldParams<SubModel>;
  return Reflect.getMetadata("field", ctor, name.toString()) as IFieldParams<SubModel>;
}