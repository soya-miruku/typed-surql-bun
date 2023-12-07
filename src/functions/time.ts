import { DurationType } from './duration.ts';
import { qlFn, parseType } from './index.ts';

export function day(datetime: Date) {
  return qlFn.create(`time::day(${parseType(datetime)})`);
}

export function epoch() {
  return qlFn.create("time::EPOCH");
}

export function floor(datetime: Date, duration: DurationType) {
  return qlFn.create(`time::floor(${parseType(datetime)}, ${duration})`);
}

export function format(datetime: Date, format: string) {
  return qlFn.create(`time::format(${parseType(datetime)}, "${format}")`);
}

export function group(datetime: Date, group: string) {
  return qlFn.create(`time::group(${parseType(datetime)}, "${group}")`);
}

export function hour(datetime: Date) {
  return qlFn.create(`time::hour(${parseType(datetime)})`);
}

export function max(dates: Array<Date>) {
  return qlFn.create(`time::max(${parseType(dates)})`);
}

export function min(dates: Array<Date>) {
  return qlFn.create(`time::min(${parseType(dates)})`);
}

export function minute(datetime: Date) {
  return qlFn.create(`time::minute(${parseType(datetime)})`);
}

export function month(datetime: Date) {
  return qlFn.create(`time::month(${parseType(datetime)})`);
}

export function nano(datetime: Date) {
  return qlFn.create(`time::nano(${parseType(datetime)})`);
}

export function now() {
  return qlFn.create("time::now()");
}

export function round(datetime: Date, duration: DurationType) {
  return qlFn.create(`time::round(${parseType(datetime)}, ${duration})`);
}

export function second(datetime: Date) {
  return qlFn.create(`time::second(${parseType(datetime)})`);
}

export function timezone() {
  return qlFn.create("time::timezone()");
}

export function unix(num: number) {
  return qlFn.create(`time::from::unix(${num})`);
}

export function wday(datetime: Date) {
  return qlFn.create(`time::wday(${parseType(datetime)})`);
}

export function week(datetime: Date) {
  return qlFn.create(`time::week(${parseType(datetime)})`);
}

export function yday(datetime: Date) {
  return qlFn.create(`time::yday(${parseType(datetime)})`);
}

export function year(datetime: Date) {
  return qlFn.create(`time::year(${parseType(datetime)})`);
}

export function micros(num: number) {
  return qlFn.create(`time::from::micros(${num})`);
}

export function millis(num: number) {
  return qlFn.create(`time::from::millis(${num})`);
}

export function secs(num: number) {
  return qlFn.create(`time::from::secs(${num})`);
}

export function from_wday(num: number) {
  return qlFn.create(`time::from::wday(${num})`);
}

export function from_unix(num: number) {
  return qlFn.create(`time::from::unix(${num})`);
}


export const time = {
  day,
  epoch,
  floor,
  format,
  group,
  hour,
  max,
  min,
  minute,
  month,
  nano,
  now,
  round,
  second,
  timezone,
  unix,
  wday,
  week,
  yday,
  year,
  from_wday,
  from_unix,
  micros,
  millis,
  secs
}