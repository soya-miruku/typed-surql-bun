import { Car, Friends, User } from "./model";
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

const deletionResult = await User.delete()
const deleteCars = await Car.delete()
console.log(deletionResult);

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

const cars = await Car.insert([{
  name: "test",
  color: "red",
  model: "model",
  owner: user1.id as `user:${string}`
},
{
  name: "test",
  color: "red",
  model: "model",
  owner: user2.id as `user:${string}`
}
]);

const related = await User.relate(user1.id, Friends, [User, user2.id])

console.log(await User.select("*", { where: { email: "email@email.com" } }))
console.log(await Car.select("*", { where: { owner: fx.meta.thing(User, cars[0].owner.split(":")[1]) } }))