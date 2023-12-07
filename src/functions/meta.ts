import type { Constructor } from 'type-fest';
import { qlFn } from './index.ts'
import { IModel } from '../types/types.ts';
import { type } from './mod.ts';

export function id(record: `${string}:${string}`) {
  return qlFn.create(`meta::id(${record})`)
}
export function tb(record: `${string}:${string}`) {
  return qlFn.create(`meta::tb(${record})`)
}

export function thing<T extends Constructor<IModel>, Idx extends string>(target: T, id: Idx) {
  return type.thing(target.name, id)
}

export function tbl<T extends Constructor<IModel>>(target: T) {
  return qlFn.create(`${target.name}`);
}

export const meta = {
  id,
  tb,
  tbl,
  thing,
}