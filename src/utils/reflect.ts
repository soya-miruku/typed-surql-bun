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
  const parentCtor = Object.getPrototypeOf(ctor);
  const fields: IFieldParams<SubModel>[] = [];
  if (parentCtor.name.includes("RelationEdge")) {
    fields.push(...getFields(parentCtor) as IFieldParams<SubModel>[]);
  }

  const fieldsForModel = Reflect.getMetadata("fields", ctor, ctor.name) as IFieldParams<SubModel>[];
  if (fieldsForModel) fields.push(...fieldsForModel);
  if (fields.filter(f => f.name === "id").length <= 0) {
    const id = Reflect.getMetadata("Idx", ctor) as IFieldParams<SubModel>;
    if (id) fields.push(id);
  }

  return fields;
}

export function getField<SubModel extends IModel>(ctor: Class<SubModel>, name: keyof SubModel): IFieldParams<SubModel> {
  if (name === "id") return Reflect.getMetadata("Idx", ctor) as IFieldParams<SubModel>;
  return Reflect.getMetadata("field", ctor, name.toString()) as IFieldParams<SubModel>;
}