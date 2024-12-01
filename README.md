# Solana Bridge Project

A cross-chain bridge implementation on Solana blockchain, enabling asset transfers between different chains.

## Overview

This project implements a bridge system with three main components:

1. **Bridge Program** (`programs/bridge/`):
   - Handles deposit operations
   - Manages cross-chain transfers
   - Interacts with Message program for state management

2. **Message Program**:
   - Manages nonce accounts
   - Stores cross-chain transaction information
   - Handles withdrawal proofs

3. **Root Program**:
   - Manages slot roots
   - Verifies transaction proofs
   - Maintains slot height information

## Program IDs

- Bridge: `Dqm2bYqHFUBEK1FYu2PB5YbP4Y66E7RtY9rUnB6sCfeG`
- Message: `GFvvYUqbgRheG4K9MgGsnYGX7UWJNEVr5hgksXT1xeuk`
- Root: `AtwjPdMH9Bp8DrpwBvfE5nfyGJecMn38KLUVAQzc7aPh`

## Prerequisites

- Solana Tool Suite
- Anchor Framework (0.28.0 or later)
- Node.js
- Rust

## Installation

```bash
# Install dependencies
yarn install
# Build the program
anchor build
#Deploy to devnet
anchor deploy
```
