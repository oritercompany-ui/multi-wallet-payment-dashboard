import {
  SUPPORTED_NETWORKS,
  switchNetwork,
} from "../utils/ethereum";

interface NetworksProps {
  currentChainId: string;
  onNetworkChanged: () => void;
}

function Networks({
  currentChainId,
  onNetworkChanged,
}: NetworksProps) {
  const handleSwitch = async (chainId: string) => {
    if (chainId === currentChainId) {
      return;
    }

    try {
      await switchNetwork(chainId);
      onNetworkChanged();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to switch network."
      );
    }
  };

  const activeNetwork = SUPPORTED_NETWORKS.find(
    (network) => network.chainId === currentChainId
  );

  return (
    <section style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>
            NETWORK INFRASTRUCTURE
          </div>

          <h1 style={styles.title}>
            Network Management
          </h1>

          <p style={styles.subtitle}>
            Switch between supported EVM networks
            through your connected wallet.
          </p>
        </div>

        <div style={styles.networkStatus}>
          <span style={styles.statusDot} />

          <div>
            <div style={styles.statusLabel}>
              CURRENT NETWORK
            </div>

            <div style={styles.statusValue}>
              {activeNetwork?.networkName ||
                `Chain ${currentChainId}`}
            </div>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div style={styles.warning}>
        <div style={styles.warningIcon}>!</div>

        <div>
          <div style={styles.warningTitle}>
            Verify network before transacting
          </div>

          <div style={styles.warningText}>
            Always confirm that your wallet is connected
            to the intended network before sending funds
            or approving blockchain transactions.
          </div>
        </div>
      </div>

      {/* Network Overview */}
      <div style={styles.sectionHeader}>
        <div>
          <div style={styles.sectionEyebrow}>
            SUPPORTED CHAINS
          </div>

          <h2 style={styles.sectionTitle}>
            Available Networks
          </h2>
        </div>

        <div style={styles.networkCount}>
          {SUPPORTED_NETWORKS.length} NETWORK
          {SUPPORTED_NETWORKS.length !== 1 ? "S" : ""}
        </div>
      </div>

      {/* Network Grid */}
      <div style={styles.grid}>
        {SUPPORTED_NETWORKS.map((network) => {
          const isActive =
            network.chainId === currentChainId;

          return (
            <div
              key={network.chainId}
              style={{
                ...styles.card,
                ...(isActive ? styles.activeCard : {}),
              }}
            >
              {/* Card Header */}
              <div style={styles.cardHeader}>
                <div
                  style={{
                    ...styles.networkIcon,
                    ...(isActive
                      ? styles.activeNetworkIcon
                      : {}),
                  }}
                >
                  <span>◆</span>
                </div>

                {isActive ? (
                  <div style={styles.activeBadge}>
                    <span style={styles.activeBadgeDot} />
                    ACTIVE
                  </div>
                ) : (
                  <div style={styles.availableBadge}>
                    AVAILABLE
                  </div>
                )}
              </div>

              {/* Network Info */}
              <div style={styles.networkInfo}>
                <h2 style={styles.networkName}>
                  {network.networkName}
                </h2>

                <p style={styles.networkDescription}>
                  EVM-compatible blockchain network
                </p>
              </div>

              {/* Metadata */}
              <div style={styles.metadata}>
                <div style={styles.metadataRow}>
                  <span style={styles.metadataLabel}>
                    CHAIN ID
                  </span>

                  <span style={styles.metadataValue}>
                    {network.chainId}
                  </span>
                </div>

                <div style={styles.divider} />

                <div style={styles.metadataRow}>
                  <span style={styles.metadataLabel}>
                    NATIVE ASSET
                  </span>

                  <span style={styles.metadataValue}>
                    {network.nativeCurrency}
                  </span>
                </div>
              </div>

              {/* Action */}
              <button
                style={{
                  ...styles.switchButton,
                  ...(isActive
                    ? styles.activeButton
                    : {}),
                }}
                disabled={isActive}
                onClick={() =>
                  handleSwitch(network.chainId)
                }
              >
                {isActive ? (
                  <>
                    <span style={styles.checkIcon}>
                      ✓
                    </span>
                    Current Network
                  </>
                ) : (
                  <>
                    Switch Network
                    <span style={styles.arrow}>
                      →
                    </span>
                  </>
                )}
              </button>
            </div>
          );
        })}
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
    marginBottom: "30px",
  },

  eyebrow: {
    marginBottom: "9px",
    color: "#00d2ff",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1.8px",
  },

  title: {
    margin: 0,
    color: "#f4f8fc",
    fontSize: "32px",
    fontWeight: 700,
    letterSpacing: "-0.8px",
  },

  subtitle: {
    margin: "9px 0 0",
    color: "#7f91a6",
    fontSize: "13px",
    lineHeight: 1.6,
  },

  networkStatus: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    minWidth: "180px",
    padding: "11px 14px",
    border: "1px solid #17283a",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg, #0b1827, #09131f)",
  },

  statusDot: {
    width: "8px",
    height: "8px",
    flexShrink: 0,
    borderRadius: "50%",
    background: "#32e6a1",
    boxShadow:
      "0 0 12px rgba(50, 230, 161, 0.65)",
  },

  statusLabel: {
    marginBottom: "3px",
    color: "#63778d",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "1.2px",
  },

  statusValue: {
    color: "#dce8f3",
    fontSize: "12px",
    fontWeight: 700,
  },

  warning: {
    display: "flex",
    alignItems: "flex-start",
    gap: "13px",
    marginBottom: "32px",
    padding: "15px 17px",
    border: "1px solid #3b3220",
    borderRadius: "13px",
    background:
      "linear-gradient(135deg, #17150f, #12130f)",
  },

  warningIcon: {
    width: "24px",
    height: "24px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #705b2c",
    borderRadius: "7px",
    color: "#e5bd67",
    fontSize: "12px",
    fontWeight: 900,
  },

  warningTitle: {
    marginBottom: "3px",
    color: "#d9bd7c",
    fontSize: "11px",
    fontWeight: 800,
  },

  warningText: {
    color: "#887d66",
    fontSize: "11px",
    lineHeight: 1.5,
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "16px",
  },

  sectionEyebrow: {
    marginBottom: "5px",
    color: "#536b82",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "1.4px",
  },

  sectionTitle: {
    margin: 0,
    color: "#e9f1f8",
    fontSize: "18px",
    fontWeight: 700,
  },

  networkCount: {
    padding: "6px 9px",
    border: "1px solid #1a2c3f",
    borderRadius: "6px",
    color: "#668097",
    background: "#0a1623",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },

  card: {
    position: "relative",
    padding: "20px",
    border: "1px solid #17283a",
    borderRadius: "15px",
    background:
      "linear-gradient(145deg, #0a1725, #08121d)",
    boxShadow:
      "0 10px 30px rgba(0, 0, 0, 0.12)",
  },

  activeCard: {
    border: "1px solid rgba(0, 210, 255, 0.55)",
    boxShadow:
      "0 12px 35px rgba(0, 210, 255, 0.08)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  networkIcon: {
    width: "42px",
    height: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #1b3045",
    borderRadius: "11px",
    background: "#0d1d2d",
    color: "#57728a",
    fontSize: "15px",
  },

  activeNetworkIcon: {
    border: "1px solid rgba(0, 210, 255, 0.3)",
    background:
      "linear-gradient(145deg, #0d2939, #0b1c2a)",
    color: "#00d2ff",
    boxShadow:
      "0 0 20px rgba(0, 210, 255, 0.08)",
  },

  activeBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 8px",
    border: "1px solid rgba(50, 230, 161, 0.18)",
    borderRadius: "6px",
    background: "rgba(50, 230, 161, 0.07)",
    color: "#43dca5",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "0.8px",
  },

  activeBadgeDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#32e6a1",
    boxShadow:
      "0 0 7px rgba(50, 230, 161, 0.7)",
  },

  availableBadge: {
    padding: "6px 8px",
    border: "1px solid #1b2b3c",
    borderRadius: "6px",
    color: "#60778d",
    background: "#0b1723",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "0.8px",
  },

  networkInfo: {
    marginTop: "18px",
  },

  networkName: {
    margin: 0,
    color: "#edf4f9",
    fontSize: "18px",
    fontWeight: 700,
    letterSpacing: "-0.2px",
  },

  networkDescription: {
    margin: "5px 0 0",
    color: "#63788e",
    fontSize: "10px",
  },

  metadata: {
    marginTop: "20px",
    padding: "13px",
    border: "1px solid #15273a",
    borderRadius: "10px",
    background: "rgba(5, 13, 21, 0.55)",
  },

  metadataRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },

  metadataLabel: {
    color: "#536a80",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  metadataValue: {
    color: "#b8c9d8",
    fontFamily: "monospace",
    fontSize: "10px",
    fontWeight: 600,
  },

  divider: {
    height: "1px",
    margin: "11px 0",
    background: "#142638",
  },

  switchButton: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "16px",
    padding: "12px 14px",
    border: "1px solid rgba(0, 210, 255, 0.35)",
    borderRadius: "9px",
    background:
      "linear-gradient(135deg, #00d2ff, #08b9e2)",
    color: "#04121c",
    fontSize: "11px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow:
      "0 6px 18px rgba(0, 210, 255, 0.08)",
  },

  activeButton: {
    border: "1px solid #1b3043",
    background: "#0d1b29",
    color: "#60778d",
    cursor: "default",
    boxShadow: "none",
  },

  checkIcon: {
    fontSize: "12px",
    fontWeight: 900,
  },

  arrow: {
    fontSize: "15px",
    lineHeight: 1,
  },
};

export default Networks;