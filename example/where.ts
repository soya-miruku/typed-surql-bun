import { WhereFilter } from "../src/logic/where";
import { User } from "./model";

const query = new WhereFilter(User, {
  name: "henry",
  todos: {
    completed: true
  },
  friends: {
    name: "bingo"
  },
});

console.log(query.parse())