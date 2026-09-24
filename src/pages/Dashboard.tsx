import { useEffect, useMemo, useState } from "react";

import TransactionList from "../components/TransactionList";

import type { WalletData } from "../utils/ethereum";
import type { TransactionData } from "../utils/transactions";

interface DashboardProps {
  wallet: WalletData;
  transactions: TransactionData[];
  loadingTransactions: boolean;
  onRefresh: () => void;
  onCopyAddress: () => void;
}

interface StoredWallet {
  id: string;
  name: string;
  address: string;
  balance: string;
}

const STORAGE_KEY = "opay_wallets";
const ACTIVE_WALLET_KEY = "opay_active_wallet";

function Dashboard({
  wallet,
  transactions,
  loadingTransactions,
  onRefresh,
  onCopyAddress,
}: DashboardProps) {
  const [wallets, setWallets] = useState<StoredWallet[]>(
    []
  );

  const [activeWalletId, setActiveWalletId] =
    useState<string | null>(null);

  function loadWallets() {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY);

      const active =
        localStorage.getItem(
          ACTIVE_WALLET_KEY
        );

      if (saved) {
        setWallets(JSON.parse(saved));
      } else {
        setWallets([]);
      }

      setActiveWalletId(active);
    } catch {
      setWallets([]);
    }
  }

  useEffect(() => {
    loadWallets();

    const interval = setInterval(
      loadWallets,
      1000
    );

    return () =>
      clearInterval(interval);
  }, []);

  const totalBalance = useMemo(() => {
    return wallets.reduce(
      (total, item) =>
        total +
        Number(item.balance || 0),
      0
    );
  }, [wallets]);

  const activeWallet =
    wallets.find(
      (item) =>
        item.id === activeWalletId
    );

  const monitoredWalletCount =
    wallets.length;

  return (
    <section>
      {/* =====================================================
          PREMIUM HEADER
      ===================================================== */}

      <div style={styles.header}>
        <div>
          <div style={styles.brandLine}>
            <span style={styles.brandLineDot} />
            O-PAY / PORTFOLIO
          </div>

          <h1 style={styles.title}>
            Financial
            <span style={styles.titleAccent}>
              {" "}Command Center
            </span>
          </h1>

          <p style={styles.subtitle}>
            A unified interface for monitoring
            wallets, balances, and on-chain
            activity.
          </p>
        </div>

        <div style={styles.networkBadge}>
          <span style={styles.networkDot} />

          <div>
            <span style={styles.networkLabel}>
              NETWORK
            </span>

            <strong style={styles.networkName}>
              {wallet.networkName}
            </strong>
          </div>
        </div>
      </div>

      {/* =====================================================
          HERO PORTFOLIO CARD
      ===================================================== */}

      <div style={styles.heroCard}>
        <div style={styles.heroGlowOne} />
        <div style={styles.heroGlowTwo} />

        <div style={styles.heroContent}>
          <div>
            <div style={styles.heroLabel}>
              TOTAL PORTFOLIO VALUE
            </div>

            <div style={styles.heroBalance}>
              {totalBalance.toFixed(6)}

              <span style={styles.heroCurrency}>
                ETH
              </span>
            </div>

            <div style={styles.heroMeta}>
              <span style={styles.heroStatus}>
                <span style={styles.statusDot} />
                Portfolio Active
              </span>

              <span style={styles.heroSeparator}>
                /
              </span>

              <span>
                {monitoredWalletCount}{" "}
                {monitoredWalletCount === 1
                  ? "wallet"
                  : "wallets"}{" "}
                monitored
              </span>
            </div>
          </div>

          <div style={styles.heroSymbol}>
            Ξ
          </div>
        </div>

        <div style={styles.heroBottom}>
          <div>
            <span style={styles.heroBottomLabel}>
              ACTIVE WALLET
            </span>

            <strong style={styles.heroWalletName}>
              {activeWallet
                ? activeWallet.name
                : "No Wallet Selected"}
            </strong>
          </div>

          <div style={styles.heroAddress}>
            {activeWallet
              ? shortenAddress(
                  activeWallet.address
                )
              : "—"}
          </div>
        </div>
      </div>

      {/* =====================================================
          METRICS
      ===================================================== */}

      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            ◈
          </div>

          <div>
            <span style={styles.metricLabel}>
              MONITORED WALLETS
            </span>

            <strong style={styles.metricValue}>
              {monitoredWalletCount}
            </strong>

            <span style={styles.metricHint}>
              Public addresses
            </span>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            Ξ
          </div>

          <div>
            <span style={styles.metricLabel}>
              CONNECTED NETWORK
            </span>

            <strong
              style={
                styles.metricNetworkValue
              }
            >
              {wallet.networkName}
            </strong>

            <span style={styles.metricHint}>
              Chain ID {wallet.chainId}
            </span>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>
            ↗
          </div>

          <div>
            <span style={styles.metricLabel}>
              WALLET STATUS
            </span>

            <strong
              style={
                styles.metricStatusValue
              }
            >
              Connected
            </strong>

            <span style={styles.metricHint}>
              Ready for transactions
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================
          CONNECTED WALLET
      ===================================================== */}

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <span style={styles.sectionEyebrow}>
              PRIMARY ACCOUNT
            </span>

            <h2 style={styles.sectionTitle}>
              Connected Wallet
            </h2>

            <p style={styles.sectionDescription}>
              Your active Web3 account for signing
              and blockchain transactions.
            </p>
          </div>

          <div style={styles.secureBadge}>
            <span style={styles.secureIcon}>
              ✓
            </span>

            SECURE CONNECTION
          </div>
        </div>

        {/* PREMIUM WALLET IDENTITY CARD */}

        <div style={styles.connectedWalletCard}>
          <div style={styles.connectedGlowOne} />
          <div style={styles.connectedGlowTwo} />

          <div style={styles.connectedTop}>
            <div style={styles.connectedIdentity}>
              <div style={styles.walletOrb}>
                <span>Ξ</span>
              </div>

              <div>
                <span
                  style={
                    styles.connectedEyebrow
                  }
                >
                  CONNECTED WALLET
                </span>

                <h3
                  style={
                    styles.connectedWalletTitle
                  }
                >
                  {shortenAddress(
                    wallet.address
                  )}
                </h3>

                <div
                  style={
                    styles.connectedStatus
                  }
                >
                  <span
                    style={
                      styles.connectedStatusDot
                    }
                  />

                  Wallet connected
                </div>
              </div>
            </div>

            <div style={styles.connectedNetwork}>
              <span
                style={
                  styles.connectedNetworkLabel
                }
              >
                NETWORK
              </span>

              <strong>
                {wallet.networkName}
              </strong>

              <span
                style={
                  styles.connectedChain
                }
              >
                Chain ID {wallet.chainId}
              </span>
            </div>
          </div>

          <div style={styles.connectedDivider} />

          <div style={styles.connectedStats}>
            <div style={styles.connectedStat}>
              <span
                style={
                  styles.connectedStatLabel
                }
              >
                AVAILABLE BALANCE
              </span>

              <div
                style={
                  styles.connectedBalance
                }
              >
                <strong>
                  {Number(
                    wallet.balance || 0
                  ).toFixed(6)}
                </strong>

                <span>ETH</span>
              </div>
            </div>

            <div style={styles.connectedStat}>
              <span
                style={
                  styles.connectedStatLabel
                }
              >
                WALLET ADDRESS
              </span>

              <p
                style={
                  styles.connectedFullAddress
                }
              >
                {wallet.address}
              </p>
            </div>

            <button
              style={
                styles.connectedCopyButton
              }
              onClick={onCopyAddress}
            >
              <span style={styles.copyIcon}>
                ⧉
              </span>

              <span>
                Copy Address
              </span>
            </button>
          </div>

          <div
            style={
              styles.connectedFooter
            }
          >
            <div
              style={
                styles.connectedSecurity
              }
            >
              <span
                style={
                  styles.securityShield
                }
              >
                ◇
              </span>

              <div>
                <strong
                  style={
                    styles.securityTitle
                  }
                >
                  NON-CUSTODIAL
                </strong>

                <span
                  style={
                    styles.securityDescription
                  }
                >
                  Your private keys remain
                  under your control.
                </span>
              </div>
            </div>

            <div
              style={
                styles.connectedReady
              }
            >
              <span
                style={styles.readyDot}
              />

              READY FOR TRANSACTIONS
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          MONITORED WALLETS
      ===================================================== */}

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <span style={styles.sectionEyebrow}>
              PORTFOLIO MANAGEMENT
            </span>

            <h2 style={styles.sectionTitle}>
              Monitored Wallets
            </h2>

            <p style={styles.sectionDescription}>
              Track balances across your
              connected public wallet addresses.
            </p>
          </div>

          <div style={styles.countBadge}>
            {wallets.length}

            <span>
              {wallets.length === 1
                ? " WALLET"
                : " WALLETS"}
            </span>
          </div>
        </div>

        {wallets.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              ◈
            </div>

            <h3 style={styles.emptyTitle}>
              No Wallets Monitored
            </h3>

            <p style={styles.emptyText}>
              Add a public wallet address from
              the Wallets section to begin
              monitoring your portfolio.
            </p>
          </div>
        ) : (
          <div style={styles.walletGrid}>
            {wallets.map(
              (item) => (
                <div
                  key={item.id}
                  style={{
                    ...styles.monitoredWallet,
                    ...(item.id ===
                    activeWalletId
                      ? styles.activeWallet
                      : {}),
                  }}
                >
                  {item.id ===
                    activeWalletId && (
                    <div
                      style={
                        styles.activeGlow
                      }
                    />
                  )}

                  <div
                    style={
                      styles.walletHeader
                    }
                  >
                    <div>
                      <span
                        style={
                          styles.walletIndex
                        }
                      >
                        WALLET
                      </span>

                      <h3
                        style={
                          styles.walletName
                        }
                      >
                        {item.name}
                      </h3>

                      <p
                        style={
                          styles.address
                        }
                      >
                        {shortenAddress(
                          item.address
                        )}
                      </p>
                    </div>

                    {item.id ===
                      activeWalletId && (
                      <span
                        style={
                          styles.activeBadge
                        }
                      >
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div
                    style={
                      styles.walletBalance
                    }
                  >
                    <div>
                      <span
                        style={
                          styles.balanceLabel
                        }
                      >
                        AVAILABLE BALANCE
                      </span>

                      <strong
                        style={
                          styles.walletBalanceValue
                        }
                      >
                        {Number(
                          item.balance
                        ).toFixed(6)}{" "}
                        ETH
                      </strong>
                    </div>

                    <div
                      style={
                        styles.walletArrow
                      }
                    >
                      →
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {/* =====================================================
          RECENT ACTIVITY
      ===================================================== */}

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <span style={styles.sectionEyebrow}>
              ON-CHAIN ACTIVITY
            </span>

            <h2 style={styles.sectionTitle}>
              Recent Transactions
            </h2>

            <p style={styles.sectionDescription}>
              Latest blockchain activity from
              your connected wallet.
            </p>
          </div>

          <div style={styles.liveBadge}>
            <span style={styles.liveDot} />
            LIVE
          </div>
        </div>

        <TransactionList
          transactions={transactions}
          walletAddress={
            wallet.address
          }
          loading={
            loadingTransactions
          }
          onRefresh={onRefresh}
        />
      </div>
    </section>
  );
}

function shortenAddress(
  address: string
) {
  return `${address.slice(
    0,
    6
  )}...${address.slice(-4)}`;
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  /* =====================================================
     HEADER
  ===================================================== */

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "24px",
    marginBottom: "30px",
  },

  brandLine: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    marginBottom: "10px",
    color: "#6e8499",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "1.8px",
  },

  brandLineDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#00d2ff",
    boxShadow:
      "0 0 10px rgba(0,210,255,0.9)",
  },

  title: {
    margin: 0,
    color: "#f4f8fc",
    fontSize: "36px",
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: "-1.5px",
  },

  titleAccent: {
    color: "#00d2ff",
  },

  subtitle: {
    margin: "9px 0 0",
    maxWidth: "550px",
    color: "#70869b",
    fontSize: "12px",
    lineHeight: 1.7,
  },

  networkBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: "170px",
    padding: "10px 14px",
    border:
      "1px solid rgba(94,125,151,0.2)",
    borderRadius: "12px",
    background:
      "linear-gradient(145deg, rgba(18,34,49,0.85), rgba(8,18,29,0.9))",
    boxShadow:
      "0 12px 30px rgba(0,0,0,0.15)",
  },

  networkDot: {
    width: "8px",
    height: "8px",
    flexShrink: 0,
    borderRadius: "50%",
    background: "#00d2ff",
    boxShadow:
      "0 0 12px rgba(0,210,255,0.9)",
  },

  networkLabel: {
    display: "block",
    marginBottom: "2px",
    color: "#4f667b",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  networkName: {
    color: "#dce8f2",
    fontSize: "11px",
    fontWeight: 700,
  },

  /* =====================================================
     HERO
  ===================================================== */

  heroCard: {
    position: "relative",
    overflow: "hidden",
    minHeight: "225px",
    marginBottom: "16px",
    padding: "30px",
    border:
      "1px solid rgba(57,104,128,0.42)",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, #0d2232 0%, #091722 45%, #07111c 100%)",
    boxShadow:
      "0 24px 60px rgba(0,0,0,0.24)",
  },

  heroGlowOne: {
    position: "absolute",
    top: "-130px",
    right: "-80px",
    width: "350px",
    height: "350px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(0,210,255,0.18) 0%, rgba(0,210,255,0) 68%)",
    pointerEvents: "none",
  },

  heroGlowTwo: {
    position: "absolute",
    bottom: "-180px",
    left: "25%",
    width: "420px",
    height: "300px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(0,120,255,0.10) 0%, rgba(0,120,255,0) 70%)",
    pointerEvents: "none",
  },

  heroContent: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  heroLabel: {
    marginBottom: "10px",
    color: "#6f879c",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "1.8px",
  },

  heroBalance: {
    color: "#f7fbff",
    fontSize: "42px",
    fontWeight: 800,
    lineHeight: 1,
    letterSpacing: "-2px",
    textShadow:
      "0 0 35px rgba(0,210,255,0.12)",
  },

  heroCurrency: {
    marginLeft: "9px",
    color: "#00d2ff",
    fontSize: "17px",
    fontWeight: 800,
    letterSpacing: "0",
  },

  heroMeta: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    marginTop: "13px",
    color: "#60798f",
    fontSize: "10px",
  },

  heroStatus: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#6bd4c8",
    fontWeight: 700,
  },

  statusDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#56d8c7",
    boxShadow:
      "0 0 8px rgba(86,216,199,0.8)",
  },

  heroSeparator: {
    color: "#30475a",
  },

  heroSymbol: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "76px",
    height: "76px",
    border:
      "1px solid rgba(0,210,255,0.24)",
    borderRadius: "22px",
    background:
      "linear-gradient(145deg, rgba(0,210,255,0.13), rgba(0,80,120,0.08))",
    color: "#00d2ff",
    fontSize: "36px",
    fontWeight: 700,
    boxShadow:
      "inset 0 0 30px rgba(0,210,255,0.04), 0 0 35px rgba(0,210,255,0.05)",
  },

  heroBottom: {
    position: "absolute",
    right: "30px",
    bottom: "24px",
    left: "30px",
    zIndex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: "16px",
    borderTop:
      "1px solid rgba(99,133,158,0.15)",
  },

  heroBottomLabel: {
    display: "block",
    marginBottom: "5px",
    color: "#526a80",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "1.2px",
  },

  heroWalletName: {
    color: "#dbe7f0",
    fontSize: "12px",
    fontWeight: 700,
  },

  heroAddress: {
    color: "#6f879b",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "10px",
  },

  /* =====================================================
     METRICS
  ===================================================== */

  metricsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: "14px",
    marginBottom: "42px",
  },

  metricCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "17px",
    border:
      "1px solid rgba(70,96,119,0.22)",
    borderRadius: "13px",
    background:
      "linear-gradient(145deg, #0b1927, #08131f)",
  },

  metricIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "38px",
    height: "38px",
    flexShrink: 0,
    border:
      "1px solid rgba(0,210,255,0.14)",
    borderRadius: "11px",
    background:
      "linear-gradient(145deg, #102b3e, #0b1b29)",
    color: "#00d2ff",
    fontSize: "15px",
    fontWeight: 800,
  },

  metricLabel: {
    display: "block",
    marginBottom: "4px",
    color: "#566e84",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  metricValue: {
    display: "block",
    color: "#edf5fb",
    fontSize: "18px",
    fontWeight: 750,
  },

  metricNetworkValue: {
    display: "block",
    color: "#edf5fb",
    fontSize: "13px",
    fontWeight: 700,
  },

  metricStatusValue: {
    display: "block",
    color: "#65d6c7",
    fontSize: "14px",
    fontWeight: 750,
  },

  metricHint: {
    display: "block",
    marginTop: "3px",
    color: "#455c71",
    fontSize: "9px",
  },

  /* =====================================================
     SECTIONS
  ===================================================== */

  section: {
    marginBottom: "42px",
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "17px",
  },

  sectionEyebrow: {
    display: "block",
    marginBottom: "5px",
    color: "#4f7188",
    fontSize: "8px",
    fontWeight: 900,
    letterSpacing: "1.5px",
  },

  sectionTitle: {
    margin: 0,
    color: "#edf4fa",
    fontSize: "20px",
    fontWeight: 750,
    letterSpacing: "-0.4px",
  },

  sectionDescription: {
    margin: "5px 0 0",
    color: "#61788d",
    fontSize: "11px",
    lineHeight: 1.6,
  },

  secureBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 10px",
    border:
      "1px solid rgba(77,182,165,0.2)",
    borderRadius: "7px",
    background:
      "rgba(14,45,42,0.55)",
    color: "#61cabb",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "0.7px",
  },

  secureIcon: {
    fontSize: "10px",
  },

  /* =====================================================
     CONNECTED WALLET
  ===================================================== */

  connectedWalletCard: {
    position: "relative",
    overflow: "hidden",
    minHeight: "265px",
    padding: "26px",
    border:
      "1px solid rgba(0,210,255,0.22)",
    borderRadius: "20px",
    background:
      "linear-gradient(135deg, #0c2333 0%, #091923 45%, #06111b 100%)",
    boxShadow:
      "0 24px 60px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.025)",
  },

  connectedGlowOne: {
    position: "absolute",
    top: "-150px",
    right: "-70px",
    width: "390px",
    height: "390px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(0,210,255,0.18) 0%, rgba(0,210,255,0.06) 35%, transparent 70%)",
    pointerEvents: "none",
  },

  connectedGlowTwo: {
    position: "absolute",
    bottom: "-180px",
    left: "18%",
    width: "400px",
    height: "300px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(0,110,255,0.12), transparent 70%)",
    pointerEvents: "none",
  },

  connectedTop: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "25px",
  },

  connectedIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },

  walletOrb: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "58px",
    height: "58px",
    flexShrink: 0,
    border:
      "1px solid rgba(0,210,255,0.32)",
    borderRadius: "17px",
    background:
      "linear-gradient(145deg, rgba(0,210,255,0.16), rgba(0,75,110,0.12))",
    color: "#00d2ff",
    fontSize: "28px",
    fontWeight: 700,
    boxShadow:
      "0 0 30px rgba(0,210,255,0.10), inset 0 0 20px rgba(0,210,255,0.04)",
  },

  connectedEyebrow: {
    display: "block",
    marginBottom: "6px",
    color: "#4f748b",
    fontSize: "8px",
    fontWeight: 900,
    letterSpacing: "1.5px",
  },

  connectedWalletTitle: {
    margin: 0,
    color: "#f0f8fd",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "18px",
    fontWeight: 700,
    letterSpacing: "-0.5px",
  },

  connectedStatus: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "7px",
    color: "#62cdbd",
    fontSize: "9px",
    fontWeight: 700,
  },

  connectedStatusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#56d8c7",
    boxShadow:
      "0 0 10px rgba(86,216,199,0.85)",
  },

  connectedNetwork: {
    minWidth: "150px",
    padding: "11px 13px",
    border:
      "1px solid rgba(82,116,139,0.2)",
    borderRadius: "11px",
    background:
      "rgba(4,14,23,0.42)",
    textAlign: "right",
    color: "#dce8f1",
    fontSize: "11px",
  },

  connectedNetworkLabel: {
    display: "block",
    marginBottom: "4px",
    color: "#486277",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "1.1px",
  },

  connectedChain: {
    display: "block",
    marginTop: "4px",
    color: "#526b80",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "8px",
  },

  connectedDivider: {
    position: "relative",
    zIndex: 1,
    height: "1px",
    margin: "24px 0 20px",
    background:
      "linear-gradient(90deg, rgba(0,210,255,0.22), rgba(70,96,119,0.15), transparent)",
  },

  connectedStats: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gridTemplateColumns:
      "0.75fr 1.5fr auto",
    alignItems: "center",
    gap: "22px",
  },

  connectedStat: {
    minWidth: 0,
  },

  connectedStatLabel: {
    display: "block",
    marginBottom: "8px",
    color: "#4d687e",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "1.1px",
  },

  connectedBalance: {
    display: "flex",
    alignItems: "baseline",
    gap: "7px",
  },

  connectedBalanceStrong: {
    color: "#f2f8fc",
    fontSize: "21px",
    fontWeight: 800,
  },

  connectedFullAddress: {
    margin: 0,
    overflow: "hidden",
    color: "#9eb1c1",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "9px",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  connectedCopyButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    minWidth: "125px",
    padding: "11px 14px",
    border:
      "1px solid rgba(0,210,255,0.28)",
    borderRadius: "9px",
    background:
      "linear-gradient(135deg, rgba(0,210,255,0.13), rgba(0,75,110,0.16))",
    color: "#00d2ff",
    cursor: "pointer",
    fontSize: "9px",
    fontWeight: 800,
    boxShadow:
      "0 8px 20px rgba(0,0,0,0.15)",
  },

  copyIcon: {
    fontSize: "12px",
  },

  connectedFooter: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginTop: "22px",
    paddingTop: "15px",
    borderTop:
      "1px solid rgba(70,96,119,0.13)",
  },

  connectedSecurity: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
  },

  securityShield: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "25px",
    height: "25px",
    border:
      "1px solid rgba(77,182,165,0.2)",
    borderRadius: "7px",
    background:
      "rgba(14,45,42,0.45)",
    color: "#62cdbd",
    fontSize: "11px",
  },

  securityTitle: {
    display: "block",
    color: "#6ccbbc",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "0.9px",
  },

  securityDescription: {
    display: "block",
    marginTop: "3px",
    color: "#4e6679",
    fontSize: "8px",
  },

  connectedReady: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: "#557487",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "0.9px",
  },

  readyDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#55d4c2",
    boxShadow:
      "0 0 8px rgba(85,212,194,0.8)",
  },

  /* =====================================================
     WALLETS
  ===================================================== */

  walletGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, 1fr)",
    gap: "14px",
  },

  monitoredWallet: {
    position: "relative",
    overflow: "hidden",
    padding: "20px",
    border:
      "1px solid rgba(70,96,119,0.24)",
    borderRadius: "15px",
    background:
      "linear-gradient(145deg, #0b1927, #08131e)",
    boxShadow:
      "0 12px 35px rgba(0,0,0,0.13)",
  },

  activeWallet: {
    border:
      "1px solid rgba(0,210,255,0.42)",
    boxShadow:
      "0 0 35px rgba(0,210,255,0.05)",
  },

  activeGlow: {
    position: "absolute",
    top: "-80px",
    right: "-80px",
    width: "180px",
    height: "180px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(0,210,255,0.12), transparent 70%)",
    pointerEvents: "none",
  },

  walletHeader: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },

  walletIndex: {
    display: "block",
    marginBottom: "4px",
    color: "#3e596f",
    fontSize: "7px",
    fontWeight: 800,
    letterSpacing: "1.2px",
  },

  walletName: {
    margin: 0,
    color: "#e8f1f8",
    fontSize: "14px",
    fontWeight: 750,
  },

  address: {
    margin: "6px 0 0",
    color: "#61798e",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "9px",
  },

  activeBadge: {
    padding: "5px 8px",
    border:
      "1px solid rgba(0,210,255,0.3)",
    borderRadius: "6px",
    background:
      "rgba(0,210,255,0.08)",
    color: "#00d2ff",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "1px",
  },

  walletBalance: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "24px",
    paddingTop: "15px",
    borderTop:
      "1px solid rgba(70,96,119,0.16)",
  },

  balanceLabel: {
    display: "block",
    marginBottom: "5px",
    color: "#4f677c",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "0.8px",
  },

  walletBalanceValue: {
    color: "#dce8f1",
    fontSize: "15px",
    fontWeight: 750,
  },

  walletArrow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    border:
      "1px solid rgba(70,96,119,0.22)",
    borderRadius: "8px",
    color: "#00d2ff",
    fontSize: "13px",
  },

  empty: {
    padding: "50px 30px",
    border:
      "1px dashed rgba(70,96,119,0.4)",
    borderRadius: "15px",
    background:
      "linear-gradient(145deg, #091621, #07111b)",
    textAlign: "center",
  },

  emptyIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    margin: "0 auto 15px",
    border:
      "1px solid rgba(0,210,255,0.18)",
    borderRadius: "13px",
    background:
      "linear-gradient(145deg, #0e2738, #0a1a28)",
    color: "#00d2ff",
    fontSize: "17px",
    boxShadow:
      "0 0 25px rgba(0,210,255,0.06)",
  },

  emptyTitle: {
    margin: 0,
    color: "#dce8f0",
    fontSize: "15px",
    fontWeight: 700,
  },

  emptyText: {
    maxWidth: "400px",
    margin: "8px auto 0",
    color: "#61798d",
    fontSize: "10px",
    lineHeight: 1.7,
  },

  /* =====================================================
     ACTIVITY
  ===================================================== */

  liveBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 9px",
    border:
      "1px solid rgba(77,182,165,0.2)",
    borderRadius: "7px",
    background:
      "rgba(14,45,42,0.45)",
    color: "#63cdbd",
    fontSize: "8px",
    fontWeight: 900,
    letterSpacing: "0.8px",
  },

  liveDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#5dd4c3",
    boxShadow:
      "0 0 9px rgba(93,212,195,0.9)",
  },

  /* =====================================================
     LEGACY / COMPATIBILITY
  ===================================================== */

  walletCardWrapper: {
    padding: "1px",
    borderRadius: "15px",
    background:
      "linear-gradient(135deg, rgba(0,210,255,0.25), rgba(33,53,72,0.2), rgba(0,210,255,0.04))",
  },

  addressBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginTop: "12px",
    padding: "17px 18px",
    border:
      "1px solid rgba(70,96,119,0.22)",
    borderRadius: "12px",
    background: "#08141f",
  },

  addressContent: {
    minWidth: 0,
  },

  addressLabel: {
    display: "block",
    marginBottom: "6px",
    color: "#526a80",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  fullAddress: {
    margin: 0,
    color: "#aabac9",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: "10px",
    wordBreak: "break-all",
  },

  copyButton: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    flexShrink: 0,
    padding: "10px 14px",
    border:
      "1px solid rgba(0,210,255,0.25)",
    borderRadius: "8px",
    background:
      "linear-gradient(135deg, #0e2a3d, #0b1d2b)",
    color: "#00d2ff",
    cursor: "pointer",
    fontSize: "9px",
    fontWeight: 800,
  },

  countBadge: {
    padding: "7px 10px",
    border:
      "1px solid rgba(70,96,119,0.24)",
    borderRadius: "7px",
    background: "#0a1825",
    color: "#8ca0b3",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "0.7px",
  },
};

export default Dashboard;