import Logger from "@youpaichris/logger";
const logger = new Logger();
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import { fromHEX } from "@mysten/sui.js/utils";
class worker {
  #trg;
  #provider;
  #keyPair;
  #address;
  #total;
  constructor(privateKey, rpc, total) {
    this.#provider = new SuiClient({ url: rpc });
    this.#total = total;
    this.#trg = `0xd0ea9bc91c3855e9b58a51cd55e8455b37bd5c75f70b4d6e97e54b55c4ba4ae8::sui20::mint`;

    this.#keyPair = Ed25519Keypair.fromSecretKey(fromHEX(privateKey));
    this.#address = this.#keyPair.getPublicKey().toSuiAddress();
  }

  async getCoin(ownerAddress, coinType, amountIn) {
    let o = [],
      i = 0n;

    let bal = await this.#provider.getCoins({
      owner: ownerAddress,
      coinType: coinType,
    });
    for (const e of bal.data)
      if (
        (o.push(e.coinObjectId),
        (i += BigInt(e.balance)),
        i >= BigInt(amountIn))
      )
        return {
          success: !0,
          coins: o,
          totalAmount: i,
        };
    if (!bal.hasNextPage)
      return {
        success: !1,
        coins: o,
        totalAmount: i,
      };
  }

  async work() {
    const bal = await this.#provider.getBalance({
      owner: this.#address,
      coinType: "0x2::sui::SUI",
    });
    process.send(`${this.#address} 当前余额: ${bal.totalBalance}`);

    if (bal.totalBalance < 4000000) {
      // throw new Error(`Insufficient balance`);
      logger.error(`${this.#address} Insufficient balance`);
      return;
    }

    let count = 0;

    while (count < this.#total) {
      const tx = await this.mintNft();
      if (tx.digest == undefined) {
        // throw new Error("Unable to submit a transaction");
        continue;
      }
      process.send(`${this.#address} mint success, hash:${tx.digest}`);
      count++;
    }
  }

  async mintNft() {
    //const fee = 900 * Math.pow(10, 9);
    try {
      const txb = new TransactionBlock();
      let fee = 0n;
      const [l] = txb.splitCoins(txb.gas, [txb.pure(fee)]);
      const f = txb.moveCall({
        target: this.#trg,
        arguments: [
          txb.object(
            txb.object(
              "0x0552767a0f3c11d86ad0e8fa78e7115f0fa1414cbec50e73be7565caada005f1"
            )
          ),
          txb.object(
            "0x0000000000000000000000000000000000000000000000000000000000000006"
          ),
          txb.pure("issp"),
          txb.pure("5000"),
          l,
        ],
        typeArguments: [],
      });
      txb.transferObjects([f], txb.pure(this.#address));
      return await this.#provider.signAndExecuteTransactionBlock({
        signer: this.#keyPair,
        transactionBlock: txb,
      });
    } catch (error) {
      logger.warn(`${this.#address} mint error: ${error.message}`);
      return error;
    }
  }
}

export default worker;
