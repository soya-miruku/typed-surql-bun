import TypedSurQL from '../src/client';

TypedSurQL.setUrl("ws://127.0.0.1:8000/rpc");
console.log("Connecting...")
await TypedSurQL.init({ websocket: true })
// await TypedSurQL.init("ws://localhost:8000/rpc", { websocket: true });
console.log(await TypedSurQL.client.ready)
console.log(await TypedSurQL.client.query("info for db"))
console.log("Connected!")