import type { WalletData } from "../utils/ethereum";

interface WalletCardProps {
  wallet: WalletData;
}

function shortenAddress(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function WalletCard({
  wallet,
}: WalletCardProps) {
  return (
    <section style={styles.cards}>
      {/* Connected Wallet */}

      <div style={styles.card}>
        <div style={styles.cardTop}>
          <div style={styles.iconBox}>
            ◉
          </div>

          <span style={styles.statusBadge}>
            <span style={styles.statusDot} />
            CONNECTED
          </span>
        </div>

        <p style={styles.cardLabel}>
          PRIMARY ACCOUNT
        </p>

        <p style={styles.address}>
          {shortenAddress(
            wallet.address
          )}
        </p>

        <p style={styles.cardDescription}>
          Connected wallet address
        </p>
      </div>

      {/* Balance */}

      <div style={styles.card}>
        <div style={styles.cardTop}>
          <div style={styles.iconBoxBalance}>
            Ξ
          </div>

          <span style={styles.assetBadge}>
            NATIVE ASSET
          </span>
        </div>

        <p style={styles.cardLabel}>
          AVAILABLE BALANCE
        </p>

        <p style={styles.balance}>
          {Number(
            wallet.balance
          ).toFixed(6)}{" "}
          <span style={styles.assetSymbol}>
            ETH
          </span>
        </p>

        <p style={styles.cardDescription}>
          Native wallet balance
        </p>
      </div>

      {/* Network */}

      <div style={styles.card}>
        <div style={styles.cardTop}>
          <div style={styles.iconBoxNetwork}>
            ◎
          </div>

          <span style={styles.networkBadge}>
            ACTIVE
          </span>
        </div>

        <p style={styles.cardLabel}>
          CONNECTED NETWORK
        </p>

        <p style={styles.networkName}>
          {wallet.networkName}
        </p>

        <div style={styles.chainRow}>
          <span>
            CHAIN ID
          </span>

          <strong>
            {wallet.chainId}
          </strong>
        </div>
      </div>
    </section>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  /* ===============================
     GRID
  =============================== */

  cards: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "12px",
    marginBottom: "24px",
  },

  /* ===============================
     CARD
  =============================== */

  card: {
    position: "relative",
    minHeight: "150px",
    padding: "18px",
    overflow: "hidden",
    border:
      "1px solid rgba(70,96,119,0.18)",
    borderRadius: "13px",
    background:
      "linear-gradient(145deg, rgba(12,29,44,0.95), rgba(7,18,29,0.97))",
    boxShadow:
      "0 14px 35px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.015)",
  },

  /* ===============================
     TOP
  =============================== */

  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "17px",
  },

  iconBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    border:
      "1px solid rgba(0,210,255,0.18)",
    borderRadius: "9px",
    background:
      "rgba(0,210,255,0.05)",
    color: "#00d2ff",
    fontSize: "13px",
  },

  iconBoxBalance: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    border:
      "1px solid rgba(0,210,255,0.18)",
    borderRadius: "9px",
    background:
      "linear-gradient(145deg, rgba(0,210,255,0.08), rgba(0,120,180,0.03))",
    color: "#00d2ff",
    fontSize: "16px",
    fontWeight: 700,
  },

  iconBoxNetwork: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    border:
      "1px solid rgba(77,182,165,0.18)",
    borderRadius: "9px",
    background:
      "rgba(77,182,165,0.05)",
    color: "#65d1c1",
    fontSize: "15px",
  },

  /* ===============================
     BADGES
  =============================== */

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding:
      "4px 7px",
    border:
      "1px solid rgba(77,182,165,0.16)",
    borderRadius: "5px",
    background:
      "rgba(77,182,165,0.045)",
    color: "#65c5b6",
    fontSize: "6px",
    fontWeight: 900,
    letterSpacing: "0.7px",
  },

  statusDot: {
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    background: "#55d5c3",
    boxShadow:
      "0 0 7px rgba(85,213,195,0.8)",
  },

  assetBadge: {
    padding:
      "4px 7px",
    border:
      "1px solid rgba(0,210,255,0.13)",
    borderRadius: "5px",
    background:
      "rgba(0,210,255,0.035)",
    color: "#579ab0",
    fontSize: "6px",
    fontWeight: 900,
    letterSpacing: "0.7px",
  },

  networkBadge: {
    padding:
      "4px 7px",
    border:
      "1px solid rgba(77,182,165,0.16)",
    borderRadius: "5px",
    background:
      "rgba(77,182,165,0.045)",
    color: "#65c5b6",
    fontSize: "6px",
    fontWeight: 900,
    letterSpacing: "0.7px",
  },

  /* ===============================
     TEXT
  =============================== */

  cardLabel: {
    margin: 0,
    color: "#425a70",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "1.2px",
  },

  address: {
    margin:
      "9px 0 5px",
    color: "#dce8ef",
    fontSize: "15px",
    fontWeight: 750,
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, monospace",
    letterSpacing: "-0.3px",
  },

  balance: {
    margin:
      "9px 0 5px",
    color: "#eef7fb",
    fontSize: "20px",
    fontWeight: 800,
    letterSpacing: "-0.6px",
  },

  assetSymbol: {
    color: "#607b8f",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0",
  },

  networkName: {
    margin:
      "9px 0 8px",
    color: "#dce8ef",
    fontSize: "15px",
    fontWeight: 750,
  },

  cardDescription: {
    margin: 0,
    color: "#4f687d",
    fontSize: "8px",
  },

  /* ===============================
     CHAIN
  =============================== */

  chainRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "8px",
    borderTop:
      "1px solid rgba(70,96,119,0.12)",
    color: "#425a70",
    fontSize: "6px",
    fontWeight: 800,
    letterSpacing: "0.7px",
  },

  chainRowStrong: {
    color: "#8ba1b2",
  },
};

export default WalletCard;