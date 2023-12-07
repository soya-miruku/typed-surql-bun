import TypedSurQL from '../src/client.ts';
import { Type } from '../src/exports.ts';
import { Permissions } from '../src/permissions.ts';
import { User } from './model.ts';

const SECRET = "eyJhbGciOiJIUzUxMiJ9.uMQdGd-";

const UsersScope = await TypedSurQL.createScope(User, { $email: Type.String(), $password: Type.String() }, {
  name: "users",
  session: "7d",
  signin: ({ ql, fn: { TABLE, crypto, field }, $email, $password }) => {
    return ql`SELECT * FROM ${TABLE} WHERE ${field("email")} = ${$email} AND ${crypto.argon2.compare(field("password"), $password)}`
  },
  signup: ({ ql, fn: { TABLE, crypto, field }, $email, $password }) => {
    return ql`CREATE ${TABLE} SET ${field("email")} = ${$email}, pass = ${crypto.argon2.generate($password)}`
  }
});

const AuthToken = await TypedSurQL.createToken({ name: "auth_token", on: UsersScope, type: "HS512" }, SECRET, { userId: Type.String() })
Permissions.Of(User, { scope: UsersScope, token: AuthToken })
  .for("SELECT", ({ field, ql, $token, $scope }) => ql`${$scope} === "users" AND ${field("id")} = ${$token.id}`)
  .for("UPDATE", "NONE")
  .for(["CREATE", "DELETE"], ({ field, ql, $token, time, $auth }) => ql`${$token.id} = ${field("id")} OR ${$token.exp} = ${time.now()} OR ${$auth.admin} === true`)
  .toString()

console.log(UsersScope, 'usersScope')


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
