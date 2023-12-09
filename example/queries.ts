import TypedSurQL from '../src/client.ts';
import { ql } from "../src";
import { User } from "./model";

await TypedSurQL.init("http://127.0.0.1:8000", {
  auth: {
    username: "root",
    password: "root"
  },
  websocket: true,
  namespace: "test",
  database: "test"
})


console.log(await User.query((q, f) => q`SELECT * FROM $token`).exec())
const result = await User.select(["todos", "friends", "bestFriend", "friendsMeta"], { fetch: ["friends", "bestFriend", "friendsMeta"], where: ql`name = "henry"`, logQuery: true, ignoreRelations: true });
console.log(result, 'result')

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