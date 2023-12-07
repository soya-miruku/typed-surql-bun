import { Q } from "../src";

export const Todo = Q.Type.Object({
  title: Q.Type.String(),
  completed: Q.Type.Boolean(),
});

@Q.Table({ name: "friends" })
export class Friends extends Q.RelationEdge<User, User>{
  @Q.Prop() date!: Date
}

@Q.Table({ name: "car" })
export class Car extends Q.Model {
  @Q.Prop() name!: string
  @Q.Prop() color!: string
  @Q.Prop() model!: string
  @Q.Prop() owner!: `user:${string}`
}

@Q.Table({ name: "user" })
export class User extends Q.Model {
  @Q.Prop() name!: string
  @Q.Relation("->", Friends, "->", User) readonly friends!: User[] // so far the relational type must be readonly
  @Q.Relation("->", Friends, ".*.out") readonly friendsMeta!: Friends[]
  @Q.Prop(_ => [Todo]) todos!: Todo[] // passing the object in the second arg, will allow you to later query the object using the query func
  @Q.Record(User) bestFriend?: Q.RecordOf<User>
  @Q.Prop() password!: string
  @Q.Prop() email!: string
}

export type UserObject = Q.Static<User>;
export type Todo = Q.Static<typeof Todo>;
