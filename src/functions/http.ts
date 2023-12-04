import { qlFn, parseType } from "./index.ts";

export function head(url: string, headers?: Record<string, string>) {
  if (!headers) return qlFn.create(`http::head("${url}")`)
  return qlFn.create(`http::head("${url}", ${parseType(headers)})`)
}

export function get(url: string, headers?: Record<string, string>) {
  if (!headers) return qlFn.create(`http::get("${url}")`)
  return qlFn.create(`http::get("${url}", ${parseType(headers)})`)
}

export function put(url: string, body: any, headers?: Record<string, string>) {
  if (!headers) return qlFn.create(`http::put("${url}", ${parseType(body)})`)
  return qlFn.create(`http::put("${url}", ${parseType(body)}, ${parseType(headers)})`)
}

export function post(url: string, body: any, headers?: Record<string, string>) {
  if (!headers) return qlFn.create(`http::post("${url}", ${parseType(body)})`)
  return qlFn.create(`http::post("${url}", ${parseType(body)}, ${parseType(headers)})`)
}

export function patch(url: string, body: any, headers?: Record<string, string>) {
  if (!headers) return qlFn.create(`http::patch("${url}", ${parseType(body)})`)
  return qlFn.create(`http::patch("${url}", ${parseType(body)}, ${parseType(headers)})`)
}

export function delete_(url: string, headers?: Record<string, string>) {
  if (!headers) return qlFn.create(`http::delete("${url}")`)
  return qlFn.create(`http::delete("${url}", ${parseType(headers)})`)
}

export const http = {
  head,
  get,
  put,
  post,
  patch,
  delete: delete_
}