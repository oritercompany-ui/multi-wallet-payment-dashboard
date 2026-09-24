-- CreateEnum
CREATE TYPE "InvoiceAsset" AS ENUM ('ETH', 'ERC20');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('pending', 'paid', 'cancelled');

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" TEXT NOT NULL,
    "asset" "InvoiceAsset" NOT NULL,
    "tokenAddress" TEXT,
    "recipient" TEXT NOT NULL,
    "chainId" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "transactionHash" TEXT,
    "payer" TEXT,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
