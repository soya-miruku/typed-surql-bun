import { qlFn, parseType } from './index.ts';

export function bool(value: any) {
  return qlFn.create(`type::bool(${parseType(value)})`);
}

export function datetime(value: any) {
  return qlFn.create(`type::datetime(${parseType(value)})`);
}

export function decimal(value: any) {
  return qlFn.create(`type::decimal(${parseType(value)})`);
}

export function duration(value: any) {
  return qlFn.create(`type::duration(${parseType(value)})`);
}

export function field(value: string | qlFn) {
  return qlFn.create(`type::field(${parseType(value)})`);
}

export function fields(value: string[]) {
  return qlFn.create(`type::fields(${parseType(value)})`);
}

export function float(value: any) {
  return qlFn.create(`type::float(${parseType(value)})`);
}

export function int(value: any) {
  return qlFn.create(`type::int(${parseType(value)})`);
}

export function number(value: any) {
  return qlFn.create(`type::number(${parseType(value)})`);
}

export function point(value: any) {
  return qlFn.create(`type::point(${parseType(value)})`);
}

export function point2(lh: number, rh: number) {
  return qlFn.create(`type::point(${lh}, ${rh})`);
}

export function string(value: any) {
  return qlFn.create(`type::string(${parseType(value)})`);
}

export function table(value: any) {
  return qlFn.create(`type::table(${parseType(value)})`);
}

export function thing(table: any, id: any) {
  return qlFn.create(`type::thing(${parseType(table)}, ${parseType(id)})`);
}

export function is_array(value: any) {
  return qlFn.create(`type::is::array(${parseType(value)})`);
}

export function is_bool(value: any) {
  return qlFn.create(`type::is::bool(${parseType(value)})`);
}

export function is_bytes(value: any) {
  return qlFn.create(`type::is::bytes(${parseType(value)})`);
}

export function is_collection(value: any) {
  return qlFn.create(`type::is::collection(${parseType(value)})`);
}

export function is_datetime(value: any) {
  return qlFn.create(`type::is::datetime(${parseType(value)})`);
}

export function is_decimal(value: any) {
  return qlFn.create(`type::is::decimal(${parseType(value)})`);
}

export function is_duration(value: any) {
  return qlFn.create(`type::is::duration(${parseType(value)})`);
}

export function is_float(value: any) {
  return qlFn.create(`type::is::float(${parseType(value)})`);
}

export function is_geometry(value: any) {
  return qlFn.create(`type::is::geometry(${parseType(value)})`);
}

export function is_int(value: any) {
  return qlFn.create(`type::is::int(${parseType(value)})`);
}

export function is_line(value: any) {
  return qlFn.create(`type::is::line(${parseType(value)})`);
}

export function is_null(value: any) {
  return qlFn.create(`type::is::null(${parseType(value)})`);
}

export function is_multiline(value: any) {
  return qlFn.create(`type::is::multiline(${parseType(value)})`);
}

export function is_multipoint(value: any) {
  return qlFn.create(`type::is::multipoint(${parseType(value)})`);
}

export function is_multipolygon(value: any) {
  return qlFn.create(`type::is::multipolygon(${parseType(value)})`);
}

export function is_number(value: any) {
  return qlFn.create(`type::is::number(${parseType(value)})`);
}

export function is_object(value: any) {
  return qlFn.create(`type::is::object(${parseType(value)})`);
}

export function is_point(value: any) {
  return qlFn.create(`type::is::point(${parseType(value)})`);
}

export function is_polygon(value: any) {
  return qlFn.create(`type::is::polygon(${parseType(value)})`);
}

export function is_record(value: any) {
  return qlFn.create(`type::is::record(${parseType(value)})`);
}

export function is_string(value: any) {
  return qlFn.create(`type::is::string(${parseType(value)})`);
}

export function is_uuid(value: any) {
  return qlFn.create(`type::is::uuid(${parseType(value)})`);
}