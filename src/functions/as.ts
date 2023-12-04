import { qlFn } from "./index.ts"

export const alias = {
  as: (name: string) => qlFn.create(`AS ${name}`),
}