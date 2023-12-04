import { qlFn, parseType } from './index.ts'

export function rand() {
  return qlFn.create("rand()")
}

export function rand_bool() {
  return qlFn.create("rand::bool()")
}

export function rand_enum(...params: any[]) {
  return qlFn.create(`rand::enum([${params.map(v => parseType(v))}])`)
}

export function rand_float(min?: number, max?: number) {
  if (min && max) {
    return qlFn.create(`rand::float(${min}, ${max})`)
  }
  return qlFn.create(`rand::float()`)
}

export function rand_guid(val?: number) {
  if (val) {
    return qlFn.create(`rand::guid(${val})`)
  }
  return qlFn.create(`rand::guid()`)
}

export function rand_int(min?: number, max?: number) {
  if (min && max) {
    return qlFn.create(`rand::int(${min}, ${max})`)
  }
  return qlFn.create(`rand::int()`)
}

export function rand_string(min?: number, max?: number) {
  if (min && max) {
    return qlFn.create(`rand::string(${min}, ${max})`)
  } else if (min) {
    return qlFn.create(`rand::string(${min})`)
  }
  return qlFn.create(`rand::string()`)
}

export function rand_time(min?: number, max?: number) {
  if (min && max) {
    return qlFn.create(`rand::time(${min}, ${max})`)
  }
  return qlFn.create(`rand::time()`)
}

export function rand_uuid() {
  return qlFn.create(`rand::uuid()`)
}

export function rand_uuid_v4() {
  return qlFn.create(`rand::uuid::v4()`)
}

export function rand_uuid_v7() {
  return qlFn.create(`rand::uuid::v7()`)
}

export function rand_ulid() {
  return qlFn.create(`rand::ulid()`)
}

export const rands = {
  bool: rand_bool,
  enum: rand_enum,
  float: rand_float,
  guid: rand_guid,
  int: rand_int,
  string: rand_string,
  time: rand_time,
  uuid: rand_uuid,
  uuid_v4: rand_uuid_v4,
  uuid_v7: rand_uuid_v7,
  ulid: rand_ulid
}