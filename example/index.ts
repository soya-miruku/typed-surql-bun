import "reflect-metadata";
import TypedSurQL from '../src/client.ts';
import { User } from "./model.ts";
import { sleep } from "../src/utils/helper.ts";

console.log("starting");

await TypedSurQL.init("ws://127.0.0.1:8000/rpc", {
  auth: {
    username: "root",
    password: "root"
  },
  websocket: true,
  namespace: "test",
  database: "test"
});

console.log("connected");

const sub = User.$subscribe();

setTimeout(async () => {
  const bingo = await User.create({ name: "bingo", bestFriend: "user:0", todos: [{ title: "test", completed: false }, { title: "test2", completed: true }], email: "milking@email.com", password: "123" });
  // const henry = await User.create({ name: "henry", todos: [{ title: "test", completed: false }], email: "something@email.com", password: "12" });
  await sleep(10)
  await sub.stop()
}, 1000);

for await (const data of sub) {
  console.log(data);
}

const bingo = await User.create({ name: "bingo", bestFriend: "user:0", todos: [{ title: "test", completed: false }, { title: "test2", completed: true }], email: "milking@email.com", password: "123" });
const henry = await User.create({ name: "henry", todos: [{ title: "test", completed: false }], email: "something@email.com", password: "12" });

const timenow = performance.now();

await User.insert(Array.from({ length: 10000 }).map((_, i) => ({
  name: `user${i}`,
  todos: [{ title: "test", completed: false }],
  email: `something${i}@email`,
  password: "12"
})));

console.log(performance.now() - timenow, "ms");

await User.new(TypedSurQL).select("*")

// const henry2 = await User.insert({ name: "henry2", todos: [{ title: "test", completed: false }], email: "something@email.com", password: "12" });
// const liveQuery = User.$subscribe("ALL", { where: { name: "asda" }, fetch: [] });

// const r_rel = await User.relate(henry.at(0)!.id, Friends, [User, bingo.at(0)!.id], {
//   date: new Date(),
//   type: "friend"
// })

// // await User.select("*", { ignoreRelations: true });
// const r = await Friends.select("*", { fetch: ["in", "out"], logQuery: true });
// console.log(r)

process.exit(0);