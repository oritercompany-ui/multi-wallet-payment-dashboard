import { Request, Response } from "express";
import {
  JsonRpcProvider,
  parseEther,
} from "ethers";

import prisma from "../config/prisma.js";

export async function createInvoice(
  req: Request,
  res: Response
) {
  try {
    const {
      title,
      description,
      amount,
      asset,
      tokenAddress,
      recipient,
      chainId,
      createdBy,
    } = req.body;

    if (
      !title ||
      !amount ||
      !asset ||
      !recipient ||
      !chainId ||
      !createdBy
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Field invoice wajib diisi.",
      });
    }

    if (
      asset !== "ETH" &&
      asset !== "ERC20"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Asset invoice tidak valid.",
      });
    }

    if (
      asset === "ERC20" &&
      !tokenAddress
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Token address wajib diisi untuk ERC20.",
      });
    }

    const invoiceNumber =
      `OP-${Date.now()
        .toString()
        .slice(-6)}-${Math.floor(
        Math.random() * 1000
      )
        .toString()
        .padStart(3, "0")}`;

    const invoice =
      await prisma.invoice.create({
        data: {
          invoiceNumber,

          title: title.trim(),

          description:
            description?.trim() || null,

          amount: amount.trim(),

          asset,

          tokenAddress:
            asset === "ERC20"
              ? tokenAddress.trim()
              : null,

          recipient:
            recipient.trim(),

          chainId:
            chainId.trim(),

          status: "pending",

          createdBy:
            createdBy.trim(),
        },
      });

    return res.status(201).json({
      success: true,
      message:
        "Invoice berhasil dibuat.",
      invoice,
    });
  } catch (error) {
    console.error(
      "CREATE INVOICE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Gagal membuat invoice.",
    });
  }
}

export async function getInvoices(
  req: Request,
  res: Response
) {
  try {
    const {
      createdBy,
    } = req.query;

    const invoices =
      await prisma.invoice.findMany({
        where: createdBy
          ? {
              createdBy:
                String(createdBy),
            }
          : undefined,

        orderBy: {
          createdAt: "desc",
        },
      });

    return res.json({
      success: true,
      invoices,
    });
  } catch (error) {
    console.error(
      "GET INVOICES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Gagal mengambil invoice.",
    });
  }
}

export async function getInvoiceById(
  req: Request,
  res: Response
) {
  try {
    const id =
      typeof req.params.id === "string"
        ? req.params.id
        : undefined;

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Invoice ID wajib diisi.",
      });
    }

    const invoice =
      await prisma.invoice.findUnique({
        where: {
          id,
        },
      });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message:
          "Invoice tidak ditemukan.",
      });
    }

    return res.json({
      success: true,
      invoice,
    });
  } catch (error) {
    console.error(
      "GET INVOICE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Gagal mengambil invoice.",
    });
  }
}

export async function updateInvoice(
  req: Request,
  res: Response
) {
  try {
    const id =
      typeof req.params.id === "string"
        ? req.params.id
        : undefined;

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Invoice ID wajib diisi.",
      });
    }

    const {
      status,
      transactionHash,
    } = req.body;

    const existingInvoice =
      await prisma.invoice.findUnique({
        where: {
          id,
        },
      });

    if (!existingInvoice) {
      return res.status(404).json({
        success: false,
        message:
          "Invoice tidak ditemukan.",
      });
    }

    /*
     * Proteksi double payment
     */
    if (existingInvoice.status === "paid") {
      if (
        transactionHash &&
        existingInvoice.transactionHash ===
          transactionHash
      ) {
        return res.json({
          success: true,
          message:
            "Invoice sudah dibayar dengan transaction hash ini.",
          invoice: existingInvoice,
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "Invoice ini sudah dibayar.",
      });
    }

    /*
     * Server-side payment verification
     */
    if (status === "paid") {
      if (!transactionHash) {
        return res.status(400).json({
          success: false,
          message:
            "Transaction hash wajib diisi.",
        });
      }

      /*
       * Proteksi transaction hash reuse
       */
      const usedTransaction =
        await prisma.invoice.findFirst({
          where: {
            transactionHash,
            NOT: {
              id,
            },
          },
        });

      if (usedTransaction) {
        return res.status(409).json({
          success: false,
          message:
            "Transaction hash sudah digunakan pada invoice lain.",
        });
      }

      if (
        existingInvoice.asset !==
        "ETH"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Server verification saat ini hanya mendukung ETH.",
        });
      }

      if (
        existingInvoice.chainId !==
        "11155111"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invoice harus menggunakan Ethereum Sepolia.",
        });
      }

      const rpcUrl =
        process.env.SEPOLIA_RPC_URL;

      if (!rpcUrl) {
        return res.status(500).json({
          success: false,
          message:
            "SEPOLIA_RPC_URL belum dikonfigurasi.",
        });
      }

      const provider =
        new JsonRpcProvider(
          rpcUrl
        );

      const network =
        await provider.getNetwork();

      if (
        network.chainId.toString() !==
        "11155111"
      ) {
        return res.status(500).json({
          success: false,
          message:
            "RPC bukan Ethereum Sepolia.",
        });
      }

      const transaction =
        await provider.getTransaction(
          transactionHash
        );

      if (!transaction) {
        return res.status(400).json({
          success: false,
          message:
            "Transaksi tidak ditemukan di blockchain.",
        });
      }

      const receipt =
        await provider.getTransactionReceipt(
          transactionHash
        );

      if (!receipt) {
        return res.status(400).json({
          success: false,
          message:
            "Transaction receipt belum tersedia.",
        });
      }

      if (receipt.status !== 1) {
        return res.status(400).json({
          success: false,
          message:
            "Transaksi gagal di blockchain.",
        });
      }

      /*
       * Pastikan recipient sesuai invoice
       */
      if (
        !transaction.to ||
        transaction.to.toLowerCase() !==
          existingInvoice.recipient.toLowerCase()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Recipient transaksi tidak sesuai dengan invoice.",
        });
      }

      /*
       * Pastikan amount sesuai invoice
       */
      let expectedAmount;

      try {
        expectedAmount =
          parseEther(
            existingInvoice.amount
          );
      } catch {
        return res.status(400).json({
          success: false,
          message:
            "Amount invoice tidak valid.",
        });
      }

      if (
        transaction.value !==
        expectedAmount
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Jumlah ETH transaksi tidak sesuai dengan invoice.",
        });
      }

      /*
       * Simpan hasil payment
       * berdasarkan data blockchain.
       */
      const invoice =
        await prisma.invoice.update({
          where: {
            id,
          },

          data: {
            status: "paid",

            paidAt: new Date(),

            transactionHash,

            payer:
              transaction.from,
          },
        });

      return res.json({
        success: true,
        message:
          "Payment berhasil diverifikasi oleh server dan invoice diperbarui.",
        invoice,
      });
    }

    /*
     * Status selain paid
     */
    if (
      status &&
      status !== "pending" &&
      status !== "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status invoice tidak valid.",
      });
    }

    const invoice =
      await prisma.invoice.update({
        where: {
          id,
        },

        data: {
          ...(status
            ? {
                status,
              }
            : {}),

          ...(transactionHash
            ? {
                transactionHash,
              }
            : {}),
        },
      });

    return res.json({
      success: true,
      message:
        "Invoice berhasil diperbarui.",
      invoice,
    });
  } catch (error) {
    console.error(
      "UPDATE INVOICE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Gagal memperbarui invoice.",
    });
  }
}