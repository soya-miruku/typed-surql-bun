import { Friends, User } from "./model";
import TypedSurQL from '../src/client';
import { fx } from "../src/exports";

await TypedSurQL.init("http://127.0.0.1:8000", {
  auth: {
    username: "root",
    password: "root"
  },
  websocket: true,
  namespace: "test",
  database: "test"
})

const user1 = (await User.create({
  name: "test",
  todos: [{ title: "test", completed: false }],
  email: "email@email.com",
  password: "password"
}))[0];

const user2 = (await User.create({
  name: "test",
  todos: [{ title: "test", completed: false }],
  email: "email@email.com",
  password: "password"
}))[0];

const related = await User.relate(user1.id, Friends, [User, user2.id])

console.log(await User.select("*", { where: { id: fx.meta.thing(User, "nv0528j7qg25i6nr1gim").fn } }))