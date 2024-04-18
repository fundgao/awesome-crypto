import Logger from "@youpaichris/logger";
import cp from "child_process";
import fs from "fs";

import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { fromHEX } from "@mysten/sui.js/utils";

const logger = new Logger();
const keys = fs.readFileSync("keys.txt", "utf8").split(/\r?\n/);

//https://sui-mainnet.blockvision.org/v1/2PFBQoJRHoiqCPNuMZRw3ty9ONe
//https://fullnode.mainnet.sui.io

let rpc = "https://fullnode.mainnet.sui.io";
let total = 1000;
//let data = `data:application/json,{"p":"ton-20","op":"mint","tick":"ton","amt":"10000000000"}`;
//let data = `data:application/json,{"p":"ton-20","op":"mint","tick":"bolt20","amt":"1000000000"}`;
for (let i = 0; i < keys.length; i++) {
  const args = keys[i].split("----");
  let privateKey;
  if (args.length < 2) {
    privateKey = args[0];
  } else {
    privateKey = args[1];
  }

  //判断私钥是否为空
  if (privateKey == "") {
    logger.error(`privateKey is empty, continue...`);
    continue;
  }

  // const privateKey = keys[i];
  const keypair = Ed25519Keypair.fromSecretKey(fromHEX(privateKey));
  const address = keypair.getPublicKey().toSuiAddress();
  logger.info(
    `Start ${
      i + 1
    } child process,privateKey  ${privateKey} address ${address} ...`
  );
  const child = cp.fork("src/caller.js", [privateKey, rpc, total]);
  child.on("message", (msg) => {
    logger.success(msg);
  });
}
