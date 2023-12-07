import { mapOperator } from "../functions/operations";
import { IModel } from "../types";
import { IFilterable, ParentItem, WhereSelector } from "../types/filter";
import TypedSurQL from "../client";
import { Constructor } from "type-fest";
import { qlFn } from "../functions";

export class WhereFilter<SubModel extends IModel, T extends WhereSelector<SubModel>, Parent extends ParentItem | null = null> implements IFilterable<T> {
  constructor(private ctor: Constructor<SubModel>, private obj: T, private previous?: Parent, private nested?: boolean) { }

  parse() {
    let result = "";
    const _this = this;
    const { AND, OR, NOT, ...rest } = this.obj as any;

    if (rest) {
      const keys = Object.keys(rest);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        let value = rest[key as keyof typeof rest];
        if (value === undefined) continue;
        if (!key) continue;

        function GetKey() {
          return _this.previous && !_this.nested ? `${_this.previous.parent}.${key}` : key;
        }

        if (i > 0) result += " AND ";

        if (value instanceof qlFn)
          value = value.fn;

        const opts = mapOperator(value, GetKey());
        if (opts) {
          result += opts;
          continue;
        }

        const field = TypedSurQL.getField(this.ctor, key as keyof SubModel) ?? key //this.selector.fieldSearcher.searchInSchema(this.selector.currentSchema, this.previous?.parent ? `${this.previous.parent}.${key}` : key);
        if (field) {
          const parentItem = {
            key,
            parent: this.previous ? `${this.previous.parent}.${key}` : key,
            fieldItem: field,
          } as ParentItem;

          const IsArray = field.isArray || Array.isArray(field?.type);
          const isObject = field.isObject || typeof field?.type === "object";
          const isRelation = field?.type === "Relation";
          const isPrimitive = !(IsArray || isObject);

          if (isRelation) {
            const where = new WhereFilter(this.ctor, value, parentItem, true);
            // result += `${key}[WHERE ${where.parse()}]`;
            result += `${field.params?.dirVia}(${TypedSurQL.getTableName(field.params?.via as Constructor<IModel>)} WHERE ${where.parse()})${field.params?.select}${TypedSurQL.getTableName(field.params?.to as Constructor<IModel>)}`
          }
          else if (isPrimitive) {
            if (typeof value === "function") {
              const funcString = value.toString().replace(/\(.*\)\s*=>\s*/, "");
              result += `${funcString}`;
              continue;
            }
            result += `${GetKey()} = ${typeof value === "string" && value.includes(":") ? value : JSON.stringify(value)}`;
          } else if (isObject) {
            const where = new WhereFilter(this.ctor, value, parentItem);
            result += where.parse();
          } else if (IsArray) {
            const where = new WhereFilter(this.ctor, value, parentItem, true);
            result += `${key}[WHERE ${where.parse()}]`;
          }
        } else {
          console.log("NO FIELD", key, this.previous, value);
        }
      }
    }

    if (AND) {
      result += " AND ";
      if (Array.isArray(AND)) {
        for (let i = 0; i < AND.length; i++) {
          const element = AND[i];
          if (i > 0) result += " AND ";
          result += new WhereFilter(this.ctor, element, this.previous).parse();
        }
      } else if (typeof AND === "object") result += new WhereFilter(this.ctor, AND, this.previous, this.nested).parse();
    }
    if (OR) {
      result += " OR ";
      if (Array.isArray(OR)) {
        for (let i = 0; i < OR.length; i++) {
          const element = OR[i];
          if (i > 0) result += " OR ";
          result += new WhereFilter(this.ctor, element, this.previous, this.nested).parse();
        }
      } else if (typeof OR === "object") result += new WhereFilter(this.ctor, OR, this.previous, this.nested).parse();
    }
    if (NOT) {
      result += " NOT ";
      if (Array.isArray(NOT)) {
        for (let i = 0; i < NOT.length; i++) {
          const element = NOT[i];
          if (i > 0) result += " NOT ";
          result += new WhereFilter(this.ctor, element, this.previous).parse();
        }
      } else if (typeof NOT === "object") result += new WhereFilter(this.ctor, NOT, this.previous, this.nested).parse();
    }
    return result;
  }
}
