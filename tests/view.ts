/*
 * @Descripttion: js
 * @Version: 1.0
 * @Author: Yulin
 * @Date: 2024-11-20 14:56:53
 * @LastEditors: Yulin
 * @LastEditTime: 2024-11-20 18:47:59
 */
import assert = require("assert");
import * as anchor from '@coral-xyz/anchor';

import { Connection, clusterApiUrl } from '@solana/web3.js';
const { SystemProgram } = anchor.web3;

describe("bridge", () => {
  // 自定义 RPC URL
  // const rpcUrl = "http://52.77.241.74:8899";
  // const rpcUrl = "http://127.0.0.1:8899";
  const rpcUrl = "https://solana-devnet.g.alchemy.com/v2/pw2wvRbDIcTAlOi73eibtHiCMG9UX3al";

  // 创建一个新的连接对象
  const connection = new Connection(rpcUrl, 'confirmed'); // 'confirmed' 是网络确认的级别

  // 创建一个 AnchorProvider，使用自定义的连接和钱包
  const provider = new anchor.AnchorProvider(connection, anchor.Wallet.local(), { commitment: 'confirmed' });

  // const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  const bridge = anchor.workspace.Bridge;

  const message = anchor.workspace.Message;

  const root = anchor.workspace.Root;

  it("test", async () => {
    const temp = await message.account.nonceStatus.fetch("4Wa9Qm19cjxP3cjoS8GNFY9zFQK6TWMLbmN6PDWZq3a7");
    console.log(temp.nonce.toNumber());

    // console.log(provider.publicKey.toBytes());
    // console.log(new anchor.BN(1000000).toArrayLike(Buffer, 'le', 8));


    // console.log("root",root.publicKey.toBytes())

  

    // const rootAcc = await root.account.slotsAccount.fetch("vcwMdMKYZtsp8BK1afURjMn53jcSzT8uGbTsacKCian");
    // console.log(rootAcc)

    // const temp = await root.account.slotRootsAccout.fetch("AtwjPdMH9Bp8DrpwBvfE5nfyGJecMn38KLUVAQzc7aPh");
    // console.log(temp)
  })

});