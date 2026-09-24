import { useState } from "react";
import {
  isAddress,
} from "ethers";

interface PaymentRequestProps {
  walletAddress: string;
  chainId: string;
}

function PaymentRequest({
  walletAddress,
  chainId,
}: PaymentRequestProps) {
  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [asset, setAsset] =
    useState<"ETH" | "ERC20">("ETH");

  const [recipient, setRecipient] =
    useState(walletAddress);

  const [tokenAddress, setTokenAddress] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  function getNetworkName(
    currentChainId: string
  ) {
    switch (currentChainId) {
      case "11155111":
        return "Ethereum Sepolia";

      case "1":
        return "Ethereum Mainnet";

      case "137":
        return "Polygon";

      case "8453":
        return "Base";

      case "42161":
        return "Arbitrum One";

      default:
        return `Unknown Network (${currentChainId})`;
    }
  }

  async function handleCreateInvoice() {
    try {
      setError("");
      setSuccess("");

      if (!title.trim()) {
        throw new Error(
          "Enter an invoice title."
        );
      }

      if (!amount.trim()) {
        throw new Error(
          "Enter a payment amount."
        );
      }

      if (
        !Number.isFinite(
          Number(amount)
        ) ||
        Number(amount) <= 0
      ) {
        throw new Error(
          "Payment amount must be greater than 0."
        );
      }

      if (!recipient.trim()) {
        throw new Error(
          "Recipient wallet is required."
        );
      }

      if (
        !isAddress(
          recipient.trim()
        )
      ) {
        throw new Error(
          "Recipient wallet address is invalid."
        );
      }

      if (
        asset === "ERC20" &&
        !tokenAddress.trim()
      ) {
        throw new Error(
          "Enter the token contract address."
        );
      }

      if (
        asset === "ERC20" &&
        !isAddress(
          tokenAddress.trim()
        )
      ) {
        throw new Error(
          "Token contract address is invalid."
        );
      }

      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/invoices",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            title: title.trim(),

            description:
              description.trim(),

            amount: amount.trim(),

            asset,

            ...(asset === "ERC20"
              ? {
                  tokenAddress:
                    tokenAddress.trim(),
                }
              : {}),

            recipient:
              recipient.trim(),

            chainId,

            createdBy:
              walletAddress,
          }),
        }
      );

      let data: any = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to create invoice."
        );
      }

      const invoiceNumber =
        data?.invoice?.invoiceNumber ||
        data?.data?.invoiceNumber ||
        "Invoice";

      setTitle("");
      setDescription("");
      setAmount("");
      setAsset("ETH");
      setTokenAddress("");
      setRecipient(walletAddress);

      setSuccess(
        `${invoiceNumber} was created successfully.`
      );
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Failed to create invoice."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const networkName =
    getNetworkName(chainId);

  return (
    <section style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>
            PAYMENTS
          </div>

          <h1 style={styles.title}>
            Payment Request
          </h1>

          <p style={styles.subtitle}>
            Create a secure Web3 payment request
            for your customers.
          </p>
        </div>

        <div style={styles.networkBadge}>
          <span style={styles.networkDot} />

          <div>
            <div style={styles.networkLabel}>
              ACTIVE NETWORK
            </div>

            <div style={styles.networkName}>
              {networkName}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div style={styles.success}>
          <div style={styles.successIcon}>
            ✓
          </div>

          <div>
            <strong style={styles.successTitle}>
              Invoice Created
            </strong>

            <div style={styles.successText}>
              {success}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={styles.error}>
          <div style={styles.errorIcon}>
            !
          </div>

          <div>
            <strong style={styles.errorTitle}>
              Unable to Create Invoice
            </strong>

            <div style={styles.errorText}>
              {error}
            </div>
          </div>
        </div>
      )}

      <div style={styles.layout}>
        {/* Main Form */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <div style={styles.cardEyebrow}>
                INVOICE BUILDER
              </div>

              <h2 style={styles.cardTitle}>
                Create Payment Request
              </h2>

              <p style={styles.cardDescription}>
                Define the payment details your
                customer will receive and pay
                through their Web3 wallet.
              </p>
            </div>

            <div style={styles.secureBadge}>
              <span style={styles.secureDot} />
              SECURE
            </div>
          </div>

          <div style={styles.divider} />

          {/* Title */}
          <div style={styles.field}>
            <label style={styles.label}>
              Invoice Title
            </label>

            <input
              style={styles.input}
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="e.g. Website Development"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div style={styles.field}>
            <label style={styles.label}>
              Description
              <span style={styles.optional}>
                OPTIONAL
              </span>
            </label>

            <textarea
              style={styles.textarea}
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Describe what the customer is paying for..."
              rows={4}
              disabled={loading}
            />
          </div>

          {/* Amount */}
          <div style={styles.field}>
            <label style={styles.label}>
              Payment Amount
            </label>

            <div style={styles.amountWrapper}>
              <div style={styles.amountSymbol}>
                ◈
              </div>

              <input
                style={styles.amountInput}
                value={amount}
                onChange={(event) =>
                  setAmount(
                    event.target.value
                  )
                }
                placeholder="0.01"
                type="text"
                inputMode="decimal"
                disabled={loading}
              />

              <select
                style={styles.assetSelect}
                value={asset}
                disabled={loading}
                onChange={(event) => {
                  setAsset(
                    event.target.value as
                      | "ETH"
                      | "ERC20"
                  );

                  setError("");
                }}
              >
                <option value="ETH">
                  ETH
                </option>

                <option value="ERC20">
                  ERC-20
                </option>
              </select>
            </div>

            <div style={styles.fieldHint}>
              Amount the customer will be
              required to pay.
            </div>
          </div>

          {/* Token Contract */}
          {asset === "ERC20" && (
            <div style={styles.field}>
              <label style={styles.label}>
                Token Contract Address
              </label>

              <input
                style={styles.inputMono}
                value={tokenAddress}
                onChange={(event) =>
                  setTokenAddress(
                    event.target.value
                  )
                }
                placeholder="0x..."
                disabled={loading}
              />

              <div style={styles.fieldHint}>
                Contract address of the ERC-20
                token.
              </div>
            </div>
          )}

          {/* Recipient */}
          <div style={styles.field}>
            <label style={styles.label}>
              Payment Recipient
            </label>

            <input
              style={styles.inputMono}
              value={recipient}
              onChange={(event) =>
                setRecipient(
                  event.target.value
                )
              }
              placeholder="0x..."
              disabled={loading}
            />

            <div style={styles.recipientInfo}>
              <span style={styles.recipientDot} />

              <span>
                Funds will be sent directly to
                this wallet address.
              </span>
            </div>
          </div>

          {/* Create Button */}
          <button
            style={{
              ...styles.createButton,
              opacity: loading
                ? 0.6
                : 1,
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
            onClick={
              handleCreateInvoice
            }
            disabled={loading}
          >
            <span>
              {loading
                ? "Creating Invoice..."
                : "Create Payment Request"}
            </span>

            {!loading && (
              <span style={styles.buttonArrow}>
                →
              </span>
            )}
          </button>

          <div style={styles.formFooter}>
            <span style={styles.footerCheck}>
              ✓
            </span>

            Invoice data is stored securely
            through the O-Pay backend.
          </div>
        </div>

        {/* Side Preview */}
        <div style={styles.previewColumn}>
          <div style={styles.previewCard}>
            <div style={styles.previewHeader}>
              <div>
                <div style={styles.previewEyebrow}>
                  PAYMENT PREVIEW
                </div>

                <h3 style={styles.previewTitle}>
                  Customer Checkout
                </h3>
              </div>

              <div style={styles.previewStatus}>
                DRAFT
              </div>
            </div>

            <div style={styles.previewAmount}>
              <span style={styles.previewAmountLabel}>
                AMOUNT
              </span>

              <div style={styles.previewAmountValue}>
                {amount || "0.00"}

                <span>
                  {asset}
                </span>
              </div>
            </div>

            <div style={styles.previewRow}>
              <span style={styles.previewLabel}>
                PAYMENT FOR
              </span>

              <span style={styles.previewValue}>
                {title ||
                  "Invoice title"}
              </span>
            </div>

            <div style={styles.previewRow}>
              <span style={styles.previewLabel}>
                NETWORK
              </span>

              <span style={styles.previewValue}>
                {networkName}
              </span>
            </div>

            <div style={styles.previewRow}>
              <span style={styles.previewLabel}>
                RECIPIENT
              </span>

              <span
                style={{
                  ...styles.previewValue,
                  fontFamily:
                    "monospace",
                }}
              >
                {recipient
                  ? `${recipient.slice(
                      0,
                      6
                    )}...${recipient.slice(
                      -4
                    )}`
                  : "0x..."}
              </span>
            </div>

            <div style={styles.previewDivider} />

            <div style={styles.previewSecure}>
              <div style={styles.previewSecureIcon}>
                ✓
              </div>

              <div>
                <strong>
                  Non-custodial payment
                </strong>

                <p>
                  Customer signs the
                  transaction directly from
                  their Web3 wallet.
                </p>
              </div>
            </div>
          </div>

          {/* Infrastructure Card */}
          <div style={styles.infoCard}>
            <div style={styles.infoIcon}>
              ◇
            </div>

            <div>
              <div style={styles.infoEyebrow}>
                O-PAY INFRASTRUCTURE
              </div>

              <strong style={styles.infoTitle}>
                Built for Web3 payments
              </strong>

              <p style={styles.infoText}>
                Created invoices are stored in
                the O-Pay backend and can later
                be shared through payment links,
                tracked in invoice history, and
                verified against blockchain
                transactions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    width: "100%",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "24px",
    marginBottom: "28px",
  },

  eyebrow: {
    marginBottom: "8px",
    color: "#00d2ff",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "1.7px",
  },

  title: {
    margin: 0,
    color: "#f1f6fa",
    fontSize: "32px",
    fontWeight: 750,
    letterSpacing: "-0.8px",
  },

  subtitle: {
    margin: "9px 0 0",
    color: "#7f92a6",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  networkBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: "170px",
    padding: "10px 13px",
    border: "1px solid #172a3d",
    borderRadius: "11px",
    background:
      "linear-gradient(145deg, #0b1928, #09131f)",
  },

  networkDot: {
    width: "7px",
    height: "7px",
    flexShrink: 0,
    borderRadius: "50%",
    background: "#32e6a1",
    boxShadow:
      "0 0 10px rgba(50, 230, 161, 0.65)",
  },

  networkLabel: {
    marginBottom: "3px",
    color: "#536b82",
    fontSize: "7px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  networkName: {
    color: "#c9d8e5",
    fontSize: "10px",
    fontWeight: 700,
  },

  success: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    marginBottom: "18px",
    padding: "13px 15px",
    border: "1px solid rgba(50, 230, 161, 0.2)",
    borderRadius: "10px",
    background:
      "linear-gradient(145deg, #0e241e, #0b1b18)",
  },

  successIcon: {
    width: "26px",
    height: "26px",
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

  successTitle: {
    display: "block",
    marginBottom: "2px",
    color: "#59dca9",
    fontSize: "10px",
  },

  successText: {
    color: "#769d8e",
    fontSize: "10px",
  },

  error: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    marginBottom: "18px",
    padding: "13px 15px",
    border: "1px solid rgba(255, 116, 132, 0.2)",
    borderRadius: "10px",
    background:
      "linear-gradient(145deg, #29151a, #1f1116)",
  },

  errorIcon: {
    width: "26px",
    height: "26px",
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

  errorTitle: {
    display: "block",
    marginBottom: "2px",
    color: "#ff9ca8",
    fontSize: "10px",
  },

  errorText: {
    color: "#b07c85",
    fontSize: "10px",
  },

  layout: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1.35fr) minmax(280px, 0.65fr)",
    gap: "18px",
    alignItems: "start",
  },

  card: {
    padding: "24px",
    border: "1px solid #17283a",
    borderRadius: "17px",
    background:
      "linear-gradient(145deg, #0a1725, #08131f)",
    boxShadow:
      "0 18px 50px rgba(0, 0, 0, 0.16)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
  },

  cardEyebrow: {
    marginBottom: "6px",
    color: "#536c82",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "1.3px",
  },

  cardTitle: {
    margin: 0,
    color: "#eaf2f7",
    fontSize: "19px",
    fontWeight: 700,
  },

  cardDescription: {
    maxWidth: "530px",
    margin: "7px 0 0",
    color: "#697e92",
    fontSize: "10px",
    lineHeight: 1.6,
  },

  secureBadge: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "6px 8px",
    border: "1px solid rgba(50, 230, 161, 0.15)",
    borderRadius: "6px",
    background: "rgba(50, 230, 161, 0.05)",
    color: "#4ebf98",
    fontSize: "7px",
    fontWeight: 800,
    letterSpacing: "0.8px",
  },

  secureDot: {
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    background: "#43dca5",
  },

  divider: {
    height: "1px",
    margin: "21px 0 20px",
    background:
      "linear-gradient(90deg, #182c3e, transparent)",
  },

  field: {
    marginTop: "17px",
  },

  label: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    marginBottom: "7px",
    color: "#9badbe",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0.5px",
  },

  optional: {
    color: "#4f667b",
    fontSize: "7px",
    fontWeight: 700,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #203448",
    borderRadius: "9px",
    outline: "none",
    background: "#07121e",
    color: "#eaf2f7",
    fontSize: "11px",
    transition: "border-color 0.2s ease",
  },

  inputMono: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #203448",
    borderRadius: "9px",
    outline: "none",
    background: "#07121e",
    color: "#b8cbd9",
    fontFamily: "monospace",
    fontSize: "10px",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #203448",
    borderRadius: "9px",
    outline: "none",
    resize: "vertical",
    background: "#07121e",
    color: "#eaf2f7",
    fontSize: "11px",
    lineHeight: 1.5,
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },

  amountWrapper: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #203448",
    borderRadius: "9px",
    background: "#07121e",
    overflow: "hidden",
  },

  amountSymbol: {
    width: "38px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#00bfe8",
    fontSize: "12px",
  },

  amountInput: {
    flex: 1,
    minWidth: 0,
    padding: "12px 5px",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#edf5f9",
    fontSize: "12px",
    fontWeight: 600,
  },

  assetSelect: {
    minWidth: "92px",
    padding: "12px 10px",
    border: "none",
    borderLeft:
      "1px solid #203448",
    outline: "none",
    background: "#0d1d2d",
    color: "#00d2ff",
    fontSize: "10px",
    fontWeight: 800,
  },

  fieldHint: {
    marginTop: "6px",
    color: "#4f667b",
    fontSize: "8px",
    lineHeight: 1.5,
  },

  recipientInfo: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "7px",
    color: "#536b80",
    fontSize: "8px",
  },

  recipientDot: {
    width: "4px",
    height: "4px",
    flexShrink: 0,
    borderRadius: "50%",
    background: "#00bfe8",
  },

  createButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "23px",
    padding: "13px 15px",
    border: "1px solid rgba(0, 210, 255, 0.35)",
    borderRadius: "9px",
    background:
      "linear-gradient(135deg, #00d2ff, #08b9e2)",
    color: "#031019",
    fontSize: "11px",
    fontWeight: 850,
    cursor: "pointer",
    boxShadow:
      "0 8px 24px rgba(0, 210, 255, 0.1)",
  },

  buttonArrow: {
    fontSize: "15px",
    lineHeight: 1,
  },

  formFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    marginTop: "14px",
    color: "#4d6478",
    fontSize: "8px",
  },

  footerCheck: {
    color: "#43c99a",
    fontWeight: 900,
  },

  previewColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  previewCard: {
    padding: "19px",
    border: "1px solid #17283a",
    borderRadius: "15px",
    background:
      "linear-gradient(145deg, #0a1725, #08131f)",
  },

  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "10px",
  },

  previewEyebrow: {
    marginBottom: "5px",
    color: "#536c82",
    fontSize: "7px",
    fontWeight: 800,
    letterSpacing: "1.1px",
  },

  previewTitle: {
    margin: 0,
    color: "#dfeaf2",
    fontSize: "13px",
    fontWeight: 700,
  },

  previewStatus: {
    padding: "5px 7px",
    border: "1px solid #1b3043",
    borderRadius: "5px",
    color: "#617a90",
    background: "#0b1723",
    fontSize: "7px",
    fontWeight: 800,
    letterSpacing: "0.7px",
  },

  previewAmount: {
    marginTop: "18px",
    padding: "15px",
    border: "1px solid #19354a",
    borderRadius: "10px",
    background:
      "radial-gradient(circle at 50% 0%, rgba(0, 210, 255, 0.07), #07121e 70%)",
    textAlign: "center",
  },

  previewAmountLabel: {
    color: "#526b81",
    fontSize: "7px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  previewAmountValue: {
    marginTop: "7px",
    color: "#00d2ff",
    fontSize: "24px",
    fontWeight: 850,
    letterSpacing: "-0.7px",
  },

  previewAmountValueSpan: {},

  previewRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginTop: "14px",
  },

  previewLabel: {
    color: "#4f667b",
    fontSize: "7px",
    fontWeight: 800,
    letterSpacing: "0.8px",
  },

  previewValue: {
    maxWidth: "150px",
    overflow: "hidden",
    color: "#a9bdcd",
    fontSize: "9px",
    fontWeight: 650,
    textAlign: "right",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  previewDivider: {
    height: "1px",
    margin: "17px 0",
    background: "#15283a",
  },

  previewSecure: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
  },

  previewSecureIcon: {
    width: "22px",
    height: "22px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
    background: "rgba(50, 230, 161, 0.08)",
    color: "#43dca5",
    fontSize: "8px",
    fontWeight: 900,
  },

  previewSecureStrong: {},

  previewSecureP: {},

  infoCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    padding: "15px",
    border: "1px solid #17283a",
    borderRadius: "13px",
    background: "#091521",
  },

  infoIcon: {
    width: "29px",
    height: "29px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    background: "#0d2030",
    color: "#00d2ff",
    fontSize: "12px",
  },

  infoEyebrow: {
    marginBottom: "4px",
    color: "#536c82",
    fontSize: "7px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  infoTitle: {
    color: "#c8d7e2",
    fontSize: "10px",
  },

  infoText: {
    margin: "5px 0 0",
    color: "#5d7286",
    fontSize: "8px",
    lineHeight: 1.6,
  },
};

export default PaymentRequest;