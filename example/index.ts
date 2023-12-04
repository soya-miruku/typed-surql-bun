import "reflect-metadata";
import { Q } from '../src/index.ts';
import TypedSurQL from '../src/client.ts';
import { Permissions } from "../src/permissions.ts";

await TypedSurQL.init("http://127.0.0.1:8000", {
  auth: {
    username: "root",
    password: "root"
  },
  websocket: true,
  namespace: "test",
  database: "test"
})

const SECRET = "eyJhbGciOiJIUzUxMiJ9.uMQdGd-";

const Todo = Q.Type.Object({
  title: Q.Type.String(),
  completed: Q.Type.Boolean(),
});

@Q.Table({ name: "friends" })
class Friends extends Q.RelationEdge<User, User>{
  @Q.Prop() date!: Date
}

@Q.Table({ name: "user" })
class User extends Q.Model {
  @Q.Prop() name!: string
  @Q.Relation("->", Friends, "->", User) readonly friends!: User[] // so far the relational type must be readonly
  @Q.Relation("->", Friends, ".*.out") readonly friendsMeta!: Friends[]
  @Q.Prop(_ => [Todo]) todos!: Todo[] // passing the object in the second arg, will allow you to later query the object using the query func
  @Q.Record(User) bestFriend?: Q.RecordOf<User>
  @Q.Prop() password!: string
  @Q.Prop() email!: string
}

const liveQuery = User.$subscribe();
for await (const data of liveQuery) {
  console.log(data)
}

const UsersScope = await TypedSurQL.createScope(User, { $email: Q.Type.String(), $password: Q.Type.String() }, {
  name: "users",
  session: "7d",
  signin: ({ ql, fn: { TABLE, crypto, field }, $email, $password }) => {
    return ql`SELECT * FROM ${TABLE} WHERE ${field("email")} = ${$email} AND ${crypto.argon2.compare(field("password"), $password)}`
  },
  signup: ({ ql, fn: { TABLE, crypto, field }, $email, $password }) => {
    return ql`CREATE ${TABLE} SET ${field("email")} = ${$email}, pass = ${crypto.argon2.generate($password)}`
  }
});

const AuthToken = await TypedSurQL.createToken({ name: "auth_token", on: UsersScope, type: "HS512" }, SECRET, { userId: Q.Type.String() })

/**
 * maybe....
 * Schema.table("user", { indexes: [{ columns: ["email"], unique: true }] })
 * .string("id")
 * .string("name")
 * .string("email")
 * .field("todos", { type: Type.Array(todo) })
 * .record("bestFriend", { type: User })
 * .relation("friends", { from: User, via: Friends, to: User, dirVia: "->", select: "->" })
 * .relation("friendsMeta", { from: User, via: Friends, to: User, dirVia: "->", select: ".*.out" })
 * .string("password")
 * 
 */


/**
 * Define(User, { scope: UsersScope, token: AuthToken })
 * .Pemissions("SELECT", ({ field, ql, $token, $scope }) => ql`${$scope} === "users" AND ${field("id")} = ${$token.id}`)
 * .Pemissions("UPDATE", "NONE")
 * .Pemissions(["CREATE", "DELETE"], ({ field, ql, $token, time, $auth }) => ql`${$token.id} = ${field("id")} OR ${$token.exp} = ${time.now()} OR ${$auth.admin} === true`)
 * .exec()
 */

Permissions.Of(User, { scope: UsersScope, token: AuthToken })
  .for("SELECT", ({ field, ql, $token, $scope }) => ql`${$scope} === "users" AND ${field("id")} = ${$token.id}`)
  .for("UPDATE", "NONE")
  .for(["CREATE", "DELETE"], ({ field, ql, $token, time, $auth }) => ql`${$token.id} = ${field("id")} OR ${$token.exp} = ${time.now()} OR ${$auth.admin} === true`)
  .toString()

console.log(UsersScope, 'usersScope')
export type UserObject = Q.Static<User>;
export type Todo = Q.Static<typeof Todo>;

const henry = await User.create({ name: "henry", todos: [{ title: "test", completed: false }], email: "something@email.com", password: "12" });
const bingo = await User.create({ name: "bingo", bestFriend: "user:0", todos: [{ title: "test", completed: false }, { title: "test2", completed: true }], email: "milking@email.com", password: "123" });

const r_rel = await User.relate(henry.at(0)!.id, Friends, [User, bingo.at(0)!.id], {
  date: new Date()
})

/** Execute a query using scoped auth
 * 
 * {
    await using scoped = await TypedSurQL.scopedAuth(t);
    const { conn: { client } } = scoped;
    console.log(await client.query("SELECT * FROM user"), 'le scope')
    console.log(await client.query("SELECT * FROM $token"))
  }

  {
    await using userScoped = await User.scopedAuth(t);
    const { model } = userScoped;
    const r = await model.query((q, f) => q`SELECT * FROM $token;`).exec()
    console.log(r, 'USER');
  }
 */

console.log(await User.query((q, f) => q`SELECT * FROM $token`).exec())
const result = await User.select(["todos", "friends", "bestFriend", "friendsMeta"], { fetch: ["friends", "bestFriend", "friendsMeta"], where: Q.ql`name = "henry"`, logQuery: true });
console.log(result)

/** RETURNS (AS AN EXAMPLE)
 * [
  { friends: [], todos: [ { completed: false, title: "test" } ] },
  {
    friends: [],
    todos: [
      { completed: false, title: "test" },
      { completed: true, title: "test2" }
    ]
  },
  { friends: [], todos: [ { completed: false, title: "test" } ] }
]
 */

const anotherway = await User.query((q, f) => q`SELECT ${f("todos.completed")} FROM ${f.TABLE}`).exec<Omit<User, "id" | "friends">[]>();
console.log(anotherway)

/** RETURNS (AS AN EXAMPLE)
 * [
  { todos: { completed: [ false ] } },
  { todos: { completed: [ false, true ] } },
  { todos: { completed: [ false ] } }
]
 */

type AliasReturn = { completed: boolean[] };
const alias = await User.query((q, f) => q`SELECT ${f("todos.completed").as("completed")} FROM ${f.TABLE}`).exec<AliasReturn[]>();
console.log(alias);

/** RETURNS (AS AN EXAMPLE)
 * [
  { completed: [ false ] },
  { completed: [ false, true ] },
  { completed: [ false ] }
]
 */

const aliasValue = await User.query((q, { VALUE, TABLE, field }) => q`SELECT ${VALUE} ${field("todos.completed").as("completed")} FROM ${TABLE}`).exec();
console.log(aliasValue);

/** RETURNS (AS AN EXAMPLE)
 * [ [ false ], [ false, true ], [ false ] ]
 */

const stringFnc = await User.query((q, { LIMIT, TABLE, field, string, meta }) => q`SELECT ${string.uppercase(field("name")).as("upper_name")} FROM ${TABLE} ${LIMIT(2)}`).exec();
console.log(stringFnc);

/** RETURNS (AS AN EXAMPLE)
 * [ { upper_name: "MILK" } ]
 */