import { qlFn, parseType, Input } from "./index.ts";

export function md5(value: any) {
  return qlFn.create(`crypto::md5(${parseType(value)})`)
}

export function sha1(value: any) {
  return qlFn.create(`crypto::sha1(${parseType(value)})`)
}

export function sha256(value: any) {
  return qlFn.create(`crypto::sha256(${parseType(value)})`)
}

export function sha512(value: any) {
  return qlFn.create(`crypto::sha512(${parseType(value)})`)
}

export function argon2Compare(input: Input, val: any) {
  return qlFn.create(`crypto::argon2::compare("${input}", ${parseType(val)})`)
}

export function argon2Generate(input: any) {
  return qlFn.create(`crypto::argon2::generate(${parseType(input)})`)
}

export function bcryptCompare(input: string, val: any) {
  return qlFn.create(`crypto::bcrypt::compare("${input}", ${parseType(val)})`)
}

export function bcryptGenerate(input: any) {
  return qlFn.create(`crypto::bcrypt::generate(${parseType(input)})`)
}

export function pbkdf2Compare(input: string, val: any) {
  return qlFn.create(`crypto::pbkdf2::compare("${input}", ${parseType(val)})`)
}

export function pbkdf2Generate(input: any) {
  return qlFn.create(`crypto::pbkdf2::generate(${parseType(input)})`)
}

export function scryptCompare(input: string, val: any) {
  return qlFn.create(`crypto::scrypt::compare("${input}", ${parseType(val)})`)
}

export function scryptGenerate(input: any) {
  return qlFn.create(`crypto::scrypt::generate(${parseType(input)})`)
}

export const cryptos = {
  md5,
  sha1,
  sha256,
  sha512,
  argon2: {
    compare: argon2Compare,
    generate: argon2Generate
  },
  bcrypt: {
    compare: bcryptCompare,
    generate: bcryptGenerate
  },
  pbkdf2: {
    compare: pbkdf2Compare,
    generate: pbkdf2Generate
  },
  scrypt: {
    compare: scryptCompare,
    generate: scryptGenerate
  }
}