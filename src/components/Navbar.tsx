import type { WalletData } from "../utils/ethereum";

interface NavbarProps {
  wallet: WalletData | null;
  onDisconnect: () => void;
}

function shortenAddress(address: string | null) {
  if (!address) {
    return "Contract";
  }

  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function Navbar({
  wallet,
  onDisconnect,
}: NavbarProps) {
  return (
    <header style={styles.navbar}>
      {/* Brand */}

      <div style={styles.brand}>
        <div style={styles.logoMark}>
          Ξ
        </div>

        <div>
          <div style={styles.logo}>
            O-PAY
          </div>

          <div style={styles.subtitle}>
            WEB3 PAYMENT INFRASTRUCTURE
          </div>
        </div>
      </div>

      {/* Wallet */}

      {wallet && (
        <div style={styles.navRight}>
          <div style={styles.networkStatus}>
            <span
              style={styles.networkDot}
            />

            <span>
              {wallet.networkName}
            </span>
          </div>

          <div style={styles.navWallet}>
            <div style={styles.walletIcon}>
              ◉
            </div>

            <div style={styles.walletInfo}>
              <span
                style={styles.walletLabel}
              >
                CONNECTED WALLET
              </span>

              <strong
                style={styles.walletAddress}
              >
                {shortenAddress(
                  wallet.address
                )}
              </strong>
            </div>
          </div>

          <button
            style={styles.disconnectButton}
            onClick={onDisconnect}
          >
            <span
              style={styles.disconnectIcon}
            >
              ↪
            </span>

            Disconnect
          </button>
        </div>
      )}
    </header>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  navbar: {
    position: "relative",
    zIndex: 10,
    minHeight: "76px",
    padding: "0 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
    borderBottom:
      "1px solid rgba(70,96,119,0.18)",
    background:
      "linear-gradient(180deg, rgba(7,18,29,0.97), rgba(6,15,24,0.94))",
    boxShadow:
      "0 10px 35px rgba(0,0,0,0.12)",
    backdropFilter: "blur(18px)",
  },

  /* ===============================
     BRAND
  =============================== */

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  logoMark: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "38px",
    height: "38px",
    border:
      "1px solid rgba(0,210,255,0.3)",
    borderRadius: "11px",
    background:
      "linear-gradient(145deg, #10344a, #0a1c2b)",
    color: "#00d2ff",
    fontSize: "19px",
    fontWeight: 700,
    boxShadow:
      "0 0 25px rgba(0,210,255,0.06), inset 0 0 18px rgba(0,210,255,0.04)",
  },

  logo: {
    margin: 0,
    color: "#f2f7fb",
    fontSize: "15px",
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: "1.5px",
  },

  subtitle: {
    marginTop: "4px",
    color: "#41596d",
    fontSize: "6px",
    fontWeight: 800,
    letterSpacing: "1.3px",
  },

  /* ===============================
     RIGHT SIDE
  =============================== */

  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  /* ===============================
     NETWORK
  =============================== */

  networkStatus: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    height: "36px",
    padding:
      "0 11px",
    border:
      "1px solid rgba(77,182,165,0.17)",
    borderRadius: "9px",
    background:
      "rgba(11,32,31,0.55)",
    color: "#75bfb4",
    fontSize: "9px",
    fontWeight: 700,
  },

  networkDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#56d5c3",
    boxShadow:
      "0 0 9px rgba(86,213,195,0.85)",
  },

  /* ===============================
     WALLET
  =============================== */

  navWallet: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    minWidth: "155px",
    height: "36px",
    padding:
      "0 11px",
    border:
      "1px solid rgba(70,96,119,0.22)",
    borderRadius: "9px",
    background:
      "linear-gradient(145deg, #0d1d2b, #091520)",
  },

  walletIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    borderRadius: "7px",
    background:
      "rgba(0,210,255,0.07)",
    color: "#00d2ff",
    fontSize: "10px",
  },

  walletInfo: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },

  walletLabel: {
    marginBottom: "2px",
    color: "#425a6f",
    fontSize: "6px",
    fontWeight: 800,
    letterSpacing: "0.8px",
  },

  walletAddress: {
    color: "#b5c5d3",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "9px",
    fontWeight: 600,
  },

  /* ===============================
     DISCONNECT
  =============================== */

  disconnectButton: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    height: "36px",
    padding:
      "0 13px",
    border:
      "1px solid rgba(255,100,120,0.18)",
    borderRadius: "9px",
    background:
      "linear-gradient(145deg, #1a1117, #130d12)",
    color: "#c98490",
    cursor: "pointer",
    fontSize: "9px",
    fontWeight: 750,
    transition:
      "all 0.2s ease",
  },

  disconnectIcon: {
    fontSize: "12px",
  },
};

export default Navbar;