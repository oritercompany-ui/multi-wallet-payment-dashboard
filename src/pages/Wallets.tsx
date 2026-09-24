import { useEffect, useMemo, useState } from "react";
import {
  BrowserProvider,
  formatEther,
  isAddress,
} from "ethers";

interface StoredWallet {
  id: string;
  name: string;
  address: string;
  balance: string;
  chainId: string;
  networkName: string;
}

interface WalletsProps {
  onActiveWalletChanged: (
    wallet: StoredWallet
  ) => void;
}

const STORAGE_KEY = "opay_wallets";
const ACTIVE_WALLET_KEY = "opay_active_wallet";

function Wallets({
  onActiveWalletChanged,
}: WalletsProps) {
  const [wallets, setWallets] = useState<StoredWallet[]>([]);
  const [activeWalletId, setActiveWalletId] =
    useState<string | null>(null);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshingId, setRefreshingId] =
    useState<string | null>(null);

  useEffect(() => {
    loadWallets();
  }, []);

  function loadWallets() {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY);

      const active =
        localStorage.getItem(
          ACTIVE_WALLET_KEY
        );

      if (saved) {
        const parsed: StoredWallet[] =
          JSON.parse(saved);

        setWallets(parsed);

        if (active) {
          setActiveWalletId(active);

          const selected =
            parsed.find(
              (wallet) =>
                wallet.id === active
            );

          if (selected) {
            onActiveWalletChanged(
              selected
            );
          }
        } else if (parsed.length > 0) {
          const firstWallet =
            parsed[0];

          setActiveWalletId(
            firstWallet.id
          );

          localStorage.setItem(
            ACTIVE_WALLET_KEY,
            firstWallet.id
          );

          onActiveWalletChanged(
            firstWallet
          );
        }
      }

      if (active) {
        setActiveWalletId(active);
      }
    } catch {
      setError(
        "Failed to load stored wallets."
      );
    }
  }

  function saveWallets(
    data: StoredWallet[]
  ) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );

    setWallets(data);
  }

  async function getNetworkData() {
    if (!window.ethereum) {
      throw new Error(
        "MetaMask is not installed."
      );
    }

    const provider =
      new BrowserProvider(
        window.ethereum
      );

    const network =
      await provider.getNetwork();

    return {
      chainId:
        network.chainId.toString(),
      networkName:
        getNetworkName(
          network.chainId.toString()
        ),
    };
  }

  async function getBalance(
    walletAddress: string
  ): Promise<string> {
    if (!window.ethereum) {
      return "0";
    }

    const provider =
      new BrowserProvider(
        window.ethereum
      );

    const balance =
      await provider.getBalance(
        walletAddress
      );

    return formatEther(balance);
  }

  async function handleAddWallet() {
    try {
      setError("");
      setSuccess("");

      if (!name.trim()) {
        throw new Error(
          "Enter a wallet name."
        );
      }

      if (!address.trim()) {
        throw new Error(
          "Enter a wallet address."
        );
      }

      if (!isAddress(address.trim())) {
        throw new Error(
          "Invalid wallet address."
        );
      }

      const normalizedAddress =
        address.trim();

      const alreadyExists =
        wallets.some(
          (wallet) =>
            wallet.address.toLowerCase() ===
            normalizedAddress.toLowerCase()
        );

      if (alreadyExists) {
        throw new Error(
          "This wallet address has already been added."
        );
      }

      setLoading(true);

      const balance =
        await getBalance(
          normalizedAddress
        );

      const network =
        await getNetworkData();

      const newWallet: StoredWallet = {
        id: crypto.randomUUID(),
        name: name.trim(),
        address: normalizedAddress,
        balance,
        chainId: network.chainId,
        networkName: network.networkName,
      };

      const updatedWallets = [
        ...wallets,
        newWallet,
      ];

      saveWallets(updatedWallets);

      // Wallet pertama otomatis menjadi active wallet
      if (wallets.length === 0) {
        setActiveWalletId(
          newWallet.id
        );

        localStorage.setItem(
          ACTIVE_WALLET_KEY,
          newWallet.id
        );

        onActiveWalletChanged(
          newWallet
        );
      }

      setName("");
      setAddress("");

      setSuccess(
        "Wallet added successfully."
      );
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Failed to add wallet."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh(
    walletId: string
  ) {
    try {
      setError("");
      setSuccess("");
      setRefreshingId(walletId);

      const wallet = wallets.find(
        (item) => item.id === walletId
      );

      if (!wallet) return;

      const balance =
        await getBalance(
          wallet.address
        );

      const network =
        await getNetworkData();

      const updatedWallets =
        wallets.map((item) =>
          item.id === walletId
            ? {
                ...item,
                balance,
                chainId: network.chainId,
                networkName:
                  network.networkName,
              }
            : item
        );

      saveWallets(updatedWallets);

      if (
        wallet.id === activeWalletId
      ) {
        const updatedActiveWallet =
          updatedWallets.find(
            (item) =>
              item.id ===
              activeWalletId
          );

        if (updatedActiveWallet) {
          onActiveWalletChanged(
            updatedActiveWallet
          );
        }
      }

      setSuccess(
        `${wallet.name} balance updated successfully.`
      );
    } catch {
      setError(
        "Failed to refresh wallet balance."
      );
    } finally {
      setRefreshingId(null);
    }
  }

  async function handleRefreshAll() {
    try {
      setError("");
      setSuccess("");
      setLoading(true);

      const network =
        await getNetworkData();

      const updatedWallets =
        await Promise.all(
          wallets.map(async (wallet) => {
            const balance =
              await getBalance(
                wallet.address
              );

            return {
              ...wallet,
              balance,
              chainId: network.chainId,
              networkName:
                network.networkName,
            };
          })
        );

      saveWallets(updatedWallets);

      if (activeWalletId) {
        const updatedActiveWallet =
          updatedWallets.find(
            (wallet) =>
              wallet.id ===
              activeWalletId
          );

        if (updatedActiveWallet) {
          onActiveWalletChanged(
            updatedActiveWallet
          );
        }
      }

      setSuccess(
        "All wallets have been refreshed."
      );
    } catch {
      setError(
        "Failed to refresh wallets."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSelectWallet(
    walletId: string
  ) {
    const selected = wallets.find(
      (wallet) =>
        wallet.id === walletId
    );

    if (!selected) {
      return;
    }

    setActiveWalletId(walletId);

    localStorage.setItem(
      ACTIVE_WALLET_KEY,
      walletId
    );

    onActiveWalletChanged(
      selected
    );

    setSuccess(
      `${selected.name} is now your active wallet.`
    );

    setError("");
  }

  function handleDelete(
    walletId: string
  ) {
    const wallet =
      wallets.find(
        (item) =>
          item.id === walletId
      );

    const updatedWallets =
      wallets.filter(
        (item) =>
          item.id !== walletId
      );

    saveWallets(updatedWallets);

    if (activeWalletId === walletId) {
      const nextWallet =
        updatedWallets[0];

      if (nextWallet) {
        setActiveWalletId(
          nextWallet.id
        );

        localStorage.setItem(
          ACTIVE_WALLET_KEY,
          nextWallet.id
        );

        onActiveWalletChanged(
          nextWallet
        );
      } else {
        setActiveWalletId(null);

        localStorage.removeItem(
          ACTIVE_WALLET_KEY
        );
      }
    }

    setSuccess(
      `${wallet?.name ?? "Wallet"} has been removed.`
    );
  }

  function shortenAddress(
    walletAddress: string
  ) {
    return `${walletAddress.slice(
      0,
      6
    )}...${walletAddress.slice(-4)}`;
  }

  function getNetworkName(
    chainId: string
  ) {
    switch (chainId) {
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
        return `Unknown (${chainId})`;
    }
  }

  const totalBalance =
    useMemo(() => {
      return wallets.reduce(
        (total, wallet) =>
          total +
          Number(wallet.balance || 0),
        0
      );
    }, [wallets]);

  const activeWallet =
    wallets.find(
      (wallet) =>
        wallet.id === activeWalletId
    );

  return (
    <section style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <div style={styles.eyebrow}>
            WALLET MANAGEMENT
          </div>

          <h1 style={styles.title}>
            Your Wallets
          </h1>

          <p style={styles.subtitle}>
            Monitor multiple EVM wallets,
            balances, and network activity
            from one secure workspace.
          </p>
        </div>

        <button
          style={{
            ...styles.refreshAllButton,
            ...(loading ||
            wallets.length === 0
              ? styles.buttonDisabled
              : {}),
          }}
          onClick={handleRefreshAll}
          disabled={
            loading ||
            wallets.length === 0
          }
        >
          <span style={styles.refreshIcon}>
            ↻
          </span>

          {loading
            ? "Refreshing..."
            : "Refresh All"}
        </button>
      </div>

      {/* STATUS */}
      {error && (
        <div style={styles.error}>
          <div style={styles.alertIcon}>
            !
          </div>

          <div>
            <strong style={styles.alertTitle}>
              Action failed
            </strong>

            <span style={styles.alertText}>
              {error}
            </span>
          </div>
        </div>
      )}

      {success && (
        <div style={styles.success}>
          <div style={styles.successIcon}>
            ✓
          </div>

          <div>
            <strong style={styles.alertTitle}>
              Operation completed
            </strong>

            <span style={styles.successText}>
              {success}
            </span>
          </div>
        </div>
      )}

      {/* OVERVIEW */}
      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statTop}>
            <span style={styles.statLabel}>
              MONITORED WALLETS
            </span>

            <div style={styles.statIcon}>
              ◈
            </div>
          </div>

          <strong style={styles.statValue}>
            {wallets.length}
          </strong>

          <span style={styles.statHint}>
            Public addresses tracked
          </span>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statTop}>
            <span style={styles.statLabel}>
              TOTAL BALANCE
            </span>

            <div style={styles.statIcon}>
              Ξ
            </div>
          </div>

          <strong style={styles.statValue}>
            {totalBalance.toFixed(6)}
          </strong>

          <span style={styles.statHint}>
            ETH across monitored wallets
          </span>
        </div>

        <div
          style={{
            ...styles.statCard,
            ...(activeWallet
              ? styles.activeStatCard
              : {}),
          }}
        >
          <div style={styles.statTop}>
            <span style={styles.statLabel}>
              ACTIVE WALLET
            </span>

            <div style={styles.liveDot}>
              <span />
            </div>
          </div>

          <strong
            style={{
              ...styles.statValue,
              fontSize: "18px",
            }}
          >
            {activeWallet
              ? activeWallet.name
              : "None selected"}
          </strong>

          <span style={styles.statHint}>
            {activeWallet
              ? shortenAddress(
                  activeWallet.address
                )
              : "Select a wallet to continue"}
          </span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={styles.mainGrid}>
        {/* ADD WALLET */}
        <div style={styles.addCard}>
          <div style={styles.cardAccent} />

          <div style={styles.cardHeader}>
            <div>
              <div style={styles.cardEyebrow}>
                WALLET REGISTRY
              </div>

              <h2 style={styles.cardTitle}>
                Add Wallet
              </h2>

              <p style={styles.cardDescription}>
                Add a public EVM address to
                monitor its balance and
                network status.
              </p>
            </div>

            <div style={styles.walletIconLarge}>
              ◇
            </div>
          </div>

          <label style={styles.label}>
            WALLET NAME
          </label>

          <input
            style={styles.input}
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="e.g. Treasury Wallet"
          />

          <label style={styles.label}>
            WALLET ADDRESS
          </label>

          <input
            style={{
              ...styles.input,
              fontFamily: "monospace",
            }}
            value={address}
            onChange={(e) =>
              setAddress(e.target.value)
            }
            placeholder="0x..."
          />

          <button
            style={{
              ...styles.addButton,
              ...(loading
                ? styles.buttonDisabled
                : {}),
            }}
            onClick={
              handleAddWallet
            }
            disabled={loading}
          >
            <span>
              {loading
                ? "Adding Wallet..."
                : "Add Wallet"}
            </span>

            {!loading && (
              <span style={styles.buttonArrow}>
                →
              </span>
            )}
          </button>

          <div style={styles.security}>
            <div style={styles.securityIcon}>
              ◈
            </div>

            <div>
              <strong style={styles.securityTitle}>
                NON-CUSTODIAL
              </strong>

              <p style={styles.securityText}>
                O-Pay only stores public wallet
                addresses. Private keys and
                seed phrases are never required.
              </p>
            </div>
          </div>
        </div>

        {/* WALLET LIST */}
        <div>
          <div style={styles.listHeader}>
            <div>
              <div style={styles.cardEyebrow}>
                PORTFOLIO
              </div>

              <h2 style={styles.sectionTitle}>
                Monitored Wallets
              </h2>

              <p style={styles.sectionDescription}>
                Your tracked wallet addresses
                and current balances.
              </p>
            </div>

            <span style={styles.walletCount}>
              {wallets.length}{" "}
              {wallets.length === 1
                ? "WALLET"
                : "WALLETS"}
            </span>
          </div>

          {wallets.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyGlow}>
                <div style={styles.emptyIcon}>
                  ◇
                </div>
              </div>

              <h3 style={styles.emptyTitle}>
                No wallets added
              </h3>

              <p style={styles.emptyText}>
                Add a public wallet address
                to start monitoring your
                Web3 portfolio.
              </p>
            </div>
          ) : (
            <div style={styles.walletList}>
              {wallets.map((wallet) => {
                const isActive =
                  wallet.id ===
                  activeWalletId;

                return (
                  <div
                    key={wallet.id}
                    style={{
                      ...styles.walletCard,
                      ...(isActive
                        ? styles.walletCardActive
                        : {}),
                    }}
                  >
                    {isActive && (
                      <div
                        style={
                          styles.activeLine
                        }
                      />
                    )}

                    <div
                      style={
                        styles.walletTop
                      }
                    >
                      <div
                        style={
                          styles.walletIdentity
                        }
                      >
                        <div
                          style={{
                            ...styles.walletAvatar,
                            ...(isActive
                              ? styles.walletAvatarActive
                              : {}),
                          }}
                        >
                          {wallet.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <div
                            style={
                              styles.nameRow
                            }
                          >
                            <h3
                              style={
                                styles.walletName
                              }
                            >
                              {wallet.name}
                            </h3>

                            {isActive && (
                              <span
                                style={
                                  styles.activeBadge
                                }
                              >
                                ACTIVE
                              </span>
                            )}
                          </div>

                          <p
                            style={
                              styles.address
                            }
                          >
                            {shortenAddress(
                              wallet.address
                            )}
                          </p>
                        </div>
                      </div>

                      <div
                        style={
                          styles.networkBlock
                        }
                      >
                        <span
                          style={
                            styles.networkDot
                          }
                        />

                        <div>
                          <span
                            style={
                              styles.networkLabel
                            }
                          >
                            NETWORK
                          </span>

                          <strong
                            style={
                              styles.network
                            }
                          >
                            {wallet.networkName}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div
                      style={
                        styles.balanceBox
                      }
                    >
                      <div>
                        <span
                          style={
                            styles.balanceLabel
                          }
                        >
                          CURRENT BALANCE
                        </span>

                        <strong
                          style={
                            styles.balance
                          }
                        >
                          {Number(
                            wallet.balance
                          ).toFixed(6)}{" "}
                          <span
                            style={
                              styles.balanceAsset
                            }
                          >
                            ETH
                          </span>
                        </strong>
                      </div>

                      <div
                        style={
                          styles.chainInfo
                        }
                      >
                        <span>
                          CHAIN ID
                        </span>

                        <strong>
                          {wallet.chainId}
                        </strong>
                      </div>
                    </div>

                    <div
                      style={
                        styles.walletActions
                      }
                    >
                      {!isActive && (
                        <button
                          style={
                            styles.selectButton
                          }
                          onClick={() =>
                            handleSelectWallet(
                              wallet.id
                            )
                          }
                        >
                          Set Active
                          <span>
                            →
                          </span>
                        </button>
                      )}

                      <button
                        style={
                          styles.refreshButton
                        }
                        onClick={() =>
                          handleRefresh(
                            wallet.id
                          )
                        }
                        disabled={
                          refreshingId ===
                          wallet.id
                        }
                      >
                        <span>
                          ↻
                        </span>

                        {refreshingId ===
                        wallet.id
                          ? "Refreshing..."
                          : "Refresh"}
                      </button>

                      <button
                        style={
                          styles.deleteButton
                        }
                        onClick={() =>
                          handleDelete(
                            wallet.id
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER SECURITY */}
      <div style={styles.footerSecurity}>
        <div style={styles.footerSecurityIcon}>
          ✓
        </div>

        <div>
          <strong
            style={
              styles.footerSecurityTitle
            }
          >
            SECURE WALLET MONITORING
          </strong>

          <p
            style={
              styles.footerSecurityText
            }
          >
            Wallets are monitored using
            public blockchain data. O-Pay
            never requests custody of your
            assets or access to your private
            keys.
          </p>
        </div>

        <div style={styles.footerStatus}>
          <span />
          NON-CUSTODIAL
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
    color: "#ffffff",
    fontSize: "32px",
    fontWeight: 750,
    letterSpacing: "-0.8px",
  },

  subtitle: {
    maxWidth: "650px",
    margin: "9px 0 0",
    color: "#71849a",
    fontSize: "13px",
    lineHeight: 1.7,
  },

  refreshAllButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "11px 16px",
    border: "1px solid #26394d",
    borderRadius: "10px",
    background:
      "linear-gradient(180deg, #102238 0%, #0b1929 100%)",
    color: "#b9c9d9",
    fontSize: "12px",
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    boxShadow:
      "0 8px 24px rgba(0,0,0,0.14)",
  },

  refreshIcon: {
    color: "#00d2ff",
    fontSize: "16px",
    lineHeight: 1,
  },

  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  error: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
    padding: "13px 15px",
    border:
      "1px solid rgba(255, 100, 120, 0.22)",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg, rgba(60,20,29,0.9), rgba(35,18,25,0.9))",
    color: "#ff9ca8",
  },

  success: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
    padding: "13px 15px",
    border:
      "1px solid rgba(101, 230, 177, 0.2)",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg, rgba(16,38,31,0.95), rgba(13,30,27,0.95))",
    color: "#65e6b1",
  },

  alertIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "#51252e",
    color: "#ff9ca8",
    fontWeight: 900,
    flexShrink: 0,
  },

  successIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    background: "#164235",
    color: "#65e6b1",
    fontWeight: 900,
    flexShrink: 0,
  },

  alertTitle: {
    display: "block",
    marginBottom: "2px",
    color: "inherit",
    fontSize: "11px",
    letterSpacing: "0.4px",
  },

  alertText: {
    display: "block",
    fontSize: "12px",
    opacity: 0.85,
  },

  successText: {
    display: "block",
    fontSize: "12px",
    opacity: 0.85,
  },

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, minmax(0, 1fr))",
    gap: "14px",
    marginBottom: "30px",
  },

  statCard: {
    position: "relative",
    overflow: "hidden",
    minHeight: "122px",
    padding: "19px 20px",
    border:
      "1px solid rgba(32, 52, 72, 0.9)",
    borderRadius: "15px",
    background:
      "linear-gradient(145deg, #0b1928 0%, #08131f 100%)",
    boxShadow:
      "0 12px 35px rgba(0,0,0,0.12)",
  },

  activeStatCard: {
    border:
      "1px solid rgba(0, 210, 255, 0.22)",
  },

  statTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "13px",
  },

  statLabel: {
    color: "#71849a",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "1.2px",
  },

  statIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "27px",
    height: "27px",
    borderRadius: "8px",
    background: "#10253a",
    color: "#00d2ff",
    fontSize: "14px",
    fontWeight: 800,
  },

  liveDot: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "27px",
    height: "27px",
    borderRadius: "8px",
    background: "#102d27",
  },

  statValue: {
    display: "block",
    color: "#f4f8fb",
    fontSize: "25px",
    fontWeight: 700,
    letterSpacing: "-0.5px",
  },

  statHint: {
    display: "block",
    marginTop: "7px",
    color: "#52677c",
    fontSize: "10px",
  },

  liveDotSpan: {},

  mainGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(290px, 360px) minmax(0, 1fr)",
    gap: "26px",
    alignItems: "start",
  },

  addCard: {
    position: "relative",
    overflow: "hidden",
    padding: "24px",
    border:
      "1px solid rgba(32, 52, 72, 0.95)",
    borderRadius: "17px",
    background:
      "linear-gradient(145deg, #0b1928 0%, #08131f 100%)",
    boxShadow:
      "0 18px 45px rgba(0,0,0,0.14)",
  },

  cardAccent: {
    position: "absolute",
    top: 0,
    left: "22px",
    right: "22px",
    height: "1px",
    background:
      "linear-gradient(90deg, transparent, #00d2ff, transparent)",
    opacity: 0.7,
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
    marginBottom: "25px",
  },

  cardEyebrow: {
    marginBottom: "6px",
    color: "#00a9d0",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "1.4px",
  },

  cardTitle: {
    margin: 0,
    color: "#f4f8fb",
    fontSize: "19px",
    fontWeight: 700,
    letterSpacing: "-0.3px",
  },

  cardDescription: {
    maxWidth: "280px",
    margin: "7px 0 0",
    color: "#63778c",
    fontSize: "11px",
    lineHeight: 1.7,
  },

  walletIconLarge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    border:
      "1px solid rgba(0, 210, 255, 0.15)",
    borderRadius: "11px",
    background: "#0d2335",
    color: "#00d2ff",
    fontSize: "19px",
    flexShrink: 0,
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#8195aa",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    marginBottom: "17px",
    padding: "12px 13px",
    border:
      "1px solid rgba(38, 57, 77, 0.95)",
    borderRadius: "9px",
    outline: "none",
    background: "#07111d",
    color: "#f4f8fb",
    fontSize: "12px",
    transition: "border 0.2s ease",
  },

  addButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "12px 14px",
    border: "none",
    borderRadius: "9px",
    background:
      "linear-gradient(135deg, #00d2ff 0%, #00b7df 100%)",
    color: "#031018",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow:
      "0 8px 24px rgba(0, 210, 255, 0.16)",
  },

  buttonArrow: {
    fontSize: "16px",
  },

  security: {
    display: "flex",
    gap: "10px",
    marginTop: "18px",
    padding: "13px",
    border:
      "1px solid rgba(38, 57, 77, 0.65)",
    borderRadius: "10px",
    background:
      "rgba(7, 17, 29, 0.75)",
  },

  securityIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "25px",
    height: "25px",
    borderRadius: "7px",
    background: "#10283b",
    color: "#00d2ff",
    fontSize: "11px",
    flexShrink: 0,
  },

  securityTitle: {
    display: "block",
    marginBottom: "3px",
    color: "#9dafc2",
    fontSize: "9px",
    letterSpacing: "0.8px",
  },

  securityText: {
    margin: 0,
    color: "#566b80",
    fontSize: "10px",
    lineHeight: 1.6,
  },

  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    marginBottom: "15px",
  },

  sectionTitle: {
    margin: 0,
    color: "#f4f8fb",
    fontSize: "20px",
    fontWeight: 700,
    letterSpacing: "-0.3px",
  },

  sectionDescription: {
    margin: "6px 0 0",
    color: "#5f7388",
    fontSize: "11px",
  },

  walletCount: {
    padding: "6px 9px",
    border:
      "1px solid rgba(38, 57, 77, 0.8)",
    borderRadius: "7px",
    background: "#0c1a29",
    color: "#71849a",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "0.8px",
    whiteSpace: "nowrap",
  },

  walletList: {
    display: "grid",
    gap: "12px",
  },

  walletCard: {
    position: "relative",
    overflow: "hidden",
    padding: "18px",
    border:
      "1px solid rgba(32, 52, 72, 0.9)",
    borderRadius: "15px",
    background:
      "linear-gradient(145deg, #0a1725 0%, #08131f 100%)",
    transition:
      "border-color 0.2s ease, transform 0.2s ease",
  },

  walletCardActive: {
    border:
      "1px solid rgba(0, 210, 255, 0.34)",
    boxShadow:
      "0 12px 38px rgba(0, 210, 255, 0.06)",
  },

  activeLine: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "3px",
    height: "100%",
    background: "#00d2ff",
    boxShadow:
      "0 0 18px rgba(0, 210, 255, 0.5)",
  },

  walletTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "20px",
  },

  walletIdentity: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },

  walletAvatar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "38px",
    height: "38px",
    border:
      "1px solid rgba(38, 57, 77, 0.9)",
    borderRadius: "11px",
    background: "#102033",
    color: "#9dafc2",
    fontSize: "13px",
    fontWeight: 800,
    flexShrink: 0,
  },

  walletAvatarActive: {
    border:
      "1px solid rgba(0, 210, 255, 0.25)",
    background: "#0c2939",
    color: "#00d2ff",
  },

  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    minWidth: 0,
  },

  walletName: {
    margin: 0,
    color: "#eaf1f6",
    fontSize: "14px",
    fontWeight: 700,
  },

  activeBadge: {
    padding: "3px 6px",
    border:
      "1px solid rgba(0, 210, 255, 0.16)",
    borderRadius: "5px",
    background: "#0d2938",
    color: "#00d2ff",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "0.8px",
  },

  address: {
    margin: "5px 0 0",
    color: "#52677c",
    fontSize: "10px",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },

  networkBlock: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 9px",
    border:
      "1px solid rgba(38, 57, 77, 0.65)",
    borderRadius: "8px",
    background: "#0c1a28",
    flexShrink: 0,
  },

  networkDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#65e6b1",
    boxShadow:
      "0 0 9px rgba(101, 230, 177, 0.6)",
  },

  networkLabel: {
    display: "block",
    marginBottom: "2px",
    color: "#52677c",
    fontSize: "7px",
    fontWeight: 800,
    letterSpacing: "0.8px",
  },

  network: {
    display: "block",
    color: "#a7b9ca",
    fontSize: "9px",
    fontWeight: 700,
  },

  balanceBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginTop: "17px",
    padding: "13px 14px",
    border:
      "1px solid rgba(29, 48, 66, 0.65)",
    borderRadius: "10px",
    background: "#07111d",
  },

  balanceLabel: {
    display: "block",
    marginBottom: "4px",
    color: "#52677c",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "0.9px",
  },

  balance: {
    display: "block",
    color: "#f4f8fb",
    fontSize: "17px",
    fontWeight: 700,
    letterSpacing: "-0.3px",
  },

  balanceAsset: {
    color: "#00d2ff",
    fontSize: "10px",
    fontWeight: 800,
  },

  chainInfo: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "4px",
    color: "#52677c",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "0.6px",
  },

  walletActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "7px",
    marginTop: "12px",
  },

  selectButton: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 11px",
    border: "none",
    borderRadius: "7px",
    background:
      "linear-gradient(135deg, #00d2ff 0%, #00b7df 100%)",
    color: "#031018",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: 800,
  },

  refreshButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 11px",
    border:
      "1px solid rgba(38, 57, 77, 0.9)",
    borderRadius: "7px",
    background: "#0c1a28",
    color: "#9dafc2",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: 700,
  },

  deleteButton: {
    padding: "8px 11px",
    border:
      "1px solid rgba(91, 41, 48, 0.65)",
    borderRadius: "7px",
    background: "transparent",
    color: "#d9828d",
    cursor: "pointer",
    fontSize: "10px",
    fontWeight: 700,
  },

  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "270px",
    padding: "35px 20px",
    border:
      "1px dashed rgba(38, 57, 77, 0.95)",
    borderRadius: "15px",
    background:
      "linear-gradient(145deg, rgba(10,23,37,0.5), rgba(7,17,29,0.35))",
    textAlign: "center",
  },

  emptyGlow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "62px",
    height: "62px",
    border:
      "1px solid rgba(0, 210, 255, 0.15)",
    borderRadius: "18px",
    background:
      "radial-gradient(circle, rgba(0,210,255,0.12), rgba(0,210,255,0.02) 65%)",
    boxShadow:
      "0 0 35px rgba(0,210,255,0.06)",
  },

  emptyIcon: {
    color: "#00d2ff",
    fontSize: "27px",
  },

  emptyTitle: {
    margin: "16px 0 6px",
    color: "#dce7ef",
    fontSize: "15px",
    fontWeight: 700,
  },

  emptyText: {
    maxWidth: "300px",
    margin: 0,
    color: "#52677c",
    fontSize: "11px",
    lineHeight: 1.7,
  },

  footerSecurity: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    marginTop: "22px",
    padding: "15px 17px",
    border:
      "1px solid rgba(32, 52, 72, 0.8)",
    borderRadius: "13px",
    background:
      "linear-gradient(135deg, rgba(10,24,38,0.9), rgba(7,17,29,0.9))",
  },

  footerSecurityIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "31px",
    height: "31px",
    borderRadius: "9px",
    background: "#102d27",
    color: "#65e6b1",
    fontSize: "13px",
    fontWeight: 900,
    flexShrink: 0,
  },

  footerSecurityTitle: {
    display: "block",
    marginBottom: "3px",
    color: "#9dafc2",
    fontSize: "9px",
    letterSpacing: "0.9px",
  },

  footerSecurityText: {
    maxWidth: "700px",
    margin: 0,
    color: "#53687c",
    fontSize: "10px",
    lineHeight: 1.6,
  },

  footerStatus: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    marginLeft: "auto",
    padding: "6px 9px",
    border:
      "1px solid rgba(101, 230, 177, 0.15)",
    borderRadius: "7px",
    background: "#0d211d",
    color: "#65e6b1",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "0.7px",
    whiteSpace: "nowrap",
  },
};

export default Wallets;