/*
 * @Descripttion: js
 * @Version: 1.0
 * @Author: Yulin
 * @Date: 2024-10-23 19:47:06
 * @LastEditors: Yulin
 * @LastEditTime: 2024-11-18 15:29:33
 */
use anchor_lang::prelude::*;
use anchor_lang::system_program;

declare_id!("Dqm2bYqHFUBEK1FYu2PB5YbP4Y66E7RtY9rUnB6sCfeG");

declare_program!(message);
use message::accounts::NonceStatus;
use message::cpi::accounts::StoreCrossChainInfo;
use message::cpi::store_cross_chain_info;
use message::program::Message;

#[program]
mod bridge {

    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        // 检查用户的 SOL 是否足够
        let user_lamports = **ctx.accounts.user.try_borrow_lamports()?;
        if user_lamports < amount {
            return Err(ErrorCode::InsufficientFunds.into());
        }

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.fixed_account.to_account_info(),
                },
            ),
            amount,
        )?;

        let cpi_ctx = CpiContext::new(
            ctx.accounts.l1_message.to_account_info(),
            StoreCrossChainInfo {
                info: ctx.accounts.info.to_account_info(),
                payer: ctx.accounts.user.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
                nonce_account: ctx.accounts.nonce_account.to_account_info(),
            },
        );
        store_cross_chain_info(cpi_ctx, amount, ctx.accounts.user.key())?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK
    #[account(mut)]
    pub fixed_account: AccountInfo<'info>,
    pub l1_message: Program<'info, Message>,

    /// CHECK
    #[account(mut)]
    pub info: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
    #[account(mut)]
    pub nonce_account: AccountLoader<'info, NonceStatus>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient funds for this transaction.")]
    InsufficientFunds,
}
