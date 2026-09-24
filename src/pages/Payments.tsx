import type { WalletData } from "../utils/ethereum";

interface PaymentsProps {
  wallet: WalletData;
  recipient: string;
  amount: string;
  sending: boolean;
  onRecipientChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onSend: () => void;
}

function Payments({
  wallet,
  recipient,
  amount,
  sending,
  onRecipientChange,
  onAmountChange,
  onSend,
}: PaymentsProps) {
  return (
    <section>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>
            PAYMENT OPERATIONS
          </p>

          <h1 style={styles.title}>
            Send Payment
          </h1>

          <p style={styles.subtitle}>
            Send ETH securely to any compatible
            Web3 wallet through MetaMask.
          </p>
        </div>

        <div style={styles.networkPill}>
          <span style={styles.networkDot} />
          <span>{wallet.networkName}</span>
        </div>
      </div>

      <div style={styles.layout}>
        {/* Main Payment Panel */}
        <div style={styles.paymentCard}>
          <div style={styles.cardHeader}>
            <div>
              <p style={styles.cardEyebrow}>
                TRANSACTION
              </p>

              <h2 style={styles.cardTitle}>
                New Payment
              </h2>
            </div>

            <div style={styles.secureBadge}>
              <span style={styles.secureDot} />
              SECURE
            </div>
          </div>

          <div style={styles.divider} />

          <div style={styles.formSection}>
            <label style={styles.inputLabel}>
              Recipient Wallet
            </label>

            <div style={styles.inputContainer}>
              <div style={styles.inputIcon}>
                ↗
              </div>

              <input
                style={styles.input}
                value={recipient}
                onChange={(e) =>
                  onRecipientChange(
                    e.target.value
                  )
                }
                placeholder="0x..."
              />
            </div>

            <p style={styles.inputHint}>
              Enter the destination wallet
              address.
            </p>
          </div>

          <div style={styles.formSection}>
            <label style={styles.inputLabel}>
              Payment Amount
            </label>

            <div style={styles.amountWrapper}>
              <div style={styles.amountIcon}>
                Ξ
              </div>

              <input
                style={styles.amountInput}
                value={amount}
                onChange={(e) =>
                  onAmountChange(
                    e.target.value
                  )
                }
                placeholder="0.01"
                type="number"
                min="0"
                step="0.000001"
              />

              <div style={styles.assetBadge}>
                <span style={styles.ethSymbol}>
                  Ξ
                </span>
                ETH
              </div>
            </div>

            <div style={styles.balanceRow}>
              <span>
                Available balance
              </span>

              <strong>
                {Number(wallet.balance).toFixed(
                  6
                )}{" "}
                ETH
              </strong>
            </div>
          </div>

          <button
            style={{
              ...styles.sendButton,
              ...(sending
                ? styles.sendingButton
                : {}),
            }}
            onClick={onSend}
            disabled={sending}
          >
            <span>
              {sending
                ? "Waiting for MetaMask..."
                : "Send Payment"}
            </span>

            {!sending && (
              <span style={styles.buttonArrow}>
                →
              </span>
            )}
          </button>

          <div style={styles.confirmationNote}>
            <div style={styles.noteIcon}>
              ✓
            </div>

            <p>
              You will review and confirm this
              transaction in MetaMask before it
              is broadcast to the blockchain.
            </p>
          </div>
        </div>

        {/* Transaction Preview */}
        <div style={styles.previewCard}>
          <div style={styles.previewTop}>
            <p style={styles.previewEyebrow}>
              PAYMENT PREVIEW
            </p>

            <div style={styles.liveBadge}>
              <span style={styles.liveDot} />
              LIVE
            </div>
          </div>

          <div style={styles.amountPreview}>
            <span style={styles.previewLabel}>
              YOU ARE SENDING
            </span>

            <div style={styles.previewAmount}>
              <span>
                {amount || "0.00"}
              </span>

              <small>ETH</small>
            </div>

            <span style={styles.previewNetwork}>
              {wallet.networkName}
            </span>
          </div>

          <div style={styles.previewDivider} />

          <div style={styles.detailList}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>
                From
              </span>

              <span style={styles.detailValue}>
                {wallet.address
                  ? `${wallet.address.slice(
                      0,
                      6
                    )}...${wallet.address.slice(
                      -4
                    )}`
                  : "Connected wallet"}
              </span>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>
                To
              </span>

              <span
                style={{
                  ...styles.detailValue,
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
                  : "Waiting for recipient"}
              </span>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>
                Asset
              </span>

              <span style={styles.assetValue}>
                <span style={styles.miniEth}>
                  Ξ
                </span>
                Ethereum
              </span>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>
                Wallet
              </span>

              <span style={styles.connectedValue}>
                Connected
              </span>
            </div>
          </div>

          <div style={styles.securityBox}>
            <div style={styles.securityIcon}>
              ◈
            </div>

            <div>
              <strong style={styles.securityTitle}>
                Non-custodial payment
              </strong>

              <p style={styles.securityText}>
                O-Pay never takes custody of
                your funds. MetaMask signs the
                transaction directly from your
                wallet.
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "24px",
    marginBottom: "30px",
  },

  eyebrow: {
    margin: 0,
    color: "#00d2ff",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1.8px",
  },

  title: {
    margin: "7px 0 0",
    color: "#ffffff",
    fontSize: "32px",
    fontWeight: 700,
    letterSpacing: "-0.8px",
  },

  subtitle: {
    margin: "9px 0 0",
    maxWidth: "560px",
    color: "#71849a",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  networkPill: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 13px",
    border: "1px solid #203449",
    borderRadius: "9px",
    background: "#091522",
    color: "#b9c8d8",
    fontSize: "11px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  networkDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#65e6b1",
    boxShadow:
      "0 0 10px rgba(101,230,177,0.7)",
  },

  layout: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1.35fr) minmax(300px, 0.75fr)",
    gap: "20px",
    alignItems: "start",
  },

  paymentCard: {
    padding: "28px",
    border: "1px solid #172638",
    borderRadius: "16px",
    background:
      "linear-gradient(145deg, #0b1928 0%, #091522 100%)",
    boxShadow:
      "0 18px 50px rgba(0,0,0,0.18)",
  },

  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "20px",
  },

  cardEyebrow: {
    margin: 0,
    color: "#5f7388",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "1.5px",
  },

  cardTitle: {
    margin: "6px 0 0",
    color: "#ffffff",
    fontSize: "20px",
    fontWeight: 700,
  },

  secureBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 9px",
    border: "1px solid #21483c",
    borderRadius: "6px",
    background: "#10251f",
    color: "#65e6b1",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "0.8px",
  },

  secureDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#65e6b1",
  },

  divider: {
    height: "1px",
    margin: "24px 0 4px",
    background: "#172638",
  },

  formSection: {
    marginTop: "22px",
  },

  inputLabel: {
    display: "block",
    marginBottom: "9px",
    color: "#aab9c9",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.2px",
  },

  inputContainer: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #26394e",
    borderRadius: "10px",
    background: "#07111f",
    overflow: "hidden",
  },

  inputIcon: {
    width: "42px",
    height: "45px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderRight: "1px solid #1b2d41",
    color: "#00d2ff",
    fontSize: "15px",
  },

  input: {
    boxSizing: "border-box",
    width: "100%",
    padding: "14px 14px",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: "13px",
    fontFamily: "monospace",
  },

  inputHint: {
    margin: "7px 0 0",
    color: "#53677b",
    fontSize: "10px",
  },

  amountWrapper: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #26394e",
    borderRadius: "10px",
    background: "#07111f",
    overflow: "hidden",
  },

  amountIcon: {
    width: "42px",
    height: "45px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderRight: "1px solid #1b2d41",
    color: "#00d2ff",
    fontSize: "19px",
    fontWeight: 700,
  },

  amountInput: {
    flex: 1,
    minWidth: 0,
    padding: "14px",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 600,
  },

  assetBadge: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    marginRight: "8px",
    padding: "7px 10px",
    border: "1px solid #203449",
    borderRadius: "7px",
    background: "#122338",
    color: "#d8e4ef",
    fontSize: "11px",
    fontWeight: 800,
  },

  ethSymbol: {
    color: "#00d2ff",
    fontSize: "13px",
  },

  balanceRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    marginTop: "9px",
    color: "#5f7388",
    fontSize: "10px",
  },

  balanceInfo: {
    marginTop: "12px",
    color: "#71849a",
    fontSize: "12px",
  },

  sendButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginTop: "27px",
    padding: "14px 16px",
    border: "1px solid #00d2ff",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, #00d2ff 0%, #00b8df 100%)",
    color: "#04101a",
    fontSize: "13px",
    fontWeight: 800,
    letterSpacing: "0.1px",
    cursor: "pointer",
    boxShadow:
      "0 8px 24px rgba(0,210,255,0.14)",
  },

  sendingButton: {
    opacity: 0.7,
    cursor: "wait",
    boxShadow: "none",
  },

  buttonArrow: {
    fontSize: "17px",
    lineHeight: 1,
  },

  confirmationNote: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "14px",
  },

  noteIcon: {
    width: "17px",
    height: "17px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#122b26",
    color: "#65e6b1",
    fontSize: "9px",
    fontWeight: 800,
  },

  confirmationNoteText: {
    margin: 0,
    color: "#596c81",
    fontSize: "10px",
    lineHeight: 1.5,
    textAlign: "center",
  },

  previewCard: {
    minWidth: 0,
    padding: "24px",
    border: "1px solid #172638",
    borderRadius: "16px",
    background: "#091522",
  },

  previewTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },

  previewEyebrow: {
    margin: 0,
    color: "#71849a",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "1.5px",
  },

  liveBadge: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 7px",
    borderRadius: "5px",
    background: "#10251f",
    color: "#65e6b1",
    fontSize: "8px",
    fontWeight: 800,
  },

  liveDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#65e6b1",
  },

  amountPreview: {
    marginTop: "28px",
  },

  previewLabel: {
    color: "#53677b",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "1.3px",
  },

  previewAmount: {
    display: "flex",
    alignItems: "baseline",
    gap: "8px",
    marginTop: "7px",
    color: "#ffffff",
    fontSize: "30px",
    fontWeight: 700,
    letterSpacing: "-1px",
  },

  previewAmountSmall: {
    color: "#00d2ff",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0",
  },

  previewNetwork: {
    display: "inline-block",
    marginTop: "6px",
    color: "#71849a",
    fontSize: "10px",
  },

  previewDivider: {
    height: "1px",
    margin: "22px 0",
    background: "#172638",
  },

  detailList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  detailRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
  },

  detailLabel: {
    color: "#596c81",
    fontSize: "10px",
  },

  detailValue: {
    maxWidth: "190px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: "#b9c8d8",
    fontSize: "10px",
    fontWeight: 600,
    textAlign: "right",
  },

  assetValue: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#b9c8d8",
    fontSize: "10px",
    fontWeight: 600,
  },

  miniEth: {
    color: "#00d2ff",
    fontSize: "12px",
    fontWeight: 800,
  },

  connectedValue: {
    color: "#65e6b1",
    fontSize: "10px",
    fontWeight: 700,
  },

  securityBox: {
    display: "flex",
    gap: "11px",
    marginTop: "24px",
    padding: "13px",
    border: "1px solid #193145",
    borderRadius: "9px",
    background: "#07111f",
  },

  securityIcon: {
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderRadius: "7px",
    background: "#122338",
    color: "#00d2ff",
    fontSize: "13px",
  },

  securityTitle: {
    display: "block",
    color: "#b9c8d8",
    fontSize: "10px",
  },

  securityText: {
    margin: "4px 0 0",
    color: "#596c81",
    fontSize: "9px",
    lineHeight: 1.55,
  },
};

export default Payments;