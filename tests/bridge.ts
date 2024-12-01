import assert = require("assert");
import * as anchor from '@coral-xyz/anchor';

import { Connection, clusterApiUrl } from '@solana/web3.js';
const { SystemProgram } = anchor.web3;

describe("bridge", () => {
  // 自定义 RPC URL
  // const rpcUrl = "http://52.77.241.74:8899";
  // const rpcUrl = "http://127.0.0.1:8899";
  // // const rpcUrl = "https://api.devnet.solana.com";

  // // 创建一个新的连接对象
  // const connection = new Connection(rpcUrl, 'confirmed'); // 'confirmed' 是网络确认的级别

  // // 创建一个 AnchorProvider，使用自定义的连接和钱包
  // const provider = new anchor.AnchorProvider(connection, anchor.Wallet.local(), { commitment: 'confirmed' });

  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  const bridge = anchor.workspace.Bridge;

  const message = anchor.workspace.Message;
  const fixedAccount = anchor.web3.Keypair.generate();
  const amount = new anchor.BN(10000000); // 示例金额


  // 生成nonce账户
  let nonceAccount = anchor.web3.Keypair.generate();
  console.log("nonceAccount", nonceAccount.publicKey)
  console.log("message", message.programId)

  it("Init message", async () => {
    await message.methods
      .initialize()
      .accounts({
        nonce: nonceAccount.publicKey,
        fixedAccount: fixedAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([nonceAccount, fixedAccount])
      .rpc();

    let noAcc = await message.account.nonceStatus.fetch(nonceAccount.publicKey);
    assert.ok(noAcc.nonce == 0);
  });


  it("init bridge", async () => {
    await bridge.methods.initialize().accounts({
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    }).signers([payer.payer]).rpc();
  });

  it("deposit", async () => {

    let amount = new anchor.BN(100000000)
    let noAcc = await message.account.nonceStatus.fetch(nonceAccount.publicKey)
    console.log("message", message.programId)
    // 计算PDA地址
    const leafPda = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("nonce"),
        nonceAccount.publicKey.toBuffer(),
        noAcc.nonce.toArrayLike(Buffer, 'le', 8),
      ],
      message.programId
    );
    console.log("PDA", leafPda[0]);
    console.log("provider", provider.wallet.publicKey)
    console.log("fixedAccount", fixedAccount.publicKey)
    console.log("message", message.programId)
    console.log("nonceAccount", nonceAccount.publicKey)
    console.log("bridge", bridge.programId)

    await bridge.methods
      .deposit(amount)
      .accounts({
        user: provider.wallet.publicKey,
        fixedAccount: fixedAccount.publicKey,
        l1Message: message.programId,
        info: leafPda[0],
        systemProgram: SystemProgram.programId,
        nonceAccount: nonceAccount.publicKey,
      })
      .signers(payer.payer)
      .rpc();

    let noAcc2 = await message.account.nonceStatus.fetch(nonceAccount.publicKey)
    assert.ok(noAcc2.nonce.toNumber() == noAcc.nonce.toNumber() + 1);

    let pda = await message.account.info.fetch(leafPda[0]);
    assert.ok(provider.wallet.publicKey.equals(pda.from));
    assert.ok(provider.wallet.publicKey.equals(pda.to));
    console.log(pda);

    assert.ok(pda.nonce.eq(noAcc.nonce));
    assert.ok(amount.eq(pda.amount))
  });


  it("deposit two", async () => {

    let amount = new anchor.BN(1000000000)
    let noAcc = await message.account.nonceStatus.fetch(nonceAccount.publicKey)

    // 计算PDA地址
    const leafPda = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("nonce"),
        nonceAccount.publicKey.toBuffer(),
        noAcc.nonce.toArrayLike(Buffer, 'le', 8),
      ],
      message.programId
    );
    console.log("PDA", leafPda.toString());

    await bridge.methods
      .deposit(amount)
      .accounts({
        user: provider.wallet.publicKey,
        fixedAccount: fixedAccount.publicKey,
        l1Message: message.pubkey,
        info: leafPda[0],
        systemProgram: SystemProgram.programId,
        nonceAccount: nonceAccount.publicKey,
      })
      .signers(payer.payer)
      .rpc();

    let noAcc2 = await message.account.nonceStatus.fetch(nonceAccount.publicKey)
    assert.ok(noAcc2.nonce.toNumber() == noAcc.nonce.toNumber() + 1);

    let pda = await message.account.info.fetch(leafPda[0]);
    assert.ok(provider.wallet.publicKey.equals(pda.from));
    assert.ok(provider.wallet.publicKey.equals(pda.to));
    console.log(pda);

    assert.ok(pda.nonce.eq(noAcc.nonce));
    assert.ok(amount.eq(pda.amount))
  });
});
