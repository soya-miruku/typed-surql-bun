import { qlFn } from "./index.ts";

export type DurationType = `${number}w` | `${number}d` | `${number}h` | `${number}m` | `${number}s` | `${number}ms` | `${number}us` | `${number}ns`

export function days(duration: DurationType) {
  return qlFn.create(`duration::days(${duration})`)
}

export function hours(duration: DurationType) {
  return qlFn.create(`duration::hours(${duration})`)
}

export function micros(duration: DurationType) {
  return qlFn.create(`duration::micros(${duration})`)
}

export function millis(duration: DurationType) {
  return qlFn.create(`duration::millis(${duration})`)
}

export function mins(duration: DurationType) {
  return qlFn.create(`duration::mins(${duration})`)
}

export function nanos(duration: DurationType) {
  return qlFn.create(`duration::nanos(${duration})`)
}

export function secs(duration: DurationType) {
  return qlFn.create(`duration::secs(${duration})`)
}

export function weeks(duration: DurationType) {
  return qlFn.create(`duration::weeks(${duration})`)
}

export function years(duration: DurationType) {
  return qlFn.create(`duration::years(${duration})`)
}

export function from_days(from: number) {
  return qlFn.create(`duration::from::days(${from})`)
}

export function from_hours(from: number) {
  return qlFn.create(`duration::from::hours(${from})`)
}

export function from_micros(from: number) {
  return qlFn.create(`duration::from::micros(${from})`)
}

export function from_millis(from: number) {
  return qlFn.create(`duration::from::millis(${from})`)
}

export function from_mins(from: number) {
  return qlFn.create(`duration::from::mins(${from})`)
}


export function from_nanos(from: number) {
  return qlFn.create(`duration::from::nanos(${from})`)
}

export function from_secs(from: number) {
  return qlFn.create(`duration::from::secs(${from})`)
}

export function from_weeks(from: number) {
  return qlFn.create(`duration::from::weeks(${from})`)
}

export const durations = {
  days,
  hours,
  micros,
  millis,
  mins,
  nanos,
  secs,
  weeks,
  years,
  from_days,
  from_hours,
  from_micros,
  from_millis,
  from_mins,
  from_nanos,
  from_secs,
  from_weeks
}