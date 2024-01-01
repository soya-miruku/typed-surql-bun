import { Type } from "@sinclair/typebox";
import { RelationEdge, table, prop, Static, Model, relation, record } from "../src";

export const Todo = Type.Object({
  title: Type.String(),
  completed: Type.Boolean(),
});

@table({ name: "friends" })
export class Friends extends RelationEdge<User, User>{
  @prop() date!: Date
  @prop() type!: "friend" | "family"
}

@table({ name: "car" })
export class Car extends Model {
  @prop(_ => String) name!: string
  @prop(_ => String) color!: string
  @prop(_ => String) model!: string
  @prop() owner!: `user:${string}`
}

@table({ name: "user" })
export class User extends Model {
  @prop() name!: string
  @relation("->", Friends, "->", User) readonly friends!: User[] // so far the relational type must be readonly
  @relation("->", Friends, ".*.out") readonly friendsMeta!: Friends[]
  @prop(_ => [Todo]) todos!: Todo[] // passing the object in the second arg, will allow you to later query the object using the query func
  @record(User) bestFriend?: User
  @prop() password!: string
  @prop() email!: string
}

export type UserObject = Static<User>;
export type Todo = Static<typeof Todo>;


@table({ name: "whitelist" })
export class Whitelist extends Model {
  @prop() declare id: string
}