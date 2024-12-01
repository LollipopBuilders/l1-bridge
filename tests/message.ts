import { assert } from "chai";
import * as anchor from "@coral-xyz/anchor";
const { SystemProgram } = anchor.web3;

describe("message", () => {

  const provider = anchor.AnchorProvider.local();
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  const program = anchor.workspace.Message;
  const root = anchor.workspace.Root;
  // 生成测试账户
  let nonceAccount = anchor.web3.Keypair.generate();
  let fixedAccount = anchor.web3.Keypair.generate();
  console.log("nonceAccount", nonceAccount.publicKey)
  console.log("fixedAccount", fixedAccount.publicKey)

  it("Init", async () => {
    await program.methods
      .initialize()
      .accounts({
        nonce: nonceAccount.publicKey,
        fixedAccount: fixedAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([nonceAccount, fixedAccount])
      .rpc();

    let noAcc = await program.account.nonceStatus.fetch(nonceAccount.publicKey);
    assert.ok(noAcc.nonce == 0);
  });


  it("stores cross chain info", async () => {
    let amount = new anchor.BN(123)
    let noAcc = await program.account.nonceStatus.fetch(nonceAccount.publicKey)

    const leafPda = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("nonce"),
        nonceAccount.publicKey.toBuffer(),
        noAcc.nonce.toArrayLike(Buffer, 'le', 8),
      ],
      program.programId
    );
    console.log("leaf pda: ", leafPda[0].toString());
    await program.methods
      .storeCrossChainInfo(amount, provider.wallet.publicKey)
      .accounts({
        info: leafPda[0],
        payer: provider.wallet.publicKey,
        nonceAccount: nonceAccount.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers(payer.payer)
      .rpc();

    let noAcc2 = await program.account.nonceStatus.fetch(nonceAccount.publicKey)
    assert.ok(noAcc2.nonce.toNumber() == noAcc.nonce.toNumber() + 1);

    let pda = await program.account.info.fetch(leafPda[0]);
    assert.ok(provider.wallet.publicKey.equals(pda.from));
    assert.ok(provider.wallet.publicKey.equals(pda.to));

    assert.ok(pda.nonce.eq(noAcc.nonce));
    assert.ok(amount.eq(pda.amount))
    // console.log(program._idl.types)
    // assert.ok(pda.messageType==program)
  });


  // it("Test", async () => {

  //   const slotHeight = new anchor.BN(1); // 示例槽高度
  //   const root1 = new Uint8Array(32).fill(1); // 示例根1
  //   const root2 = new Uint8Array(32).fill(2); // 示例根2

  //   const leafPda = anchor.web3.PublicKey.findProgramAddressSync(
  //     [
  //       Buffer.from("roots"),
  //       slotHeight.toArrayLike(Buffer, 'le', 8),
  //     ],
  //     root.programId
  //   );
  //   const re = await program.methods
  //     .test(slotHeight)
  //     .accounts({
  //       root: root.pubkey,
  //       slotRootsAcc: leafPda[0]
  //     })
  //     .signers([payer.payer])
  //     .rpc();

  //   console.log(re);
  // });

});