const nacl = require("tweetnacl");

const {
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Message,
  PublicKey,
  Connection,
} = require("@solana/web3.js");
const bs58 = require("bs58");
const { Buffer } = require("buffer");

const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

const saveToFile = (filePath, content) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "", "utf8");
  }
  fs.appendFileSync(filePath, content, "utf8");
};

const saveSuccessfulAddress = (mintedAddress) => {
  const filePath = "successfulAddress.txt";
  const content = `${mintedAddress}\n`;
  saveToFile(filePath, content);
};

const parseFile = (fileName) =>
  fs
    .readFileSync(fileName, "utf8")
    .split("\n")
    .map((str) => str.trim())
    .filter((str) => str.length > 10);

function isNullOrUndefinedOrEmpty(value) {
  return value === null || value === undefined || value === "";
}

const toBuffer = (arr) => {
  if (Buffer.isBuffer(arr)) {
    return arr;
  } else if (arr instanceof Uint8Array) {
    return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  } else {
    return Buffer.from(arr);
  }
};

function sol_transfer(
  recentBlockhash,
  fromPrivateKey,
  toPubkeyAndAmount,
  to_amount
) {
  const fromKeypair = Keypair.fromSecretKey(bs58.decode(fromPrivateKey));
  let toPubkeyAndAmountArray = toPubkeyAndAmount;
  let txArray = [];
  let batches = Math.ceil(toPubkeyAndAmountArray.length / 20);
  for (let i = 0; i < batches; i++) {
    let tx = new Transaction();
    tx.recentBlockhash = recentBlockhash;
    tx.feePayer = fromKeypair.publicKey;
    let sum = 0;
    while (sum < 20) {
      if (toPubkeyAndAmountArray.length == 0) {
        break;
      }
      let _toPubkeyAndAmount = toPubkeyAndAmountArray.shift();
      let toPubkey;
      try {
        toPubkey = new PublicKey(_toPubkeyAndAmount.split("----")[0]);
      } catch (error) {
        console.log(
          `${_toPubkeyAndAmount} 地址 遇到错误，跳过。错误原因: ${error}`
        );
        continue;
      }
      let amount = 0;

      amount = Number(_toPubkeyAndAmount.split("----")[1]);
      if (isNaN(amount)) {
        amount = Number(to_amount);
      }

      if (isNaN(amount) || amount == 0) {
        console.log(`${_toPubkeyAndAmount} 转账金额 遇到错误，跳过。`);
        continue;
      }
      tx.add(
        SystemProgram.transfer({
          fromPubkey: fromKeypair.publicKey,
          toPubkey: new PublicKey(toPubkey),
          lamports: amount * LAMPORTS_PER_SOL,
        })
      );
      sum++;
    }
    let encodedTransaction = getEncodedTransaction(fromKeypair, tx);
    txArray.push(encodedTransaction);
  }
  return txArray;
}

function getEncodedTransaction(fromKeypair, tx) {
  let realDataNeedToSign = tx.serializeMessage();
  let signature = nacl.sign.detached(realDataNeedToSign, fromKeypair.secretKey);
  let recoverTx = Transaction.populate(Message.from(realDataNeedToSign));
  recoverTx.addSignature(fromKeypair.publicKey, Buffer.from(signature));
  let rawTransaction = recoverTx.serialize();
  const encodedTransaction = toBuffer(rawTransaction).toString("base64");
  return encodedTransaction;
}

async function main() {
  const connection = new Connection(
    "https://solana-mainnet.phantom.app/YBPpkkN4g91xDiAnTE9r0RcMkjg0sKUIWvAfoFVJ",
    "confirmed"
  );

  let recentBlockhash = await connection.getLatestBlockhash();

  let txArray = sol_transfer(
    recentBlockhash.blockhash,
    fromPrivateKey,
    addresses,
    amount_to_receiver
  );
  console.log(`生成 ${txArray.length} 个交易`);

  for (let i = 0; i < txArray.length; i++) {
    let encodedTransaction = txArray[i];
    console.log(`发送第 ${i + 1} 个交易`);
    let signature = await connection.sendEncodedTransaction(
      encodedTransaction,
      {
        skipPreflight: true,
        preflightCommitment: "confirmed",
      }
    );
    console.log(`第 ${i + 1} 个交易发送成功，hash: ${signature}`);
    await sleep(500);
  }
}

const fromPrivateKey = process.env.privateKey;
const amount_to_receiver = process.env.amount;
let addresses = parseFile("myAddress.txt");
console.log(`加载 ${addresses.length} 个钱包`);
main();
