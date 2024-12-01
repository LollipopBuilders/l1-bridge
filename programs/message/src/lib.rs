#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use dd_merkle_tree::{HashingAlgorithm, MerkleProof};
use serde::{Deserialize, Serialize};

declare_id!("62StCRGCjwWqhXzrUhjtv7gDjy6ePjFCMBH72Ket49w8");

const ROOT_PUBKEY: Pubkey = Pubkey::new_from_array([
    224, 151, 61, 152, 6, 187, 151, 151, 156, 30, 82, 50, 66, 35, 199, 194, 232, 226, 4, 234, 89,
    200, 123, 56, 88, 70, 45, 89, 53, 164, 3, 153,
]);
const ADMIN: Pubkey = Pubkey::new_from_array([
    26, 207, 79, 170, 49, 31, 88, 249, 165, 205, 98, 53, 114, 10, 2, 38, 153, 148, 183, 131,
    181, 212, 140, 42, 23, 181, 17, 245, 81, 111, 39, 206,
]);

declare_program!(root);
use root::accounts::SlotRootsAccout;

#[program]
mod message {

    use super::*;

    pub fn initialize(_ctx: Context<InitializeMessage>) -> Result<()> {
        Ok(())
    }

    pub fn store_cross_chain_info(ctx: Context<Store>, amount: u64, user: Pubkey) -> Result<()> {
        let nonce_status = &mut ctx.accounts.nonce_account.load_mut()?;
        let info = &mut ctx.accounts.info;
        info.from = user;
        info.to = user;
        info.amount = amount;
        info.nonce = nonce_status.nonce;
        info.message_type = MessageType::Native;

        nonce_status.nonce += 1;
        Ok(())
    }

    pub fn prove_withdrawal_transaction(
        ctx: Context<Prove>,
        from: Pubkey,
        to: Pubkey,
        amount: u64,
        nonce: u64,
        message_type: MessageType,
        slot: u64,
        proof: Vec<u8>,
        proof_index: u64,
    ) -> Result<()> {
        let info = Box::new(Info::new(from, to, amount, nonce, message_type));
        let hash_result = info.double_hash();

        require!(!ctx.accounts.used_hash.used, ErrorCode::HashAlreadyUsed);

        require!(
            slot == ctx.accounts.slot_roots_acc.slot,
            ErrorCode::SlotInconsistency
        );
        let root = ctx.accounts.slot_roots_acc.merkle_tree_root;

        let proof = Box::new(MerkleProof::new(
            HashingAlgorithm::Sha256d,
            32,
            proof_index.try_into()?,
            proof,
        ));

        let proof_root = proof.merklize_hash(&hash_result).unwrap();
        require!(proof_root == root, ErrorCode::ProofVerifyFailed);

        let used_hash = &mut ctx.accounts.used_hash;
        used_hash.hash.copy_from_slice(&hash_result);
        used_hash.used = true;

        **ctx.accounts.fixed_account.try_borrow_mut_lamports()? -= amount;
        **ctx.accounts.recipient.try_borrow_mut_lamports()? += amount;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(from: Pubkey, to: Pubkey, amount: u64, nonce: u64, message_type: MessageType)]
pub struct Prove<'info> {
    #[account(constraint = slot_roots_acc.to_account_info().owner == &ROOT_PUBKEY)]
    pub slot_roots_acc: Box<Account<'info, SlotRootsAccout>>,
    /// CHECK
    #[account(mut,owner=id())]
    pub fixed_account: AccountInfo<'info>,
    /// CHECK: 接收方账户
    #[account(mut)]
    pub recipient: AccountInfo<'info>,

    #[account(
        init_if_needed,
        payer = recipient,
        space = 8 + UsedHash::INIT_SPACE,
        seeds = [
            b"used_hash", 
            from.as_ref(),
            to.as_ref(),
            amount.to_le_bytes().as_ref(),
            nonce.to_le_bytes().as_ref(),
            &[message_type as u8]
        ],
        bump
    )]
    pub used_hash: Account<'info, UsedHash>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeMessage<'info> {
    #[account(init,payer = user, space = 8+NonceStatus::INIT_SPACE)]
    pub nonce: AccountLoader<'info, NonceStatus>,
    #[account(init, payer = user, space = 8 + 64)]
    pub fixed_account: Account<'info, FixedAccount>,
    #[account(mut,constraint = user.key() == ADMIN)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Store<'info> {
    #[account(
        init_if_needed,
        payer = payer,
        seeds = [b"nonce",nonce_account.key().as_ref(),&nonce_account.load_mut()?.nonce.to_le_bytes()],
        bump,
        space = 8+Info::INIT_SPACE,
    )]
    pub info: Account<'info, Info>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub nonce_account: AccountLoader<'info, NonceStatus>,
}

#[account]
#[derive(InitSpace)]
pub struct Info {
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub nonce: u64,
    pub message_type: MessageType,
}

impl Info {
    pub fn new(
        from: Pubkey,
        to: Pubkey,
        amount: u64,
        nonce: u64,
        message_type: MessageType,
    ) -> Self {
        Self {
            from,
            to,
            amount,
            nonce,
            message_type,
        }
    }
    fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::new();
        bytes.extend_from_slice(&self.from.to_bytes());
        bytes.extend_from_slice(&self.to.to_bytes());
        bytes.extend_from_slice(&self.amount.to_le_bytes());
        bytes.extend_from_slice(&self.nonce.to_le_bytes());
        bytes.extend_from_slice(&self.message_type.to_bytes());
        bytes
    }

    pub fn double_hash(&self) -> Vec<u8> {
        HashingAlgorithm::Sha256d.double_hash(&self.to_bytes(), 32 as usize)
    }

    pub fn double_hash_array(&self) -> [u8; 32] {
        let m = self.double_hash();
        assert!(m.len() == 32);
        let mut array = [0u8; 32];
        array.copy_from_slice(&m);
        array
    }
}

#[account(zero_copy(unsafe))]
#[repr(C)]
#[derive(InitSpace)]
pub struct NonceStatus {
    pub nonce: u64,
}

#[account]
pub struct FixedAccount {
    pub lamports: u64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Slot inconsistency")]
    SlotInconsistency,
    #[msg("Proof verify failed")]
    ProofVerifyFailed,
    #[msg("Hash has already been used")]
    HashAlreadyUsed,
}

#[derive(
    AnchorSerialize,
    AnchorDeserialize,
    Clone,
    Copy,
    Debug,
    PartialEq,
    Serialize,
    Deserialize,
    InitSpace,
)]
pub enum MessageType {
    Native,
    Token,
    NFT,
}

impl MessageType {
    pub fn to_bytes(&self) -> Vec<u8> {
        bincode::serialize(self).unwrap()
    }

    pub fn from_bytes(bytes: &[u8]) -> Self {
        bincode::deserialize(bytes).unwrap()
    }
}

#[account]
#[derive(InitSpace)]
pub struct UsedHash {
    pub hash: [u8; 32],
    pub used: bool,
}
