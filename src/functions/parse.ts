import { qlFn } from "./index.ts";

export function email_host(email: string) {
  return qlFn.create(`parse::email::host("${email}")`)
}

export function email_user(email: string) {
  return qlFn.create(`parse::email::user("${email}")`)
}

export function url_domain(url: string) {
  return qlFn.create(`parse::url::domain("${url}")`)
}

export function url_fragment(url: string) {
  return qlFn.create(`parse::url::fragment("${url}")`)
}

export function url_host(url: string) {
  return qlFn.create(`parse::url::host("${url}")`)
}

export function url_path(url: string) {
  return qlFn.create(`parse::url::path("${url}")`)
}

export function url_port(url: string) {
  return qlFn.create(`parse::url::port("${url}")`)
}

export function url_query(url: string) {
  return qlFn.create(`parse::url::query("${url}")`)
}

export const parse = {
  email: {
    host: email_host,
    user: email_user
  },
  url: {
    domain: url_domain,
    fragment: url_fragment,
    host: url_host,
    path: url_path,
    port: url_port,
    query: url_query
  }
}