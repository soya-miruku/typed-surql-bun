import "reflect-metadata";
import { Q } from '../src/index.ts';
import TypedSurQL from '../src/client.ts';
import { Friends, User } from "./model.ts";

await TypedSurQL.init("http://127.0.0.1:8000", {
  auth: {
    username: "root",
    password: "root"
  },
  websocket: true,
  namespace: "test",
  database: "test"
})

const liveQuery = User.$subscribe("DELETE");

for await (const data of liveQuery) {
  console.log(data)
}

const henry = await User.create({ name: "henry", todos: [{ title: "test", completed: false }], email: "something@email.com", password: "12" });
const bingo = await User.create({ name: "bingo", bestFriend: "user:0", todos: [{ title: "test", completed: false }, { title: "test2", completed: true }], email: "milking@email.com", password: "123" });

const r_rel = await User.relate(henry.at(0)!.id, Friends, [User, bingo.at(0)!.id], {
  date: new Date()
})

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