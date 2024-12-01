import assert = require("assert");
import * as anchor from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { decode } from 'bs58';

const { SystemProgram } = anchor.web3;

// 定义与 Rust 端对应的 MessageType 枚举
enum MessageType {
  Native = 0,
  Token = 1,
  NFT = 2
}

describe("sub", () => {
  const rpcUrl = "https://api.devnet.solana.com";

  // 创建一个新的连接对象
  const connection = new Connection(rpcUrl, 'confirmed'); // 'confirmed' 是网络确认的级别

  // 创建一个 AnchorProvider，使用自定义的连接和钱包
  const provider = new anchor.AnchorProvider(connection, anchor.Wallet.local(), { commitment: 'confirmed' });
  anchor.setProvider(provider);
  const payer = provider.wallet as anchor.Wallet;

  // 使用指定的 programID
  const MESSAGE_PROGRAM_ID = new PublicKey("GFvvYUqbgRheG4K9MgGsnYGX7UWJNEVr5hgksXT1xeuk");
  
  // 正确创建 Program 实例
  const message = anchor.workspace.Message;

  // const fixedAccount = anchor.web3.Keypair.generate();
  const nonceAccount = anchor.web3.Keypair.generate();
  const slotRootsAccount = new PublicKey("AtwjPdMH9Bp8DrpwBvfE5nfyGJecMn38KLUVAQzc7aPh");
  const fixedStrr = "36qypJ8fv9Vbwju8jzjkei29vBz6mQjGtDuTLSQm5iiG"

  // it("transfer", async () => {
  //   try {
  //     // 方案一：使用 createAccountWithSeed
  //     const seed = "fixed_account";
  //     const derivedAddress = await PublicKey.createWithSeed(
  //       payer.publicKey,
  //       seed,
  //       SystemProgram.programId
  //     );

  //     const lamports = await provider.connection.getMinimumBalanceForRentExemption(0);
      
  //     const transaction = new anchor.web3.Transaction().add(
  //       SystemProgram.createAccountWithSeed({
  //         fromPubkey: payer.publicKey,
  //         basePubkey: payer.publicKey,
  //         seed: seed,
  //         newAccountPubkey: derivedAddress,
  //         lamports: lamports + 1000000000,
  //         space: 0,
  //         programId: SystemProgram.programId,
  //       })
  //     );

  //     // 发送交易并等待确认
  //     const signature = await provider.connection.sendTransaction(
  //       transaction,
  //       [payer.payer],
  //       {
  //         skipPreflight: true,
  //       }
  //     );
      
  //     // 轮询确认状态
  //     let confirmed = false;
  //     while (!confirmed) {
  //       const status = await provider.connection.getSignatureStatus(signature);
  //       if (status?.value?.confirmationStatus === 'confirmed') {
  //         confirmed = true;
  //       }
  //       await new Promise(resolve => setTimeout(resolve, 1000));
  //     }

  //     console.log("Transaction confirmed:", signature);
      
  //     // 更新 fixedAccount 为新创建的账户
  //     fixedAccount.publicKey = derivedAddress;
      
  //   } catch (error) {
  //     console.error("Error in transfer:", error);
  //     throw error;
  //   }
  // });

  it("Test prove_withdrawal_transaction", async () => {
      const amount = new anchor.BN(1000000000);
      const nonce = new anchor.BN(0);
      const slot = new anchor.BN(36377);
      const leafPda = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("used_hash"),
          provider.wallet.publicKey.toBuffer(),
          provider.wallet.publicKey.toBuffer(),
          amount.toArrayLike(Buffer, 'le', 8),
          nonce.toArrayLike(Buffer, 'le', 8),
          Buffer.from([MessageType.Native])
        ],
        MESSAGE_PROGRAM_ID
      );
      console.log(leafPda)
      await message.methods
        .proveWithdrawalTransaction(
          provider.wallet.publicKey,
          provider.wallet.publicKey,
          amount,
          nonce,
          { native: {} },
          slot,
          Buffer.from("267eb6417527e490a0135639e97f71e2b59b03b123d94126dec4d704bbeafd33", 'hex'),
          new anchor.BN(0)
        )
        .accounts({
          user: provider.wallet.publicKey,
          fixedAccount: fixedStrr,
          recipient: provider.wallet.publicKey,
          usedHash: leafPda[0],
          slotRootsAcc: slotRootsAccount,
          systemProgram: SystemProgram.programId,
        })
        .signers([payer.payer])
        .rpc();
    }
  );
});