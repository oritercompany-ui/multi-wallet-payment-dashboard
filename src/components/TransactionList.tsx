import type { TransactionData } from "../utils/transactions";

interface TransactionListProps {
  transactions: TransactionData[];
  walletAddress: string;
  loading: boolean;
  onRefresh: () => void;
}

function shortenAddress(
  address: string | null
) {
  if (!address) {
    return "Contract";
  }

  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function formatDate(timestamp: string) {
  if (!timestamp) {
    return "-";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function TransactionList({
  transactions,
  walletAddress,
  loading,
  onRefresh,
}: TransactionListProps) {
  return (
    <section style={styles.walletSection}>
      {/* Header */}

      <div style={styles.sectionHeaderRow}>
        <div>
          <div style={styles.sectionEyebrow}>
            ON-CHAIN ACTIVITY
          </div>

          <div style={styles.titleRow}>
            <h3 style={styles.sectionTitle}>
              Recent Transactions
            </h3>

            <span style={styles.liveBadge}>
              <span style={styles.liveDot} />
              LIVE
            </span>
          </div>

          <p style={styles.sectionDescription}>
            Latest blockchain activity for
            your connected wallet.
          </p>
        </div>

        <button
          style={{
            ...styles.refreshButton,
            ...(loading
              ? styles.refreshButtonLoading
              : {}),
          }}
          onClick={onRefresh}
          disabled={loading}
        >
          <span style={styles.refreshIcon}>
            ↻
          </span>

          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </div>

      {/* Loading */}

      {loading ? (
        <div style={styles.emptyState}>
          <div style={styles.loadingOrb}>
            ↻
          </div>

          <p style={styles.emptyTitle}>
            Loading transaction activity
          </p>

          <p style={styles.emptyText}>
            Fetching the latest transactions
            from the Sepolia network.
          </p>
        </div>
      ) : transactions.length === 0 ? (
        /* Empty */

        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            ↗
          </div>

          <p style={styles.emptyTitle}>
            No transaction activity
          </p>

          <p style={styles.emptyText}>
            Your Sepolia transactions will
            appear here once activity is
            detected.
          </p>
        </div>
      ) : (
        /* Transactions */

        <div style={styles.transactionList}>
          {transactions
            .slice(0, 10)
            .map((tx) => {
              const isOutgoing =
                tx.from.toLowerCase() ===
                walletAddress.toLowerCase();

              return (
                <div
                  key={tx.hash}
                  style={styles.transactionRow}
                >
                  {/* Direction */}

                  <div
                    style={{
                      ...styles.transactionIcon,
                      ...(isOutgoing
                        ? styles.transactionIconOutgoing
                        : styles.transactionIconIncoming),
                    }}
                  >
                    {isOutgoing ? "↑" : "↓"}
                  </div>

                  {/* Transaction Info */}

                  <div
                    style={
                      styles.transactionInfo
                    }
                  >
                    <div
                      style={
                        styles.transactionTitleRow
                      }
                    >
                      <p
                        style={
                          styles.transactionType
                        }
                      >
                        {isOutgoing
                          ? "Sent"
                          : "Received"}
                      </p>

                      <span
                        style={
                          isOutgoing
                            ? styles.directionBadgeOutgoing
                            : styles.directionBadgeIncoming
                        }
                      >
                        {isOutgoing
                          ? "OUTGOING"
                          : "INCOMING"}
                      </span>
                    </div>

                    <p
                      style={
                        styles.transactionAddress
                      }
                    >
                      {isOutgoing
                        ? `To: ${shortenAddress(
                            tx.to
                          )}`
                        : `From: ${shortenAddress(
                            tx.from
                          )}`}
                    </p>

                    <p
                      style={
                        styles.transactionDate
                      }
                    >
                      {formatDate(
                        tx.timestamp
                      )}
                    </p>
                  </div>

                  {/* Amount */}

                  <div
                    style={
                      styles.transactionAmount
                    }
                  >
                    <p
                      style={{
                        ...styles.transactionValue,
                        ...(isOutgoing
                          ? styles.transactionValueOutgoing
                          : styles.transactionValueIncoming),
                      }}
                    >
                      {isOutgoing ? "-" : "+"}
                      {Number(
                        tx.value
                      ).toFixed(6)}{" "}
                      <span
                        style={
                          styles.assetSymbol
                        }
                      >
                        ETH
                      </span>
                    </p>

                    <div
                      style={
                        styles.statusRow
                      }
                    >
                      <span
                        style={
                          styles.statusDot
                        }
                      />

                      <p
                        style={
                          styles.transactionStatus
                        }
                      >
                        {tx.status}
                      </p>
                    </div>

                    <button
                      style={
                        styles.explorerButton
                      }
                      onClick={() =>
                        window.open(
                          `https://sepolia.etherscan.io/tx/${tx.hash}`,
                          "_blank"
                        )
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
                    </button>
                  </div>
                </div>
              );
            })}
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

  walletSection: {
    marginTop: "24px",
    padding: "24px",
    border:
      "1px solid rgba(70,96,119,0.19)",
    borderRadius: "14px",
    background:
      "linear-gradient(145deg, rgba(11,27,42,0.94), rgba(7,18,29,0.96))",
    boxShadow:
      "0 16px 40px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.015)",
  },

  /* ===============================
     HEADER
  =============================== */

  sectionHeaderRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "22px",
  },

  sectionEyebrow: {
    marginBottom: "7px",
    color: "#415a70",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "1.5px",
  },

  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  sectionTitle: {
    margin: 0,
    color: "#edf5fa",
    fontSize: "19px",
    fontWeight: 800,
    letterSpacing: "-0.4px",
  },

  sectionDescription: {
    margin: "7px 0 0",
    color: "#60778b",
    fontSize: "10px",
    lineHeight: 1.5,
  },

  /* ===============================
     LIVE BADGE
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
      "rgba(77,182,165,0.06)",
    color: "#62c9b9",
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
     REFRESH
  =============================== */

  refreshButton: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    height: "34px",
    padding:
      "0 11px",
    border:
      "1px solid rgba(70,96,119,0.25)",
    borderRadius: "8px",
    background:
      "linear-gradient(145deg, #0e2030, #091621)",
    color: "#9bb0c1",
    fontSize: "9px",
    fontWeight: 700,
    cursor: "pointer",
    transition:
      "all 0.2s ease",
  },

  refreshButtonLoading: {
    opacity: 0.55,
    cursor: "wait",
  },

  refreshIcon: {
    color: "#00d2ff",
    fontSize: "13px",
  },

  /* ===============================
     EMPTY / LOADING
  =============================== */

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "220px",
    padding:
      "35px 20px",
    border:
      "1px dashed rgba(70,96,119,0.25)",
    borderRadius: "11px",
    background:
      "rgba(5,14,23,0.45)",
    textAlign: "center",
  },

  loadingOrb: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "46px",
    height: "46px",
    marginBottom: "14px",
    border:
      "1px solid rgba(0,210,255,0.2)",
    borderRadius: "14px",
    background:
      "rgba(0,210,255,0.05)",
    color: "#00d2ff",
    fontSize: "22px",
  },

  emptyIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "46px",
    height: "46px",
    marginBottom: "14px",
    border:
      "1px solid rgba(0,210,255,0.17)",
    borderRadius: "14px",
    background:
      "rgba(0,210,255,0.04)",
    color: "#00d2ff",
    fontSize: "21px",
  },

  emptyTitle: {
    margin: 0,
    color: "#dbe7ef",
    fontSize: "13px",
    fontWeight: 750,
  },

  emptyText: {
    maxWidth: "380px",
    margin:
      "7px 0 0",
    color: "#526a7f",
    fontSize: "10px",
    lineHeight: 1.6,
  },

  /* ===============================
     TRANSACTION LIST
  =============================== */

  transactionList: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  transactionRow: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    minHeight: "72px",
    padding:
      "12px 14px",
    border:
      "1px solid rgba(70,96,119,0.15)",
    borderRadius: "10px",
    background:
      "linear-gradient(145deg, rgba(8,21,33,0.9), rgba(6,16,25,0.92))",
    transition:
      "all 0.2s ease",
  },

  /* ===============================
     TRANSACTION ICON
  =============================== */

  transactionIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "39px",
    height: "39px",
    flexShrink: 0,
    borderRadius: "11px",
    fontSize: "18px",
    fontWeight: 800,
  },

  transactionIconOutgoing: {
    border:
      "1px solid rgba(255,100,120,0.16)",
    background:
      "rgba(255,100,120,0.055)",
    color: "#ff8797",
  },

  transactionIconIncoming: {
    border:
      "1px solid rgba(77,182,165,0.17)",
    background:
      "rgba(77,182,165,0.055)",
    color: "#69d6c5",
  },

  /* ===============================
     INFO
  =============================== */

  transactionInfo: {
    flex: 1,
    minWidth: 0,
  },

  transactionTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
  },

  transactionType: {
    margin: 0,
    color: "#dce8ef",
    fontSize: "11px",
    fontWeight: 750,
  },

  directionBadgeOutgoing: {
    padding:
      "3px 5px",
    border:
      "1px solid rgba(255,100,120,0.13)",
    borderRadius: "4px",
    background:
      "rgba(255,100,120,0.04)",
    color: "#a86772",
    fontSize: "5px",
    fontWeight: 900,
    letterSpacing: "0.7px",
  },

  directionBadgeIncoming: {
    padding:
      "3px 5px",
    border:
      "1px solid rgba(77,182,165,0.13)",
    borderRadius: "4px",
    background:
      "rgba(77,182,165,0.04)",
    color: "#5d9e94",
    fontSize: "5px",
    fontWeight: 900,
    letterSpacing: "0.7px",
  },

  transactionAddress: {
    margin:
      "5px 0 0",
    color: "#61788c",
    fontSize: "9px",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, monospace",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  transactionDate: {
    margin:
      "4px 0 0",
    color: "#40576a",
    fontSize: "8px",
  },

  /* ===============================
     AMOUNT
  =============================== */

  transactionAmount: {
    minWidth: "145px",
    textAlign: "right",
    flexShrink: 0,
  },

  transactionValue: {
    margin: 0,
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "-0.2px",
  },

  transactionValueOutgoing: {
    color: "#ff8d9c",
  },

  transactionValueIncoming: {
    color: "#6bd9c5",
  },

  assetSymbol: {
    color: "#71889a",
    fontSize: "8px",
    fontWeight: 700,
  },

  statusRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "5px",
    marginTop: "4px",
  },

  statusDot: {
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    background: "#55d5c3",
    boxShadow:
      "0 0 6px rgba(85,213,195,0.65)",
  },

  transactionStatus: {
    margin: 0,
    color: "#628073",
    fontSize: "7px",
    fontWeight: 700,
    textTransform: "capitalize",
  },

  /* ===============================
     EXPLORER
  =============================== */

  explorerButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "6px",
    padding:
      "4px 7px",
    border:
      "1px solid rgba(0,210,255,0.13)",
    borderRadius: "5px",
    background:
      "rgba(0,210,255,0.025)",
    color: "#5cbcd4",
    fontSize: "7px",
    fontWeight: 700,
    cursor: "pointer",
  },

  explorerArrow: {
    color: "#00d2ff",
    fontSize: "9px",
  },
};

export default TransactionList;