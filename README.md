# O-Pay — Multi Wallet Payment Dashboard

> A Web3 payment dashboard for managing wallets, blockchain transactions, payment requests, invoices, tokens, and payment links from a single interface.

## Overview

**O-Pay** is a Web3-focused payment dashboard designed to simplify blockchain payment management through a unified interface.

The application connects to a user's Web3 wallet and provides tools for managing wallet information, sending blockchain payments, tracking transactions, creating payment requests, managing invoices, and generating payment pages.

This project was built as a portfolio project to explore practical Web3 application development, wallet integration, blockchain transactions, and full-stack architecture.

---

## Features

### 🔐 Wallet Management

* Connect Web3 wallet through browser wallet provider
* Display connected wallet address
* Display wallet balance
* Store and manage multiple wallet profiles locally
* Select an active wallet
* Detect wallet account changes
* Detect network changes
* Disconnect wallet

### 💸 Payments

* Send native blockchain assets
* Enter recipient wallet address
* Specify payment amount
* Submit blockchain transactions directly from the connected wallet
* Display transaction status
* Track transaction hashes

### 🧾 Payment Requests

Create payment requests containing:

* Payment amount
* Recipient information
* Payment details
* Request status

### 📄 Invoices

O-Pay includes an invoice workflow for creating and managing payment invoices.

Invoices can be exposed through a dedicated payment page so customers can access a payment request without navigating through the main dashboard.

### 🔗 Payment Links

O-Pay supports payment URLs such as:

```text
/pay/:invoiceId
```

A customer can open the payment page directly using the invoice identifier.

The payment page is separated from the main dashboard flow, allowing customers to access payment information without first opening the dashboard.

### 🪙 Token Management

* View token information
* Display token balances
* Work with ERC-20 compatible token data

### 🌐 Network Management

* Display connected blockchain network
* Detect network changes
* Organize wallet information by network

### 📊 Transaction History

* Retrieve blockchain transaction history
* Display transaction information
* Save relevant transaction history locally
* Refresh transaction data

---

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* CSS
* ethers.js

### Backend

* Node.js
* TypeScript
* Express
* Prisma ORM

### Database

* PostgreSQL / Prisma-compatible database
* Prisma Migrations

### Blockchain

* Ethereum-compatible networks
* Web3 wallet provider
* Native asset transactions
* ERC-20 token interaction

---

## Architecture

```text
┌───────────────────────────────────────┐
│              O-Pay Frontend           │
│                                       │
│  React + TypeScript + Vite            │
│                                       │
│  ┌───────────┐   ┌─────────────────┐  │
│  │ Dashboard │   │ Wallet Manager  │  │
│  └───────────┘   └─────────────────┘  │
│                                       │
│  ┌───────────┐   ┌─────────────────┐  │
│  │ Payments  │   │ Invoice System  │  │
│  └───────────┘   └─────────────────┘  │
│                                       │
│  ┌───────────┐   ┌─────────────────┐  │
│  │ Tokens    │   │ Transaction     │  │
│  │ & Networks│   │ History         │  │
│  └───────────┘   └─────────────────┘  │
└───────────────────┬───────────────────┘
                    │
                    │ ethers.js
                    ▼
          ┌─────────────────────┐
          │   Web3 Wallet       │
          │   Provider          │
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │ Ethereum-Compatible  │
          │ Blockchain Network   │
          └─────────────────────┘

                    │
                    │ REST API
                    ▼
          ┌─────────────────────┐
          │ O-Pay Backend       │
          │                     │
          │ Node + Express      │
          │ Prisma              │
          └──────────┬──────────┘
                     │
                     ▼
                ┌──────────┐
                │ Database │
                └──────────┘
```

---

## Project Structure

```text
O-Pay/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   │
│   ├── src/
│   │   ├── config/
│   │   │   └── prisma.ts
│   │   │
│   │   ├── controllers/
│   │   │   └── InvoiceController.ts
│   │   │
│   │   ├── routes/
│   │   │   └── InvoiceRoutes.ts
│   │   │
│   │   └── server.ts
│   │
│   ├── .env.example
│   ├── package.json
│   ├── prisma.config.ts
│   └── tsconfig.json
│
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── TransactionList.tsx
│   │   └── WalletCard.tsx
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── History.tsx
│   │   ├── Invoices.tsx
│   │   ├── Networks.tsx
│   │   ├── PaymentRequest.tsx
│   │   ├── Paymentpage.tsx
│   │   ├── Payments.tsx
│   │   ├── Tokens.tsx
│   │   └── Wallets.tsx
│   │
│   ├── utils/
│   │   ├── ethereum.ts
│   │   ├── paymentRequests.ts
│   │   ├── tokens.ts
│   │   ├── transactionHistory.ts
│   │   ├── transactions.ts
│   │   └── transfers.ts
│   │
│   ├── App.tsx
│   ├── Main.tsx
│   └── index.css
│
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

---

## Getting Started

### Prerequisites

Make sure you have installed:

* Node.js
* npm
* Git
* A Web3 browser wallet such as MetaMask
* A compatible blockchain network
* A PostgreSQL-compatible database for the backend

---

## Installation

Clone the repository:

```bash
git clone https://github.com/oritercompany-ui/multi-wallet-payment-dashboard.git
cd multi-wallet-payment-dashboard
```

### Install frontend dependencies

```bash
npm install
```

### Install backend dependencies

```bash
cd backend
npm install
cd ..
```

---

## Environment Variables

Create:

```text
backend/.env
```

based on:

```text
backend/.env.example
```

Example:

```env
DATABASE_URL=
SEPOLIA_RPC_URL=
```

Do **not** commit your real `.env` file.

Private keys, seed phrases, RPC credentials, database credentials, and other secrets should never be stored directly in the source code.

---

## Run the Backend

From the project root:

```bash
cd backend
npm run dev
```

The backend will start using the configuration defined in the backend project.

---

## Run the Frontend

Open another terminal:

```bash
npm run dev
```

Then open the local Vite development URL shown in your terminal.

---

## Web3 Wallet Flow

The basic wallet interaction works through the browser wallet provider:

```text
User
  │
  ▼
Connect Wallet
  │
  ▼
Browser Wallet
  │
  ▼
Wallet Address + Network
  │
  ▼
O-Pay Dashboard
  │
  ├── Send Payment
  ├── View Balance
  ├── View Transactions
  ├── Manage Wallets
  └── Manage Payments
```

For transactions, the user confirms the transaction through their wallet provider.

O-Pay does not require the application to receive or store the user's private key.

---

## Security Considerations

This project is intended for educational and portfolio purposes.

Important security practices:

* Never expose private keys in frontend code.
* Never commit `.env` files.
* Never store seed phrases.
* Validate wallet addresses before submitting transactions.
* Always verify the connected network before performing blockchain operations.
* Treat transaction data received from external APIs as untrusted input.
* Users should verify transaction details in their wallet before signing.

---

## What I Learned

This project was built to gain practical experience with:

* Web3 wallet integration
* Ethereum-compatible blockchain interaction
* ethers.js
* Wallet address and balance handling
* Blockchain transactions
* Transaction history
* ERC-20 token concepts
* Payment request workflows
* Invoice-based payment flows
* Payment links
* React + TypeScript architecture
* REST API development
* Express
* Prisma ORM
* Database migrations
* Environment variable management
* Full-stack Web3 application architecture

---

## Future Improvements

Potential improvements for future versions include:

* Multi-chain support
* More ERC-20 token integrations
* Advanced transaction filtering
* Payment status synchronization
* WebSocket-based payment notifications
* Authentication and role-based access
* Merchant management
* Recurring payment support
* Production-grade transaction indexing
* On-chain payment verification
* Improved invoice lifecycle management

---

## Disclaimer

O-Pay is a portfolio and educational project.

Blockchain transactions are irreversible in many cases. Users should always verify wallet addresses, network selection, transaction amounts, and transaction details before signing.

---

## Author

Built as a Web3 full-stack portfolio project by **Oriter Company**.

### Project

**O-Pay — Multi Wallet Payment Dashboard**

Repository:

https://github.com/oritercompany-ui/multi-wallet-payment-dashboard
