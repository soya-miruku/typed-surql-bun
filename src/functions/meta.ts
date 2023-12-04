import type { Constructor } from 'type-fest';
import { qlFn } from './index.ts'
import { IModel } from '../types/types.ts';

export function id(record: `${string}:${string}`) {
  return qlFn.create(`meta::id(${record})`)
}
export function tb(record: `${string}:${string}`) {
  return qlFn.create(`meta::tb(${record})`)
}

export function thing<T extends Constructor<IModel>, Idx extends string>(target: T, id: Idx) {
  return qlFn.create(`${target.name}:${id}`);
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