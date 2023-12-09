import "reflect-metadata";
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

// const bingo = await User.create({ name: "bingo", bestFriend: "user:0", todos: [{ title: "test", completed: false }, { title: "test2", completed: true }], email: "milking@email.com", password: "123" });
// const henry = await User.create({ name: "henry", todos: [{ title: "test", completed: false }], email: "something@email.com", password: "12" });

// const liveQuery = User.$subscribe("ALL", { name: "henry" });

// for await (const data of liveQuery) {
//   console.log(data)
// }

// const r_rel = await User.relate(henry.at(0)!.id, Friends, [User, bingo.at(0)!.id], {
//   date: new Date()
// })

// await User.select("*", { ignoreRelations: true });
const r = await Friends.select("*", { fetch: ["in", "out"], logQuery: true });
console.log(r)

await Friends.live((data) => {
  console.log(data.result?.in)
}) 