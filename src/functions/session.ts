import { qlFn } from "./index.ts";

export function db() {
  return qlFn.create("session::db()");
}

export function id() {
  return qlFn.create("session::id()");
}

export function ip() {
  return qlFn.create("session::ip()");
}

export function ns() {
  return qlFn.create("session::ns()");
}

export function origin() {
  return qlFn.create("session::origin()");
}

export function sc() {
  return qlFn.create("session::sc()");
}

export const session = {
  db,
  id,
  ip,
  ns,
  origin,
  sc,
}