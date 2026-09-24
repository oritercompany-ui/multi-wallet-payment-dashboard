import { useEffect, useState } from "react";

import {
  getTransactionHistory,
  type TransactionHistoryItem,
} from "../utils/transactionHistory";

interface HistoryProps {
  walletAddress: string;
  chainId: string;
}

interface BackendInvoice {
  id: string;
  invoiceNumber: string;
  amount: string;
  asset: "ETH" | "ERC20";
  tokenAddress?: string | null;
  recipient: string;
  chainId: string;
  status: "pending" | "paid" | "cancelled";
  paidAt?: string | null;
  transactionHash?: string | null;
  payer?: string | null;
  createdAt: string;
}

interface HistoryItem {
  hash: string;
  timestamp: number;
  amount: string;
  asset: string;
  recipient: string;
  status: string;
  type: "ETH" | "ERC20";
  payer?: string;
  invoiceNumber?: string;
}

const API_BASE_URL =
  "http://localhost:5000";

function History({
  walletAddress,
  chainId,
}: HistoryProps) {
  const [transactions, setTransactions] =
    useState<HistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, [walletAddress, chainId]);

  async function loadHistory() {
    const history =
      getTransactionHistory(
        walletAddress
      );

    const walletTransactions: HistoryItem[] =
      history
        .filter(
          (item) =>
            item.chainId === chainId
        )
        .map(
          (
            item: TransactionHistoryItem
          ) => ({
            hash: item.hash,
            timestamp:
              item.timestamp,
            amount: item.amount,
            asset: item.asset,
            recipient:
              item.recipient,
            status: item.status,
            type: item.type,
          })
        );

    let paidInvoices: HistoryItem[] =
      [];

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/invoices?createdBy=${encodeURIComponent(
            walletAddress
          )}`
        );

      const data =
        await response.json();

      if (
        response.ok &&
        data?.invoices
      ) {
        const invoices: BackendInvoice[] =
          data.invoices;

        paidInvoices =
          invoices
            .filter(
              (invoice) =>
                invoice.status ===
                  "paid" &&
                invoice.chainId ===
                  chainId &&
                !!invoice.transactionHash
            )
            .map(
              (invoice) => ({
                hash:
                  invoice.transactionHash!,
                timestamp:
                  invoice.paidAt
                    ? new Date(
                        invoice.paidAt
                      ).getTime()
                    : new Date(
                        invoice.createdAt
                      ).getTime(),
                amount:
                  invoice.amount,
                asset:
                  invoice.asset,
                recipient:
                  invoice.recipient,
                status:
                  "verified",
                type:
                  invoice.asset ===
                  "ETH"
                    ? "ETH"
                    : "ERC20",
                payer:
                  invoice.payer ??
                  undefined,
                invoiceNumber:
                  invoice.invoiceNumber,
              })
            );
      }
    } catch (error) {
      console.error(
        "GET PAYMENT HISTORY ERROR:",
        error
      );
    }

    const existingHashes =
      new Set(
        walletTransactions.map(
          (transaction) =>
            transaction.hash.toLowerCase()
        )
      );

    const uniquePaidInvoices =
      paidInvoices.filter(
        (invoice) =>
          !existingHashes.has(
            invoice.hash.toLowerCase()
          )
      );

    const combined = [
      ...walletTransactions,
      ...uniquePaidInvoices,
    ].sort(
      (a, b) =>
        b.timestamp - a.timestamp
    );

    setTransactions(combined);
  }

  function shortenHash(hash: string) {
    return `${hash.slice(
      0,
      8
    )}...${hash.slice(-6)}`;
  }

  function shortenAddress(
    address: string
  ) {
    return `${address.slice(
      0,
      6
    )}...${address.slice(-4)}`;
  }

  function getExplorerUrl(
    hash: string
  ) {
    if (chainId === "11155111") {
      return `https://sepolia.etherscan.io/tx/${hash}`;
    }

    if (chainId === "1") {
      return `https://etherscan.io/tx/${hash}`;
    }

    if (chainId === "137") {
      return `https://polygonscan.com/tx/${hash}`;
    }

    if (chainId === "8453") {
      return `https://basescan.org/tx/${hash}`;
    }

    if (chainId === "42161") {
      return `https://arbiscan.io/tx/${hash}`;
    }

    return "#";
  }

  return (
    <section style={styles.section}>
      {/* Header */}

      <div style={styles.sectionHeader}>
        <div>
          <div style={styles.eyebrow}>
            TRANSACTION CENTER
          </div>

          <div style={styles.titleRow}>
            <h2 style={styles.sectionTitle}>
              Payment History
            </h2>

            <span style={styles.liveBadge}>
              <span
                style={styles.liveDot}
              />
              VERIFIED
            </span>
          </div>

          <p style={styles.subtitle}>
            Wallet transfers and verified
            invoice payments recorded on-chain.
          </p>
        </div>

        <div style={styles.networkBadge}>
          <span style={styles.networkDot} />

          <div>
            <span
              style={
                styles.networkLabel
              }
            >
              ACTIVE NETWORK
            </span>

            <strong
              style={
                styles.networkValue
              }
            >
              {chainId ===
              "11155111"
                ? "Sepolia"
                : `Chain ${chainId}`}
            </strong>
          </div>
        </div>
      </div>

      {/* Empty State */}

      {transactions.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>
            ↔
          </div>

          <h3 style={styles.emptyTitle}>
            No transaction activity
          </h3>

          <p style={styles.emptyText}>
            Wallet transfers and verified
            payment invoices will appear
            here once activity is recorded.
          </p>
        </div>
      ) : (
        /* Transaction Grid */

        <div style={styles.grid}>
          {transactions.map(
            (transaction) => (
              <div
                style={styles.card}
                key={`${transaction.hash}-${transaction.timestamp}`}
              >
                {/* Card Header */}

                <div
                  style={
                    styles.cardTop
                  }
                >
                  <div
                    style={
                      styles.cardIdentity
                    }
                  >
                    <div
                      style={
                        transaction.invoiceNumber
                          ? styles.iconInvoice
                          : transaction.type ===
                            "ETH"
                          ? styles.iconEth
                          : styles.iconToken
                      }
                    >
                      {transaction.invoiceNumber
                        ? "▤"
                        : transaction.type ===
                          "ETH"
                        ? "Ξ"
                        : "◆"}
                    </div>

                    <div>
                      <strong
                        style={
                          styles.cardTitle
                        }
                      >
                        {transaction.invoiceNumber
                          ? "Invoice Payment"
                          : transaction.type ===
                            "ETH"
                          ? "ETH Transfer"
                          : "ERC-20 Transfer"}
                      </strong>

                      <div
                        style={
                          styles.cardName
                        }
                      >
                        {transaction.invoiceNumber ??
                          transaction.asset}
                      </div>
                    </div>
                  </div>

                  <span
                    style={
                      transaction.status ===
                      "verified"
                        ? styles.verifiedBadge
                        : styles.statusBadge
                    }
                  >
                    {transaction.status ===
                    "verified"
                      ? "VERIFIED"
                      : transaction.status}
                  </span>
                </div>

                {/* Amount */}

                <div
                  style={
                    styles.amountBlock
                  }
                >
                  <span
                    style={
                      styles.amountLabel
                    }
                  >
                    PAYMENT AMOUNT
                  </span>

                  <div
                    style={
                      styles.amount
                    }
                  >
                    {transaction.amount}

                    <span
                      style={
                        styles.amountAsset
                      }
                    >
                      {transaction.asset}
                    </span>
                  </div>
                </div>

                {/* Metadata */}

                <div
                  style={
                    styles.metadata
                  }
                >
                  {transaction.invoiceNumber && (
                    <div
                      style={
                        styles.metaRow
                      }
                    >
                      <span
                        style={
                          styles.metaLabel
                        }
                      >
                        Invoice
                      </span>

                      <span
                        style={
                          styles.metaValue
                        }
                      >
                        {
                          transaction.invoiceNumber
                        }
                      </span>
                    </div>
                  )}

                  {transaction.payer && (
                    <div
                      style={
                        styles.metaRow
                      }
                    >
                      <span
                        style={
                          styles.metaLabel
                        }
                      >
                        Payer
                      </span>

                      <span
                        style={
                          styles.metaMono
                        }
                      >
                        {shortenAddress(
                          transaction.payer
                        )}
                      </span>
                    </div>
                  )}

                  <div
                    style={
                      styles.metaRow
                    }
                  >
                    <span
                      style={
                        styles.metaLabel
                      }
                    >
                      Recipient
                    </span>

                    <span
                      style={
                        styles.metaMono
                      }
                    >
                      {shortenAddress(
                        transaction.recipient
                      )}
                    </span>
                  </div>

                  <div
                    style={
                      styles.metaRow
                    }
                  >
                    <span
                      style={
                        styles.metaLabel
                      }
                    >
                      Transaction
                    </span>

                    <span
                      style={
                        styles.metaMono
                      }
                    >
                      {shortenHash(
                        transaction.hash
                      )}
                    </span>
                  </div>

                  <div
                    style={
                      styles.metaRow
                    }
                  >
                    <span
                      style={
                        styles.metaLabel
                      }
                    >
                      Timestamp
                    </span>

                    <span
                      style={
                        styles.metaValue
                      }
                    >
                      {new Date(
                        transaction.timestamp
                      ).toLocaleString(
                        "en-US",
                        {
                          dateStyle:
                            "medium",
                          timeStyle:
                            "short",
                        }
                      )}
                    </span>
                  </div>
                </div>

                {/* Explorer */}

                <div
                  style={
                    styles.actions
                  }
                >
                  <a
                    href={getExplorerUrl(
                      transaction.hash
                    )}
                    target="_blank"
                    rel="noreferrer"
                    style={
                      styles.explorerButton
                    }
                  >
                    View on Explorer

                    <span
                      style={
                        styles.explorerArrow
                      }
                    >
                      ↗
                    </span>
                  </a>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  /* ===============================
     SECTION
  =============================== */

  section: {
    width: "100%",
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "24px",
  },

  eyebrow: {
    marginBottom: "7px",
    color: "#415a70",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "1.6px",
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  sectionTitle: {
    margin: 0,
    color: "#edf5fa",
    fontSize: "25px",
    fontWeight: 800,
    letterSpacing: "-0.8px",
  },

  subtitle: {
    margin:
      "8px 0 0",
    color: "#60778b",
    fontSize: "10px",
    lineHeight: 1.6,
  },

  /* ===============================
     VERIFIED
  =============================== */

  liveBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding:
      "4px 7px",
    border:
      "1px solid rgba(77,182,165,0.18)",
    borderRadius: "5px",
    background:
      "rgba(77,182,165,0.05)",
    color: "#66c9b9",
    fontSize: "6px",
    fontWeight: 900,
    letterSpacing: "0.8px",
  },

  liveDot: {
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    background: "#55d5c3",
    boxShadow:
      "0 0 7px rgba(85,213,195,0.8)",
  },

  /* ===============================
     NETWORK
  =============================== */

  networkBadge: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    minWidth: "125px",
    padding:
      "9px 11px",
    border:
      "1px solid rgba(70,96,119,0.17)",
    borderRadius: "9px",
    background:
      "linear-gradient(145deg, rgba(12,28,42,0.9), rgba(7,18,28,0.95))",
  },

  networkDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#55d5c3",
    boxShadow:
      "0 0 8px rgba(85,213,195,0.8)",
  },

  networkLabel: {
    display: "block",
    marginBottom: "2px",
    color: "#40586c",
    fontSize: "6px",
    fontWeight: 900,
    letterSpacing: "0.8px",
  },

  networkValue: {
    display: "block",
    color: "#9cb1c1",
    fontSize: "9px",
    fontWeight: 700,
  },

  /* ===============================
     EMPTY
  =============================== */

  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "300px",
    padding:
      "40px 20px",
    border:
      "1px dashed rgba(70,96,119,0.25)",
    borderRadius: "13px",
    background:
      "rgba(7,18,29,0.48)",
    textAlign: "center",
  },

  emptyIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "52px",
    height: "52px",
    marginBottom: "15px",
    border:
      "1px solid rgba(0,210,255,0.17)",
    borderRadius: "15px",
    background:
      "rgba(0,210,255,0.04)",
    color: "#00d2ff",
    fontSize: "23px",
  },

  emptyTitle: {
    margin: 0,
    color: "#dce8ef",
    fontSize: "14px",
    fontWeight: 750,
  },

  emptyText: {
    maxWidth: "430px",
    margin:
      "8px 0 0",
    color: "#526a7f",
    fontSize: "10px",
    lineHeight: 1.7,
  },

  /* ===============================
     GRID
  =============================== */

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(310px, 1fr))",
    gap: "12px",
  },

  /* ===============================
     CARD
  =============================== */

  card: {
    padding: "18px",
    border:
      "1px solid rgba(70,96,119,0.17)",
    borderRadius: "13px",
    background:
      "linear-gradient(145deg, rgba(11,27,42,0.95), rgba(7,18,29,0.97))",
    boxShadow:
      "0 14px 35px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.012)",
  },

  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    paddingBottom: "15px",
    borderBottom:
      "1px solid rgba(70,96,119,0.11)",
  },

  cardIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },

  iconInvoice: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "34px",
    height: "34px",
    flexShrink: 0,
    border:
      "1px solid rgba(0,210,255,0.18)",
    borderRadius: "9px",
    background:
      "rgba(0,210,255,0.05)",
    color: "#00d2ff",
    fontSize: "13px",
  },

  iconEth: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "34px",
    height: "34px",
    flexShrink: 0,
    border:
      "1px solid rgba(0,210,255,0.18)",
    borderRadius: "9px",
    background:
      "rgba(0,210,255,0.05)",
    color: "#00d2ff",
    fontSize: "16px",
    fontWeight: 700,
  },

  iconToken: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "34px",
    height: "34px",
    flexShrink: 0,
    border:
      "1px solid rgba(160,120,255,0.18)",
    borderRadius: "9px",
    background:
      "rgba(160,120,255,0.05)",
    color: "#a987e8",
    fontSize: "12px",
  },

  cardTitle: {
    display: "block",
    color: "#dce8ef",
    fontSize: "10px",
    fontWeight: 800,
  },

  cardName: {
    marginTop: "4px",
    color: "#526a7f",
    fontSize: "8px",
  },

  /* ===============================
     STATUS
  =============================== */

  verifiedBadge: {
    padding:
      "4px 7px",
    border:
      "1px solid rgba(77,182,165,0.18)",
    borderRadius: "5px",
    background:
      "rgba(77,182,165,0.05)",
    color: "#64c9b9",
    fontSize: "6px",
    fontWeight: 900,
    letterSpacing: "0.7px",
  },

  statusBadge: {
    padding:
      "4px 7px",
    border:
      "1px solid rgba(70,96,119,0.18)",
    borderRadius: "5px",
    background:
      "rgba(70,96,119,0.04)",
    color: "#71879a",
    fontSize: "6px",
    fontWeight: 800,
    textTransform: "uppercase",
  },

  /* ===============================
     AMOUNT
  =============================== */

  amountBlock: {
    padding:
      "15px 0",
    borderBottom:
      "1px solid rgba(70,96,119,0.11)",
  },

  amountLabel: {
    display: "block",
    marginBottom: "5px",
    color: "#3f576b",
    fontSize: "6px",
    fontWeight: 900,
    letterSpacing: "1px",
  },

  amount: {
    color: "#edf7fb",
    fontSize: "21px",
    fontWeight: 800,
    letterSpacing: "-0.6px",
  },

  amountAsset: {
    marginLeft: "5px",
    color: "#617b8e",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0",
  },

  /* ===============================
     METADATA
  =============================== */

  metadata: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding:
      "14px 0",
  },

  metaRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },

  metaLabel: {
    flexShrink: 0,
    color: "#41596d",
    fontSize: "7px",
    fontWeight: 700,
  },

  metaValue: {
    minWidth: 0,
    color: "#8ba0b0",
    fontSize: "8px",
    fontWeight: 600,
    textAlign: "right",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  metaMono: {
    minWidth: 0,
    color: "#7390a4",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "8px",
    textAlign: "right",
  },

  /* ===============================
     EXPLORER
  =============================== */

  actions: {
    paddingTop: "2px",
  },

  explorerButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding:
      "7px 10px",
    border:
      "1px solid rgba(0,210,255,0.15)",
    borderRadius: "7px",
    background:
      "rgba(0,210,255,0.025)",
    color: "#5dbbd3",
    fontSize: "7px",
    fontWeight: 750,
    textDecoration: "none",
  },

  explorerArrow: {
    color: "#00d2ff",
    fontSize: "10px",
  },
};

export default History;