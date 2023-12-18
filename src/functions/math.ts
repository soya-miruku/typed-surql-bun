import { qlFn } from './index.ts'

export function abs(value: number | qlFn) {
  return qlFn.create(`math::abs(${value})`)
}

export function bottom(array: Array<number>, number: number) {
  return qlFn.create(`math::bottom([${array}], ${number})`)
}

export function ceil(value: number | qlFn) {
  return qlFn.create(`math::ceil(${value})`)
}

export function fixed(value: number | qlFn, precision: number) {
  return qlFn.create(`math::fixed(${value}, ${precision})`)
}

export function floor(value: number | qlFn) {
  return qlFn.create(`math::floor(${value})`)
}

export function interquartile(array: Array<number> | qlFn) {
  return qlFn.create(`math::interquartile([${array}])`)
}

export function max(array: Array<number> | qlFn) {
  return qlFn.create(`math::max([${array}])`)
}

export function mean(array: Array<number> | qlFn) {
  return qlFn.create(`math::mean([${array}])`)
}

export function median(array: Array<number> | qlFn) {
  return qlFn.create(`math::median([${array}])`)
}

export function midhinge(array: Array<number> | qlFn) {
  return qlFn.create(`math::midhinge([${array}])`)
}

export function min(array: Array<number> | qlFn) {
  return qlFn.create(`math::min([${array}])`)
}

export function mode(array: Array<number> | qlFn) {
  return qlFn.create(`math::mode([${array}])`)
}

export function nearestrank(array: Array<number> | qlFn, number: number) {
  return qlFn.create(`math::nearestrank([${array}], ${number})`)
}

export function percentile(array: Array<number> | qlFn, number: number) {
  return qlFn.create(`math::percentile([${array}], ${number})`)
}

export function product(array: Array<number> | qlFn) {
  return qlFn.create(`math::product([${array}])`)
}

export function round(value: number | qlFn) {
  return qlFn.create(`math::round(${value})`)
}

export function spread(array: Array<number> | qlFn) {
  return qlFn.create(`math::spread([${array}])`)
}

export function sqrt(value: number | qlFn) {
  return qlFn.create(`math::sqrt(${value})`)
}

export function stddev(array: Array<number> | qlFn) {
  return qlFn.create(`math::stddev([${array}])`)
}

export function sum(array: Array<number> | qlFn) {
  return qlFn.create(`math::sum([${array}])`)
}

export function top(array: Array<number> | qlFn, number: number) {
  return qlFn.create(`math::top([${array}], ${number})`)
}

export function trimean(array: Array<number> | qlFn) {
  return qlFn.create(`math::trimean([${array}])`)
}

export function variance(array: Array<number> | qlFn) {
  return qlFn.create(`math::variance([${array}])`)
}

export const math = {
  abs,
  bottom,
  ceil,
  fixed,
  floor,
  interquartile,
  max,
  mean,
  median,
  midhinge,
  min,
  mode,
  nearestrank,
  percentile,
  product,
  round,
  spread,
  sqrt,
  stddev,
  sum,
  top,
  trimean,
  variance,
}