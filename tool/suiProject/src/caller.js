import worker from "../src/worker.js";

let privateKey = process.argv[2];
let rpc = process.argv[3];
let total = process.argv[4];
let p = new worker(privateKey, rpc, total);
await p.work();
