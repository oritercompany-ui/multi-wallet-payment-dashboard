import { useEffect, useState } from "react";

import {
  connectWallet,
  sendPayment,
  switchNetwork,
  type WalletData,
} from "../utils/ethereum";

interface PaymentRequest {
  id: string;
  invoiceNumber: string;
  title: string;
  description: string;
  amount: string;
  asset: "ETH" | "ERC20";
  tokenAddress?: string;
  recipient: string;
  chainId: string;
  status:
    | "pending"
    | "paid"
    | "cancelled";
  createdAt: number;
  paidAt?: number;
  transactionHash?: string;
  payer?: string;
  createdBy: string;
}

interface BackendInvoice {
  id: string;
  invoiceNumber: string;
  title: string;
  description?: string | null;
  amount: string;
  asset: "ETH" | "ERC20";
  tokenAddress?: string | null;
  recipient: string;
  chainId: string;
  status:
    | "pending"
    | "paid"
    | "cancelled";
  createdAt: string;
  paidAt?: string | null;
  transactionHash?: string | null;
  payer?: string | null;
  createdBy: string;
}

interface PaymentPageProps {
  invoiceId: string;
}

const API_BASE_URL =
  "http://localhost:5000";

function mapInvoice(
  data: BackendInvoice
): PaymentRequest {
  return {
    id: data.id,
    invoiceNumber: data.invoiceNumber,
    title: data.title,
    description: data.description || "",
    amount: data.amount,
    asset: data.asset,
    tokenAddress:
      data.tokenAddress || undefined,
    recipient: data.recipient,
    chainId: data.chainId,
    status: data.status,
    createdAt: new Date(
      data.createdAt
    ).getTime(),
    paidAt: data.paidAt
      ? new Date(data.paidAt).getTime()
      : undefined,
    transactionHash:
      data.transactionHash || undefined,
    payer: data.payer || undefined,
    createdBy: data.createdBy,
  };
}

function PaymentPage({
  invoiceId,
}: PaymentPageProps) {
  const [invoice, setInvoice] =
    useState<PaymentRequest | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [wallet, setWallet] =
    useState<WalletData | null>(null);

  const [connecting, setConnecting] =
    useState(false);

  const [paying, setPaying] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  async function loadInvoice() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_BASE_URL}/invoices/${encodeURIComponent(
          invoiceId
        )}`
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Invoice not found."
        );
      }

      if (!data?.invoice) {
        throw new Error(
          "Invoice not found."
        );
      }

      const mappedInvoice =
        mapInvoice(data.invoice);

      setInvoice(mappedInvoice);
    } catch (err) {
      setInvoice(null);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Failed to load invoice."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleConnectWallet() {
    try {
      setConnecting(true);
      setError("");
      setSuccess("");

      const walletData =
        await connectWallet();

      setWallet(walletData);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Failed to connect wallet."
        );
      }
    } finally {
      setConnecting(false);
    }
  }

  async function handlePayment() {
    if (!invoice) {
      return;
    }

    if (invoice.status === "paid") {
      setError(
        "This invoice has already been paid."
      );
      return;
    }

    if (invoice.status === "cancelled") {
      setError(
        "This invoice has been cancelled."
      );
      return;
    }

    setPaying(true);
    setError("");
    setSuccess("");

    try {
      if (invoice.asset !== "ETH") {
        throw new Error(
          "Currently, only ETH payments are supported."
        );
      }

      if (
        invoice.chainId !==
        "11155111"
      ) {
        throw new Error(
          "This invoice only supports Ethereum Sepolia."
        );
      }

      /*
       * If wallet is not connected,
       * connect first.
       */
      let connectedWallet = wallet;

      if (!connectedWallet) {
        connectedWallet =
          await connectWallet();

        setWallet(connectedWallet);
      }

      /*
       * Make sure MetaMask is on
       * Ethereum Sepolia.
       */
      await switchNetwork(
        "11155111"
      );

      /*
       * Send ETH from the customer wallet
       * to the invoice recipient through MetaMask.
       */
      const result =
        await sendPayment(
          invoice.recipient,
          invoice.amount
        );

      /*
       * Send transaction hash to backend.
       *
       * Backend performs server-side verification:
       * - network
       * - transaction
       * - receipt
       * - recipient
       * - amount
       * - payer
       */
      const response =
        await fetch(
          `${API_BASE_URL}/invoices/${encodeURIComponent(
            invoice.id
          )}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              status: "paid",
              transactionHash:
                result.hash,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "The server could not verify the payment."
        );
      }

      /*
       * Backend has completed
       * server-side verification.
       */
      const updatedInvoice =
        data?.invoice
          ? mapInvoice(
              data.invoice
            )
          : {
              ...invoice,
              status: "paid" as const,
              paidAt: Date.now(),
              transactionHash:
                result.hash,
            };

      setInvoice(
        updatedInvoice
      );

      setSuccess(
        "Payment sent successfully, verified by the server, and the invoice has been updated."
      );
    } catch (err: any) {
      setError(
        err?.message ||
          "Payment could not be completed."
      );
    } finally {
      setPaying(false);
    }
  }

  function formatDate(
    timestamp: number
  ) {
    return new Date(
      timestamp
    ).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function shortenAddress(
    address: string
  ) {
    if (!address) {
      return "-";
    }

    return `${address.slice(
      0,
      6
    )}...${address.slice(-4)}`;
  }

  function getExplorerUrl(
    hash: string
  ) {
    if (
      invoice?.chainId ===
      "11155111"
    ) {
      return `https://sepolia.etherscan.io/tx/${hash}`;
    }

    if (
      invoice?.chainId === "1"
    ) {
      return `https://etherscan.io/tx/${hash}`;
    }

    if (
      invoice?.chainId === "137"
    ) {
      return `https://polygonscan.com/tx/${hash}`;
    }

    if (
      invoice?.chainId === "8453"
    ) {
      return `https://basescan.org/tx/${hash}`;
    }

    if (
      invoice?.chainId ===
      "42161"
    ) {
      return `https://arbiscan.io/tx/${hash}`;
    }

    return "#";
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.backgroundGlowOne} />
        <div style={styles.backgroundGlowTwo} />

        <div style={styles.centerState}>
          <div style={styles.loadingCard}>
            <div style={styles.logoOrb}>
              O
            </div>

            <div style={styles.loadingSpinner} />

            <h2 style={styles.loadingTitle}>
              Loading Payment Request
            </h2>

            <p style={styles.muted}>
              Retrieving secure invoice
              details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div style={styles.page}>
        <div style={styles.backgroundGlowOne} />
        <div style={styles.backgroundGlowTwo} />

        <div style={styles.centerState}>
          <div style={styles.errorCard}>
            <div style={styles.errorIcon}>
              !
            </div>

            <div style={styles.errorEyebrow}>
              PAYMENT REQUEST
            </div>

            <h1 style={styles.errorTitle}>
              Invoice Not Found
            </h1>

            <p style={styles.muted}>
              {error ||
                "The payment request you are looking for is no longer available."}
            </p>

            <button
              style={styles.secondaryButton}
              onClick={() =>
                window.location.reload()
              }
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPaid =
    invoice.status === "paid";

  const isCancelled =
    invoice.status === "cancelled";

  return (
    <div style={styles.page}>
      <div style={styles.backgroundGlowOne} />
      <div style={styles.backgroundGlowTwo} />

      <div style={styles.container}>
        {/* Brand */}
        <header style={styles.brand}>
          <div style={styles.brandIcon}>
            O
          </div>

          <div>
            <div style={styles.brandName}>
              O-PAY
            </div>

            <div style={styles.brandSubtitle}>
              WEB3 PAYMENTS
            </div>
          </div>
        </header>

        {/* Main Card */}
        <main style={styles.card}>
          {/* Header */}
          <div style={styles.cardHeader}>
            <div>
              <div style={styles.eyebrow}>
                PAYMENT REQUEST
              </div>

              <h1 style={styles.invoiceNumber}>
                {invoice.invoiceNumber}
              </h1>
            </div>

            <div
              style={
                isPaid
                  ? styles.statusPaid
                  : isCancelled
                  ? styles.statusCancelled
                  : styles.statusPending
              }
            >
              <span
                style={
                  isPaid
                    ? styles.statusDotPaid
                    : isCancelled
                    ? styles.statusDotCancelled
                    : styles.statusDotPending
                }
              />

              {invoice.status.toUpperCase()}
            </div>
          </div>

          {/* Amount */}
          <section style={styles.amountSection}>
            <div style={styles.amountTopRow}>
              <span style={styles.amountLabel}>
                AMOUNT DUE
              </span>

              <span style={styles.networkMiniBadge}>
                {invoice.chainId ===
                "11155111"
                  ? "SEPOLIA"
                  : `CHAIN ${invoice.chainId}`}
              </span>
            </div>

            <div style={styles.amountRow}>
              <span style={styles.amount}>
                {invoice.amount}
              </span>

              <span style={styles.asset}>
                {invoice.asset}
              </span>
            </div>

            <div style={styles.amountHint}>
              Native blockchain payment
            </div>
          </section>

          {/* Payment Details */}
          <section style={styles.paymentSection}>
            <div style={styles.sectionEyebrow}>
              PAYMENT DETAILS
            </div>

            <h2 style={styles.paymentTitle}>
              {invoice.title}
            </h2>

            {invoice.description && (
              <p style={styles.description}>
                {invoice.description}
              </p>
            )}
          </section>

          <div style={styles.divider} />

          {/* Network + Recipient */}
          <section style={styles.detailsGrid}>
            <div style={styles.detailCard}>
              <div style={styles.detailIcon}>
                ◈
              </div>

              <div>
                <div style={styles.detailLabel}>
                  NETWORK
                </div>

                <div style={styles.detailValue}>
                  {invoice.chainId ===
                  "11155111"
                    ? "Ethereum Sepolia"
                    : `Chain ID ${invoice.chainId}`}
                </div>
              </div>
            </div>

            <div style={styles.detailCard}>
              <div style={styles.detailIcon}>
                ◆
              </div>

              <div>
                <div style={styles.detailLabel}>
                  RECIPIENT
                </div>

                <div
                  style={{
                    ...styles.detailValue,
                    fontFamily:
                      "monospace",
                  }}
                >
                  {shortenAddress(
                    invoice.recipient
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Recipient */}
          <section style={styles.infoBlock}>
            <div style={styles.label}>
              RECIPIENT WALLET
            </div>

            <div style={styles.addressBox}>
              {invoice.recipient}
            </div>
          </section>

          {/* Token Contract */}
          {invoice.asset ===
            "ERC20" &&
            invoice.tokenAddress && (
              <section style={styles.infoBlock}>
                <div style={styles.label}>
                  TOKEN CONTRACT
                </div>

                <div style={styles.addressBox}>
                  {
                    invoice.tokenAddress
                  }
                </div>
              </section>
            )}

          {/* Created */}
          <section style={styles.infoBlock}>
            <div style={styles.label}>
              CREATED
            </div>

            <div style={styles.detailValue}>
              {formatDate(
                invoice.createdAt
              )}
            </div>
          </section>

          {/* Payer */}
          {invoice.payer && (
            <section style={styles.infoBlock}>
              <div style={styles.label}>
                PAYER WALLET
              </div>

              <div style={styles.addressBox}>
                {invoice.payer}
              </div>
            </section>
          )}

          {/* Transaction */}
          {invoice.transactionHash && (
            <section style={styles.transactionBox}>
              <div style={styles.transactionHeader}>
                <div>
                  <div style={styles.label}>
                    TRANSACTION
                  </div>

                  <div
                    style={
                      styles.verifiedLabel
                    }
                  >
                    <span
                      style={
                        styles.verifiedDot
                      }
                    />
                    Server Verified
                  </div>
                </div>

                <div style={styles.verifiedBadge}>
                  VERIFIED
                </div>
              </div>

              <div
                style={
                  styles.transactionHash
                }
              >
                {invoice.transactionHash}
              </div>

              <a
                href={getExplorerUrl(
                  invoice.transactionHash
                )}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.explorerLink}
              >
                View on Blockchain Explorer
                <span>↗</span>
              </a>
            </section>
          )}

          {/* Success */}
          {success && (
            <div style={styles.successBox}>
              <div style={styles.messageIcon}>
                ✓
              </div>

              <div>
                <strong style={styles.messageTitle}>
                  Payment Verified
                </strong>

                <div style={styles.messageText}>
                  {success}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>
              <div style={styles.messageIconError}>
                !
              </div>

              <div>
                <strong style={styles.messageTitleError}>
                  Payment Error
                </strong>

                <div style={styles.messageTextError}>
                  {error}
                </div>
              </div>
            </div>
          )}

          {/* Paid */}
          {isPaid ? (
            <div style={styles.paidBox}>
              <div style={styles.paidIcon}>
                ✓
              </div>

              <div>
                <strong style={styles.paidTitle}>
                  Payment Completed
                </strong>

                <p style={styles.paidText}>
                  This invoice has been successfully
                  confirmed on the blockchain.
                </p>

                {invoice.paidAt && (
                  <div style={styles.paidDate}>
                    Confirmed{" "}
                    {formatDate(
                      invoice.paidAt
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : isCancelled ? (
            <div style={styles.cancelledBox}>
              <div style={styles.cancelledIcon}>
                ×
              </div>

              <div>
                <strong style={styles.cancelledTitle}>
                  Invoice Cancelled
                </strong>

                <p style={styles.cancelledText}>
                  This payment request has been
                  cancelled and can no longer be paid.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Wallet Notice */}
              {!wallet && (
                <div style={styles.walletNotice}>
                  <div style={styles.walletIcon}>
                    ◇
                  </div>

                  <div>
                    <strong style={styles.walletTitle}>
                      Connect your wallet
                    </strong>

                    <p style={styles.walletText}>
                      Connect MetaMask to securely
                      authorize this payment.
                    </p>
                  </div>
                </div>
              )}

              {/* Wallet Action */}
              {!wallet ? (
                <button
                  style={{
                    ...styles.payButton,
                    opacity: connecting
                      ? 0.6
                      : 1,
                    cursor: connecting
                      ? "not-allowed"
                      : "pointer",
                  }}
                  onClick={
                    handleConnectWallet
                  }
                  disabled={connecting}
                >
                  <span>
                    {connecting
                      ? "Connecting..."
                      : "Connect MetaMask"}
                  </span>

                  {!connecting && (
                    <span style={styles.buttonArrow}>
                      →
                    </span>
                  )}
                </button>
              ) : (
                <>
                  {/* Connected Wallet */}
                  <div style={styles.connectedWallet}>
                    <div style={styles.connectedLeft}>
                      <div style={styles.connectedIcon}>
                        ✓
                      </div>

                      <div>
                        <span
                          style={
                            styles.connectedLabel
                          }
                        >
                          CONNECTED WALLET
                        </span>

                        <strong
                          style={
                            styles.connectedAddress
                          }
                        >
                          {shortenAddress(
                            wallet.address
                          )}
                        </strong>
                      </div>
                    </div>

                    <div style={styles.connectedStatus}>
                      <span
                        style={
                          styles.connectedDot
                        }
                      />

                      Ready
                    </div>
                  </div>

                  {/* Pay */}
                  <button
                    style={{
                      ...styles.payButton,
                      opacity: paying
                        ? 0.6
                        : 1,
                      cursor: paying
                        ? "not-allowed"
                        : "pointer",
                    }}
                    onClick={
                      handlePayment
                    }
                    disabled={paying}
                  >
                    <span>
                      {paying
                        ? "Processing Payment..."
                        : `Pay ${invoice.amount} ${invoice.asset}`}
                    </span>

                    {!paying && (
                      <span style={styles.buttonArrow}>
                        →
                      </span>
                    )}
                  </button>
                </>
              )}
            </>
          )}

          {/* Security Note */}
          <div style={styles.securityNote}>
            <div style={styles.securityIcon}>
              ✓
            </div>

            <div>
              <strong style={styles.securityTitle}>
                Non-custodial payment
              </strong>

              <p style={styles.securityText}>
                Your wallet signs the transaction.
                O-Pay never receives or stores your
                private keys.
              </p>
            </div>
          </div>
        </main>

        <footer style={styles.footer}>
          <div style={styles.poweredBy}>
            POWERED BY
            <span> O-PAY</span>
          </div>

          <div style={styles.footerDivider}>
            •
          </div>

          <div style={styles.footerText}>
            Web3 Payment Infrastructure
          </div>
        </footer>
      </div>
    </div>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    position: "relative",
    minHeight: "100vh",
    overflow: "hidden",
    boxSizing: "border-box",
    padding: "40px 20px 50px",
    background:
      "linear-gradient(145deg, #050b13 0%, #07111f 45%, #050c15 100%)",
    color: "#f4f8fc",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },

  backgroundGlowOne: {
    position: "fixed",
    top: "-220px",
    left: "-180px",
    width: "520px",
    height: "520px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(0, 210, 255, 0.09) 0%, rgba(0, 210, 255, 0) 68%)",
    pointerEvents: "none",
  },

  backgroundGlowTwo: {
    position: "fixed",
    right: "-200px",
    bottom: "-250px",
    width: "580px",
    height: "580px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(0, 145, 255, 0.07) 0%, rgba(0, 145, 255, 0) 68%)",
    pointerEvents: "none",
  },

  container: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "660px",
    margin: "0 auto",
  },

  centerState: {
    position: "relative",
    zIndex: 1,
    minHeight: "calc(100vh - 80px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  brand: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "24px",
  },

  brandIcon: {
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(0, 210, 255, 0.35)",
    borderRadius: "11px",
    background:
      "linear-gradient(145deg, #0e293a, #0b1b29)",
    color: "#00d2ff",
    fontSize: "18px",
    fontWeight: 900,
    boxShadow:
      "0 0 25px rgba(0, 210, 255, 0.08)",
  },

  brandName: {
    color: "#f2f7fb",
    fontSize: "15px",
    fontWeight: 900,
    letterSpacing: "1px",
  },

  brandSubtitle: {
    marginTop: "2px",
    color: "#526b82",
    fontSize: "7px",
    fontWeight: 800,
    letterSpacing: "1.7px",
  },

  card: {
    padding: "30px",
    border: "1px solid #17283a",
    borderRadius: "20px",
    background:
      "linear-gradient(145deg, rgba(10, 23, 37, 0.98), rgba(7, 16, 27, 0.98))",
    boxShadow:
      "0 30px 80px rgba(0, 0, 0, 0.38)",
    backdropFilter: "blur(20px)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
  },

  eyebrow: {
    margin: 0,
    color: "#00d2ff",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "1.6px",
  },

  invoiceNumber: {
    margin: "8px 0 0",
    color: "#edf4f9",
    fontSize: "23px",
    fontWeight: 750,
    letterSpacing: "-0.4px",
  },

  statusPending: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 9px",
    border: "1px solid rgba(229, 189, 103, 0.18)",
    borderRadius: "7px",
    background: "rgba(229, 189, 103, 0.07)",
    color: "#e5bd67",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "0.7px",
  },

  statusPaid: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 9px",
    border: "1px solid rgba(50, 230, 161, 0.18)",
    borderRadius: "7px",
    background: "rgba(50, 230, 161, 0.07)",
    color: "#48dca6",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "0.7px",
  },

  statusCancelled: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 9px",
    border: "1px solid rgba(255, 116, 132, 0.18)",
    borderRadius: "7px",
    background: "rgba(255, 116, 132, 0.07)",
    color: "#ff9ca8",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "0.7px",
  },

  statusDotPending: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#e5bd67",
  },

  statusDotPaid: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#48dca6",
    boxShadow:
      "0 0 7px rgba(72, 220, 166, 0.6)",
  },

  statusDotCancelled: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#ff7889",
  },

  amountSection: {
    marginTop: "28px",
    padding: "24px",
    border: "1px solid #1b3449",
    borderRadius: "15px",
    background:
      "radial-gradient(circle at 50% 0%, rgba(0, 210, 255, 0.08), rgba(7, 17, 31, 0.95) 58%)",
    textAlign: "center",
  },

  amountTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  amountLabel: {
    color: "#647b91",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "1.2px",
  },

  networkMiniBadge: {
    padding: "5px 7px",
    border: "1px solid #203448",
    borderRadius: "5px",
    color: "#637c93",
    background: "#0a1724",
    fontSize: "7px",
    fontWeight: 800,
    letterSpacing: "0.7px",
  },

  amountRow: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "center",
    gap: "8px",
    marginTop: "11px",
  },

  amount: {
    color: "#00d2ff",
    fontSize: "38px",
    lineHeight: 1,
    fontWeight: 850,
    letterSpacing: "-1.5px",
    textShadow:
      "0 0 25px rgba(0, 210, 255, 0.16)",
  },

  asset: {
    color: "#9db1c4",
    fontSize: "14px",
    fontWeight: 800,
  },

  amountHint: {
    marginTop: "9px",
    color: "#4e667c",
    fontSize: "9px",
  },

  paymentSection: {
    marginTop: "25px",
  },

  sectionEyebrow: {
    marginBottom: "7px",
    color: "#506a81",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "1.3px",
  },

  paymentTitle: {
    margin: 0,
    color: "#f1f6fa",
    fontSize: "17px",
    fontWeight: 700,
  },

  description: {
    margin: "7px 0 0",
    color: "#7f93a8",
    fontSize: "12px",
    lineHeight: 1.65,
  },

  divider: {
    height: "1px",
    margin: "24px 0",
    background:
      "linear-gradient(90deg, transparent, #1b3043, transparent)",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "12px",
  },

  detailCard: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "13px",
    border: "1px solid #172b3e",
    borderRadius: "11px",
    background: "rgba(7, 16, 26, 0.7)",
  },

  detailIcon: {
    width: "30px",
    height: "30px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    background: "#0d1f30",
    color: "#00bfe8",
    fontSize: "12px",
  },

  detailLabel: {
    marginBottom: "4px",
    color: "#526a81",
    fontSize: "7px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  detailValue: {
    color: "#d5e2ed",
    fontSize: "11px",
    fontWeight: 650,
  },

  infoBlock: {
    marginTop: "20px",
  },

  label: {
    marginBottom: "7px",
    color: "#526a81",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  addressBox: {
    padding: "10px 11px",
    border: "1px solid #172b3e",
    borderRadius: "8px",
    background: "#07121e",
    color: "#93a8bb",
    fontFamily: "monospace",
    fontSize: "10px",
    lineHeight: 1.5,
    wordBreak: "break-all",
  },

  transactionBox: {
    marginTop: "22px",
    padding: "15px",
    border: "1px solid rgba(50, 230, 161, 0.18)",
    borderRadius: "11px",
    background:
      "linear-gradient(145deg, rgba(11, 29, 25, 0.9), rgba(8, 21, 20, 0.9))",
  },

  transactionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
  },

  verifiedLabel: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    marginTop: "5px",
    color: "#4fbb93",
    fontSize: "8px",
    fontWeight: 700,
  },

  verifiedDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#43dca5",
  },

  verifiedBadge: {
    padding: "5px 7px",
    border: "1px solid rgba(50, 230, 161, 0.16)",
    borderRadius: "5px",
    color: "#48dca6",
    background: "rgba(50, 230, 161, 0.06)",
    fontSize: "7px",
    fontWeight: 800,
    letterSpacing: "0.7px",
  },

  transactionHash: {
    marginTop: "12px",
    padding: "10px",
    borderRadius: "7px",
    background: "rgba(0, 0, 0, 0.15)",
    color: "#7fa493",
    fontFamily: "monospace",
    fontSize: "9px",
    lineHeight: 1.5,
    wordBreak: "break-all",
  },

  explorerLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "11px",
    color: "#00d2ff",
    fontSize: "9px",
    fontWeight: 800,
    textDecoration: "none",
  },

  successBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    marginTop: "20px",
    padding: "13px",
    border: "1px solid rgba(50, 230, 161, 0.2)",
    borderRadius: "10px",
    background: "rgba(16, 37, 31, 0.85)",
  },

  messageIcon: {
    width: "24px",
    height: "24px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "7px",
    background: "rgba(50, 230, 161, 0.1)",
    color: "#48dca6",
    fontSize: "11px",
    fontWeight: 900,
  },

  messageTitle: {
    display: "block",
    marginBottom: "3px",
    color: "#57dca9",
    fontSize: "10px",
  },

  messageText: {
    color: "#78a693",
    fontSize: "10px",
    lineHeight: 1.5,
  },

  errorBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    marginTop: "20px",
    padding: "13px",
    border: "1px solid rgba(255, 116, 132, 0.2)",
    borderRadius: "10px",
    background: "rgba(41, 21, 26, 0.85)",
  },

  messageIconError: {
    width: "24px",
    height: "24px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "7px",
    background: "rgba(255, 116, 132, 0.1)",
    color: "#ff9ca8",
    fontSize: "11px",
    fontWeight: 900,
  },

  messageTitleError: {
    display: "block",
    marginBottom: "3px",
    color: "#ff9ca8",
    fontSize: "10px",
  },

  messageTextError: {
    color: "#b9828b",
    fontSize: "10px",
    lineHeight: 1.5,
  },

  paidBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginTop: "24px",
    padding: "17px",
    border: "1px solid rgba(50, 230, 161, 0.2)",
    borderRadius: "11px",
    background:
      "linear-gradient(145deg, rgba(16, 37, 31, 0.9), rgba(9, 25, 22, 0.9))",
  },

  paidIcon: {
    width: "32px",
    height: "32px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    background: "rgba(50, 230, 161, 0.1)",
    color: "#48dca6",
    fontSize: "15px",
    fontWeight: 900,
  },

  paidTitle: {
    display: "block",
    color: "#65e6b1",
    fontSize: "12px",
  },

  paidText: {
    margin: "5px 0 0",
    color: "#719d8d",
    fontSize: "10px",
    lineHeight: 1.6,
  },

  paidDate: {
    marginTop: "7px",
    color: "#4e7567",
    fontSize: "8px",
    fontWeight: 700,
  },

  cancelledBox: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginTop: "24px",
    padding: "17px",
    border: "1px solid rgba(255, 116, 132, 0.2)",
    borderRadius: "11px",
    background:
      "linear-gradient(145deg, rgba(41, 21, 26, 0.9), rgba(25, 14, 19, 0.9))",
  },

  cancelledIcon: {
    width: "32px",
    height: "32px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "9px",
    background: "rgba(255, 116, 132, 0.1)",
    color: "#ff8f9d",
    fontSize: "17px",
    fontWeight: 700,
  },

  cancelledTitle: {
    display: "block",
    color: "#ff9ca8",
    fontSize: "12px",
  },

  cancelledText: {
    margin: "5px 0 0",
    color: "#a87881",
    fontSize: "10px",
    lineHeight: 1.6,
  },

  walletNotice: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "24px",
    padding: "14px",
    border: "1px solid #1a3044",
    borderRadius: "10px",
    background: "#081520",
  },

  walletIcon: {
    width: "30px",
    height: "30px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    background: "#0d2233",
    color: "#00d2ff",
    fontSize: "14px",
  },

  walletTitle: {
    display: "block",
    marginBottom: "3px",
    color: "#dce8f1",
    fontSize: "10px",
  },

  walletText: {
    margin: 0,
    color: "#61778c",
    fontSize: "9px",
    lineHeight: 1.5,
  },

  connectedWallet: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginTop: "24px",
    padding: "13px 14px",
    border: "1px solid rgba(50, 230, 161, 0.18)",
    borderRadius: "10px",
    background:
      "linear-gradient(145deg, rgba(11, 29, 25, 0.8), rgba(7, 20, 18, 0.8))",
  },

  connectedLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  connectedIcon: {
    width: "27px",
    height: "27px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    background: "rgba(50, 230, 161, 0.1)",
    color: "#48dca6",
    fontSize: "11px",
    fontWeight: 900,
  },

  connectedLabel: {
    display: "block",
    marginBottom: "3px",
    color: "#507466",
    fontSize: "7px",
    fontWeight: 800,
    letterSpacing: "0.9px",
  },

  connectedAddress: {
    color: "#d5e3eb",
    fontFamily: "monospace",
    fontSize: "11px",
  },

  connectedStatus: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#5ca58b",
    fontSize: "8px",
    fontWeight: 700,
  },

  connectedDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#43dca5",
    boxShadow:
      "0 0 7px rgba(67, 220, 165, 0.65)",
  },

  payButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    marginTop: "13px",
    padding: "14px 16px",
    border: "1px solid rgba(0, 210, 255, 0.4)",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #00d2ff, #08b9e2)",
    color: "#031019",
    fontSize: "12px",
    fontWeight: 850,
    cursor: "pointer",
    boxShadow:
      "0 8px 28px rgba(0, 210, 255, 0.12)",
  },

  buttonArrow: {
    fontSize: "16px",
    lineHeight: 1,
  },

  securityNote: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    marginTop: "22px",
    paddingTop: "17px",
    borderTop: "1px solid #152638",
  },

  securityIcon: {
    width: "21px",
    height: "21px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
    background: "#0d1f2c",
    color: "#4dbed8",
    fontSize: "9px",
    fontWeight: 900,
  },

  securityTitle: {
    display: "block",
    marginBottom: "3px",
    color: "#71879a",
    fontSize: "8px",
    fontWeight: 800,
  },

  securityText: {
    margin: 0,
    color: "#4e6478",
    fontSize: "8px",
    lineHeight: 1.55,
  },

  footer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    marginTop: "17px",
  },

  poweredBy: {
    color: "#4a6075",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "0.8px",
  },

  poweredBySpan: {},

  footerDivider: {
    color: "#273a4c",
    fontSize: "8px",
  },

  footerText: {
    color: "#3f5367",
    fontSize: "8px",
  },

  loadingCard: {
    width: "100%",
    maxWidth: "390px",
    padding: "32px",
    border: "1px solid #17283a",
    borderRadius: "18px",
    background:
      "linear-gradient(145deg, #0a1725, #08131f)",
    textAlign: "center",
    boxShadow:
      "0 30px 80px rgba(0, 0, 0, 0.35)",
    boxSizing: "border-box",
  },

  logoOrb: {
    width: "54px",
    height: "54px",
    margin: "0 auto 17px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(0, 210, 255, 0.3)",
    borderRadius: "16px",
    background:
      "linear-gradient(145deg, #0d2a3a, #0b1b29)",
    color: "#00d2ff",
    fontSize: "23px",
    fontWeight: 900,
    boxShadow:
      "0 0 30px rgba(0, 210, 255, 0.08)",
  },

  loadingSpinner: {
    width: "18px",
    height: "18px",
    margin: "0 auto 16px",
    border: "2px solid #193247",
    borderTop: "2px solid #00d2ff",
    borderRadius: "50%",
  },

  loadingTitle: {
    margin: 0,
    color: "#eaf2f7",
    fontSize: "17px",
  },

  muted: {
    margin: "8px 0 0",
    color: "#667c91",
    fontSize: "11px",
    lineHeight: 1.6,
  },

  errorCard: {
    width: "100%",
    maxWidth: "460px",
    padding: "32px",
    border: "1px solid rgba(255, 116, 132, 0.2)",
    borderRadius: "18px",
    background:
      "linear-gradient(145deg, #0a1725, #08131f)",
    textAlign: "center",
    boxShadow:
      "0 30px 80px rgba(0, 0, 0, 0.35)",
    boxSizing: "border-box",
  },

  errorIcon: {
    width: "52px",
    height: "52px",
    margin: "0 auto 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(255, 116, 132, 0.2)",
    borderRadius: "15px",
    background: "rgba(255, 116, 132, 0.08)",
    color: "#ff9ca8",
    fontSize: "22px",
    fontWeight: 900,
  },

  errorEyebrow: {
    marginBottom: "7px",
    color: "#536a80",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "1.4px",
  },

  errorTitle: {
    margin: 0,
    color: "#edf4f9",
    fontSize: "22px",
    letterSpacing: "-0.4px",
  },

  secondaryButton: {
    marginTop: "22px",
    padding: "11px 18px",
    border: "1px solid #24394d",
    borderRadius: "8px",
    background: "#0d1d2d",
    color: "#00d2ff",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },
};

export default PaymentPage;