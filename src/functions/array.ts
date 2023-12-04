import { parseType, qlFn } from "./index.ts"

export function add(array: Array<any>, value: any) {
  return qlFn.create(`array::add(${parseType(array)}, ${parseType(value)})`)
}

export function all(array: Array<any>) {
  return qlFn.create(`array::all(${parseType(array)})`)
}

export function any(array: Array<any>) {
  return qlFn.create(`array::any(${parseType(array)})`)
}

export function at(array: Array<any>, index: number) {
  return qlFn.create(`array::at(${parseType(array)}, ${index})`)
}

export function append(array: Array<any>, value: any) {
  return qlFn.create(`array::append(${parseType(array)}, ${parseType(value)})`)
}

export function boolean_and(lh: Array<any>, rh: Array<any>) {
  return qlFn.create(`array::boolean_and([${lh.map(v => parseType(v))}], [${rh.map(v => parseType(v))}])`)
}

export function boolean_or(lh: Array<any>, rh: Array<any>) {
  return qlFn.create(`array::boolean_or([${lh.map(v => parseType(v))}], [${rh.map(v => parseType(v))}])`)
}

export function boolean_xor(lh: Array<any>, rh: Array<any>) {
  return qlFn.create(`array::boolean_xor([${lh.map(v => parseType(v))}], [${rh.map(v => parseType(v))}])`)
}

export function boolean_not(array: Array<any>) {
  return qlFn.create(`array::boolean_not(${parseType(array)})`)
}

export function combine(lh: Array<any>, rh: Array<any>) {
  return qlFn.create(`array::combine([${lh.map(v => parseType(v))}], [${rh.map(v => parseType(v))}])`)
}

export function complement(lh: Array<any>, rh: Array<any>) {
  return qlFn.create(`array::complement([${lh.map(v => parseType(v))}], [${rh.map(v => parseType(v))}])`)
}

export function concat(lh: Array<any>, rh: Array<any>) {
  return qlFn.create(`array::concat([${lh.map(v => parseType(v))}], [${rh.map(v => parseType(v))}])`)
}

export function clump(array: Array<any>, size: number) {
  return qlFn.create(`array::clump(${parseType(array)}, ${size})`)
}

export function difference(lh: Array<any>, rh: Array<any>) {
  return qlFn.create(`array::difference([${lh.map(v => parseType(v))}], [${rh.map(v => parseType(v))}])`)
}

export function distinct(array: Array<any>) {
  return qlFn.create(`array::distinct(${parseType(array)})`)
}

export function flatten(array: Array<any>) {
  return qlFn.create(`array::flatten(${parseType(array)})`)
}

export function find_index(array: Array<any>, value: any) {
  return qlFn.create(`array::find_index(${parseType(array)}, ${parseType(value)})`)
}

export function filter_index(array: Array<any>, value: any) {
  return qlFn.create(`array::filter_index(${parseType(array)}, ${parseType(value)})`)
}

export function first(array: Array<any>) {
  return qlFn.create(`array::first(${parseType(array)})`)
}

export function group(array: Array<any>) {
  return qlFn.create(`array::group(${parseType(array)})`)
}

export function insert(array: Array<any>, value: any, number: number) {
  return qlFn.create(`array::insert(${parseType(array)}, ${parseType(value)}, ${number})`)
}

export function intersect(lh: Array<any>, rh: Array<any>) {
  return qlFn.create(`array::intersect(${parseType(lh)}, ${parseType(rh)})`)
}

export function join(array: Array<any>, separator = ",") {
  return qlFn.create(`array::join(${parseType(array)}, "${separator}")`)
}

export function last(array: Array<any>) {
  return qlFn.create(`array::last(${parseType(array)})`)
}

export function len(array: Array<any>) {
  return qlFn.create(`array::len(${parseType(array)})`)
}

export function logical_and(lh: Array<any>, rh: Array<any>) {
  return qlFn.create(`array::logical_and(${parseType(lh)}, ${parseType(rh)})`)
}

export function logical_or(lh: Array<any>, rh: Array<any>) {
  return qlFn.create(`array::logical_or(${parseType(lh)}, ${parseType(rh)})`)
}

export function logical_xor(lh: Array<any>, rh: Array<any>) {
  return qlFn.create(`array::logical_xor(${parseType(lh)}, ${parseType(rh)})`)
}

export function matches(array: Array<any>, value: any) {
  return qlFn.create(`array::matches(${parseType(array)}, ${parseType(value)})`)
}

export function pop(array: Array<any>) {
  return qlFn.create(`array::pop(${parseType(array)})`)
}

export function prepend(array: Array<any>, value: any) {
  return qlFn.create(`array::prepend(${parseType(array)}, ${parseType(value)})`)
}

export function push(array: Array<any>, value: any) {
  return qlFn.create(`array::push(${parseType(array)}, ${parseType(value)})`)
}

export function remove(array: Array<any>, index: number) {
  return qlFn.create(`array::remove(${parseType(array)}, ${index})`)
}

export function reverse(array: Array<any>) {
  return qlFn.create(`array::reverse(${parseType(array)})`)
}

export function sort(array: Array<any>, asc: boolean | "asc" | "desc" = true) {
  return qlFn.create(`array::sort(${parseType(array)}, ${asc})`)
}

export function slice(array: Array<any>, start: number, end: number) {
  return qlFn.create(`array::slice(${parseType(array)}, ${start}, ${end})`)
}

export function transpose(lh: Array<any>, rh: Array<any>) {
  return qlFn.create(`array::transpose(${parseType(lh)}, ${parseType(rh)})`)
}

export function union(lh: Array<any>, rh: Array<any>) {
  return qlFn.create(`array::union(${parseType(lh)}, ${parseType(rh)})`)
}


export const arrays = {
  add,
  all,
  any,
  at,
  append,
  boolean_and,
  boolean_or,
  boolean_xor,
  boolean_not,
  combine,
  complement,
  concat,
  clump,
  difference,
  distinct,
  flatten,
  find_index,
  filter_index,
  first,
  group,
  insert,
  intersect,
  join,
  last,
  len,
  logical_and,
  logical_or,
  logical_xor,
  matches,
  pop,
  prepend,
  push,
  remove,
  reverse,
  slice,
  sort,
  transpose,
  union,
}