import assert = require("assert");
import * as anchor from '@coral-xyz/anchor';
import { Connection, clusterApiUrl } from '@solana/web3.js';
const { SystemProgram } = anchor.web3;

describe("root", () => {
  // 自定义 RPC URL
  // const rpcUrl = "http://13.215.160.229:8899";
  const rpcUrl = "https://api.devnet.solana.com ";

  // 创建一个新的连接对象
  const connection = new Connection(rpcUrl, 'confirmed'); // 'confirmed' 是网络确认的级别

  // 创建一个 AnchorProvider，使用自定义的连接和钱包
  const provider = new anchor.AnchorProvider(connection, anchor.Wallet.local(), { commitment: 'confirmed' });
  // const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);
  const counter = anchor.web3.Keypair.generate();
  const other = anchor.web3.Keypair.generate();
  const program = anchor.workspace.root;

  console.log(counter.publicKey);
  console.log("root",program.pubkey.toBytes())
  return
  const slotHeight = new anchor.BN(57088);
  const slotHeight2 = new anchor.BN(57098);
  const slotHeight3 = new anchor.BN(57010); // 示例槽高度
  const root1 = new Uint8Array([
    3, 162, 141, 85, 226, 129, 249, 4,
    190, 120, 69, 90, 2, 206, 250, 114,
    167, 172, 52, 253, 130, 75, 184, 95,
    154, 125, 45, 182, 166, 145, 156, 232
  ]); // 示例根1
  const root2 = new Uint8Array([
    3, 162, 141, 85, 226, 129, 249, 4,
    190, 120, 69, 90, 2, 206, 250, 114,
    167, 172, 52, 253, 130, 75, 184, 95,
    154, 125, 45, 182, 166, 145, 156, 232
  ]); // 示例根2

  const leafPda = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("roots"),
      slotHeight.toArrayLike(Buffer, 'le', 8),
    ],
    program.programId
  );
  const leafPda2 = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("roots"),
      slotHeight2.toArrayLike(Buffer, 'le', 8),
    ],
    program.programId
  ); const leafPda3 = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("roots"),
      slotHeight3.toArrayLike(Buffer, 'le', 8),
    ],
    program.programId
  );
  it("Init", async () => {
    await program.methods
      .initialize()
      .accounts({
        slotsAcc: counter.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([counter])
      .rpc();

    let counterAccount = await program.account.slotsAccount.fetch(counter.publicKey);
    assert.ok(counterAccount.authority.equals(provider.wallet.publicKey));
    assert.ok(counterAccount.initialized == true);
  });

  return
  it("Insert", async () => {



    // console.log(slotHeight, root1, root2)
    await program.methods
      .addRoots(slotHeight, root1, root2)
      .accounts({
        slotsAcc: counter.publicKey,
        authority: provider.wallet.publicKey,
        slotRootsAcc: leafPda[0]
      })
      .rpc();

    const counterAccount = await program.account.slotsAccount.fetch(counter.publicKey);
    assert.ok(counterAccount.slots.length === 1); // 验证数据是否存储
    assert.ok(counterAccount.slots[0].cmp(slotHeight) == 0);
  });

  it("Insert", async () => {



    // console.log(slotHeight, root1, root2)
    await program.methods
      .addRoots(slotHeight2, root1, root2)
      .accounts({
        slotsAcc: counter.publicKey,
        authority: provider.wallet.publicKey,
        slotRootsAcc: leafPda2[0]
      })
      .rpc();

    const counterAccount = await program.account.slotsAccount.fetch(counter.publicKey);
    assert.ok(counterAccount.slots.length === 2); // 验证数据是否存储
    // assert.ok(counterAccount.slots[0].cmp(n) == 0);
  });

  it("Insert", async () => {



    // console.log(slotHeight, root1, root2)
    await program.methods
      .addRoots(slotHeight3, root1, root2)
      .accounts({
        slotsAcc: counter.publicKey,
        authority: provider.wallet.publicKey,
        slotRootsAcc: leafPda3[0]
      })
      .rpc();

    const counterAccount = await program.account.slotsAccount.fetch(counter.publicKey);
    assert.ok(counterAccount.slots.length === 3); // 验证数据是否存储
    // assert.ok(counterAccount.slots[0].cmp(n) == 0);
  });


  console.log("root: ", program._programId.toString())
  console.log("slotsAcc: ", counter.publicKey.toString())
  console.log("admin: ", provider.wallet.publicKey.toString())

  // console.log("root: 数组", program._programId.toBytes())
});



function uint8ArrayToHex(arr: Uint8Array): string {
  return arr.reduce((acc, val) => acc + val.toString(16).padStart(2, '0'), '');
}
