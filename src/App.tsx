import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Payments from "./pages/Payments";
import PaymentRequest from "./pages/PaymentRequest";
import Invoices from "./pages/Invoices";
import PaymentPage from "./pages/Paymentpage";
import Wallets from "./pages/Wallets";
import Networks from "./pages/Networks";
import Tokens from "./pages/Tokens";
import History from "./pages/History";

import {
  connectWallet,
  sendPayment,
  type WalletData,
} from "./utils/ethereum";

import {
  getTransactions,
  type TransactionData,
} from "./utils/transactions";

import {
  saveTransactionHistory,
} from "./utils/transactionHistory";

type Tab =
  | "dashboard"
  | "payments"
  | "payment-request"
  | "invoices"
  | "wallets"
  | "networks"
  | "tokens"
  | "history";

interface ActiveWalletData {
  id: string;
  name: string;
  address: string;
  balance: string;
  chainId: string;
  networkName: string;
}

const ACTIVE_WALLET_KEY =
  "opay_active_wallet";

const STORED_WALLETS_KEY =
  "opay_wallets";

function App() {
  const [wallet, setWallet] =
    useState<WalletData | null>(null);

  const [activeWallet, setActiveWallet] =
    useState<ActiveWalletData | null>(null);

  const [transactions, setTransactions] =
    useState<TransactionData[]>([]);

  const [activeTab, setActiveTab] =
    useState<Tab>("dashboard");

  const [loading, setLoading] =
    useState(false);

  const [loadingTransactions, setLoadingTransactions] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  const [recipient, setRecipient] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
   * Payment Link
   *
   * Jika URL berbentuk:
   *
   * /pay/:invoiceId
   *
   * maka aplikasi akan menampilkan
   * halaman payment tanpa meminta user
   * connect wallet terlebih dahulu.
   */
  const paymentPath =
    window.location.pathname;

  const paymentMatch =
    paymentPath.match(
      /^\/pay\/([^/]+)\/?$/
    );

  const paymentInvoiceId =
    paymentMatch
      ? decodeURIComponent(
          paymentMatch[1]
        )
      : null;

  if (paymentInvoiceId) {
    return (
      <PaymentPage
        invoiceId={paymentInvoiceId}
      />
    );
  }

  function loadActiveWallet(
    connectedWallet: WalletData
  ) {
    try {
      const saved =
        localStorage.getItem(
          STORED_WALLETS_KEY
        );

      const activeId =
        localStorage.getItem(
          ACTIVE_WALLET_KEY
        );

      if (!saved || !activeId) {
        setActiveWallet({
          id: "connected-wallet",
          name: "Connected Wallet",
          address:
            connectedWallet.address,
          balance:
            connectedWallet.balance,
          chainId:
            connectedWallet.chainId,
          networkName:
            connectedWallet.networkName,
        });

        return;
      }

      const wallets: ActiveWalletData[] =
        JSON.parse(saved);

      const selected =
        wallets.find(
          (item) =>
            item.id === activeId
        );

      if (!selected) {
        setActiveWallet({
          id: "connected-wallet",
          name: "Connected Wallet",
          address:
            connectedWallet.address,
          balance:
            connectedWallet.balance,
          chainId:
            connectedWallet.chainId,
          networkName:
            connectedWallet.networkName,
        });

        return;
      }

      setActiveWallet(selected);
    } catch {
      setActiveWallet({
        id: "connected-wallet",
        name: "Connected Wallet",
        address:
          connectedWallet.address,
        balance:
          connectedWallet.balance,
        chainId:
          connectedWallet.chainId,
        networkName:
          connectedWallet.networkName,
      });
    }
  }

  async function loadTransactions(
    address: string
  ) {
    try {
      setLoadingTransactions(true);
      setError("");

      const data =
        await getTransactions(address);

      setTransactions(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Failed to retrieve transaction history."
        );
      }
    } finally {
      setLoadingTransactions(false);
    }
  }

  async function handleConnectWallet() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const walletData =
        await connectWallet();

      setWallet(walletData);

      loadActiveWallet(walletData);

      await loadTransactions(
        walletData.address
      );
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Failed to connect wallet."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleDisconnect() {
    setWallet(null);
    setActiveWallet(null);
    setTransactions([]);
    setActiveTab("dashboard");
    setError("");
    setSuccess("");
    setRecipient("");
    setAmount("");
  }

  function handleActiveWalletChanged(
    selectedWallet: ActiveWalletData
  ) {
    setActiveWallet(selectedWallet);

    setSuccess(
      `${selectedWallet.name} is now the active wallet.`
    );

    setError("");

    /*
     * Active wallet di sini adalah wallet
     * yang dipilih di O-Pay.
     *
     * MetaMask tetap mengontrol account
     * yang menjadi signer transaksi.
     */
    if (
      wallet &&
      selectedWallet.address.toLowerCase() !==
        wallet.address.toLowerCase()
    ) {
      setError(
        "The active wallet differs from the wallet currently connected in MetaMask. Use that account in MetaMask to send transactions."
      );
    }
  }

  async function handleSendPayment() {
    try {
      setSending(true);
      setError("");
      setSuccess("");

      if (!recipient.trim()) {
        throw new Error(
          "Enter the recipient wallet address."
        );
      }

      if (!amount.trim()) {
        throw new Error(
          "Enter the ETH amount."
        );
      }

      /*
       * Transaksi selalu menggunakan signer
       * dari MetaMask.
       */
      const result =
        await sendPayment(
          recipient.trim(),
          amount.trim()
        );

      // Simpan transaksi ETH ke local history
      if (wallet) {
        saveTransactionHistory(
          wallet.address,
          {
            hash: result.hash,
            type: "ETH",
            asset: "ETH",
            amount:
              amount.trim(),
            recipient:
              recipient.trim(),
            timestamp:
              Date.now(),
            status:
              "confirmed",
            chainId:
              wallet.chainId,
          }
        );
      }

      setSuccess(
        `Transaction submitted successfully. Hash: ${result.hash}`
      );

      setRecipient("");
      setAmount("");

      if (wallet) {
        await loadTransactions(
          wallet.address
        );
      }
    } catch (err: any) {
      /*
       * Jika transaksi sudah masuk blockchain
       * tetapi gagal / revert, sendPayment()
       * akan mengembalikan transactionHash.
       *
       * Kalau user hanya cancel di MetaMask,
       * transactionHash tidak ada sehingga
       * tidak disimpan sebagai failed transaction.
       */
      const transactionHash =
        err?.transactionHash;

      if (
        wallet &&
        transactionHash &&
        recipient.trim() &&
        amount.trim()
      ) {
        saveTransactionHistory(
          wallet.address,
          {
            hash:
              transactionHash,
            type: "ETH",
            asset: "ETH",
            amount:
              amount.trim(),
            recipient:
              recipient.trim(),
            timestamp:
              Date.now(),
            status:
              "failed",
            chainId:
              wallet.chainId,
          }
        );
      }

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Transaction failed."
        );
      }
    } finally {
      setSending(false);
    }
  }

  async function handleRefresh() {
    if (!wallet) return;

    await loadTransactions(
      wallet.address
    );
  }

  async function handleCopyAddress() {
    if (!wallet) return;

    try {
      await navigator.clipboard.writeText(
        wallet.address
      );

      setSuccess(
        "Wallet address copied successfully."
      );

      setError("");
    } catch {
      setError(
        "Failed to copy wallet address."
      );

      setSuccess("");
    }
  }

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    function handleAccountsChanged(
      accounts: string[]
    ) {
      if (accounts.length === 0) {
        handleDisconnect();
      } else {
        handleConnectWallet();
      }
    }

    function handleChainChanged() {
      handleConnectWallet();
    }

    window.ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );

    window.ethereum.on(
      "chainChanged",
      handleChainChanged
    );

    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );

      window.ethereum.removeListener(
        "chainChanged",
        handleChainChanged
      );
    };
  }, []);

  return (
    <div style={styles.app}>
      {/* Ambient Background */}

      <div style={styles.backgroundGlowOne} />
      <div style={styles.backgroundGlowTwo} />

      <Navbar
        wallet={wallet}
        onDisconnect={handleDisconnect}
      />

      {!wallet ? (
        <main style={styles.main}>
          <section style={styles.loginHero}>
            <div style={styles.loginOrb}>
              <div style={styles.loginOrbInner}>
                Ξ
              </div>
            </div>

            <div style={styles.loginEyebrow}>
              O-PAY / WEB3 PAYMENTS
            </div>

            <h2 style={styles.heroTitle}>
              Your
              <span style={styles.heroAccent}>
                {" "}Web3
              </span>
              <br />
              Financial Command Center
            </h2>

            <p style={styles.heroText}>
              Manage wallets, monitor blockchain
              activity, and process decentralized
              payments through one secure interface.
            </p>

            <button
              style={{
                ...styles.connectButton,
                ...(loading
                  ? styles.connectButtonLoading
                  : {}),
              }}
              onClick={
                handleConnectWallet
              }
              disabled={loading}
            >
              <span style={styles.connectIcon}>
                ◈
              </span>

              {loading
                ? "Connecting Wallet..."
                : "Connect Wallet"}

              {!loading && (
                <span style={styles.buttonArrow}>
                  →
                </span>
              )}
            </button>

            <div style={styles.loginMeta}>
              <span>
                <span style={styles.metaDot} />
                Non-custodial
              </span>

              <span style={styles.metaDivider}>
                /
              </span>

              <span>
                Your keys, your assets
              </span>
            </div>

            {error && (
              <div
                style={
                  styles.loginError
                }
              >
                <span>
                  !
                </span>

                {error}
              </div>
            )}
          </section>

          <div style={styles.loginFooter}>
            <span>
              O-PAY
            </span>

            <span>
              WEB3 PAYMENT INFRASTRUCTURE
            </span>

            <span>
              {new Date().getFullYear()}
            </span>
          </div>
        </main>
      ) : (
        <div style={styles.layout}>
          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside style={styles.sidebar}>
            <div style={styles.sidebarBrand}>
              <div style={styles.sidebarLogo}>
                Ξ
              </div>

              <div>
                <strong
                  style={
                    styles.sidebarBrandName
                  }
                >
                  O-PAY
                </strong>

                <span
                  style={
                    styles.sidebarBrandSub
                  }
                >
                  WEB3 PAYMENTS
                </span>
              </div>
            </div>

            <div style={styles.sidebarDivider} />

            <div style={styles.navigationLabel}>
              MAIN MENU
            </div>

            <nav>
              <SidebarItem
                label="Dashboard"
                icon="⌂"
                active={
                  activeTab ===
                  "dashboard"
                }
                onClick={() =>
                  setActiveTab(
                    "dashboard"
                  )
                }
              />

              <SidebarItem
                label="Send Payment"
                icon="↗"
                active={
                  activeTab ===
                  "payments"
                }
                onClick={() =>
                  setActiveTab(
                    "payments"
                  )
                }
              />

              <SidebarItem
                label="Payment Request"
                icon="◇"
                active={
                  activeTab ===
                  "payment-request"
                }
                onClick={() =>
                  setActiveTab(
                    "payment-request"
                  )
                }
              />

              <SidebarItem
                label="Invoices"
                icon="▤"
                active={
                  activeTab ===
                  "invoices"
                }
                onClick={() =>
                  setActiveTab(
                    "invoices"
                  )
                }
              />
            </nav>

            <div
              style={
                styles.navigationLabelSecondary
              }
            >
              MANAGEMENT
            </div>

            <nav>
              <SidebarItem
                label="Wallets"
                icon="◈"
                active={
                  activeTab ===
                  "wallets"
                }
                onClick={() =>
                  setActiveTab(
                    "wallets"
                  )
                }
              />

              <SidebarItem
                label="Networks"
                icon="◎"
                active={
                  activeTab ===
                  "networks"
                }
                onClick={() =>
                  setActiveTab(
                    "networks"
                  )
                }
              />

              <SidebarItem
                label="Tokens"
                icon="◆"
                active={
                  activeTab ===
                  "tokens"
                }
                onClick={() =>
                  setActiveTab(
                    "tokens"
                  )
                }
              />

              <SidebarItem
                label="History"
                icon="↔"
                active={
                  activeTab ===
                  "history"
                }
                onClick={() =>
                  setActiveTab(
                    "history"
                  )
                }
              />
            </nav>

            {/* =================================================
                SIDEBAR CONNECTION STATUS
            ================================================= */}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                marginTop: "auto",
                paddingTop: "24px",
              }}
            >
              {/* CONNECTED NETWORK */}
              <div
                style={{
                  position: "relative",
                  overflow: "hidden",
                  padding: "14px 15px",
                  border:
                    "1px solid rgba(64,101,126,0.24)",
                  borderRadius: "14px",
                  background:
                    "linear-gradient(145deg, rgba(11,27,40,0.96), rgba(6,17,27,0.98))",
                  boxShadow:
                    "0 12px 30px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.025)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-35px",
                    right: "-35px",
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(0,210,255,0.12), transparent 70%)",
                    pointerEvents: "none",
                  }}
                />

                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "11px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "30px",
                      height: "30px",
                      flexShrink: 0,
                      border:
                        "1px solid rgba(0,210,255,0.18)",
                      borderRadius: "10px",
                      background:
                        "linear-gradient(145deg, rgba(0,210,255,0.10), rgba(0,90,130,0.08))",
                      boxShadow:
                        "0 0 20px rgba(0,210,255,0.06)",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#00d2ff",
                        boxShadow:
                          "0 0 10px rgba(0,210,255,0.95)",
                      }}
                    />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        marginBottom: "4px",
                        color: "#4d667b",
                        fontSize: "7px",
                        fontWeight: 900,
                        letterSpacing: "1.2px",
                      }}
                    >
                      CONNECTED NETWORK
                    </span>

                    <strong
                      style={{
                        display: "block",
                        overflow: "hidden",
                        color: "#dce8f2",
                        fontSize: "10px",
                        fontWeight: 700,
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {wallet.networkName}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "20px",
                      height: "20px",
                      marginLeft: "auto",
                      border:
                        "1px solid rgba(0,210,255,0.12)",
                      borderRadius: "6px",
                      color: "#00d2ff",
                      fontSize: "9px",
                    }}
                  >
                    ↗
                  </div>
                </div>
              </div>

              {/* CONNECTED WALLET */}
              <div
                style={{
                  position: "relative",
                  overflow: "hidden",
                  padding: "16px",
                  border:
                    "1px solid rgba(0,210,255,0.16)",
                  borderRadius: "14px",
                  background:
                    "linear-gradient(145deg, rgba(8,24,36,0.98), rgba(5,15,24,0.99))",
                  boxShadow:
                    "0 14px 35px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.025)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-65px",
                    left: "-45px",
                    width: "150px",
                    height: "150px",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(0,210,255,0.12), transparent 68%)",
                    pointerEvents: "none",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    right: "-70px",
                    bottom: "-80px",
                    width: "160px",
                    height: "160px",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(0,120,255,0.08), transparent 70%)",
                    pointerEvents: "none",
                  }}
                />

                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "11px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px",
                      flexShrink: 0,
                      border:
                        "1px solid rgba(0,210,255,0.18)",
                      borderRadius: "10px",
                      background:
                        "linear-gradient(145deg, #0c2839, #091a27)",
                      boxShadow:
                        "inset 0 0 16px rgba(0,210,255,0.04), 0 0 18px rgba(0,210,255,0.04)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "11px",
                        height: "11px",
                        border:
                          "1px solid rgba(0,210,255,0.85)",
                        borderRadius: "50%",
                        boxShadow:
                          "0 0 9px rgba(0,210,255,0.55)",
                      }}
                    >
                      <span
                        style={{
                          width: "4px",
                          height: "4px",
                          borderRadius: "50%",
                          background: "#00d2ff",
                          boxShadow:
                            "0 0 5px rgba(0,210,255,0.8)",
                        }}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        marginBottom: "5px",
                        color: "#4d667b",
                        fontSize: "7px",
                        fontWeight: 900,
                        letterSpacing: "1.2px",
                      }}
                    >
                      CONNECTED WALLET
                    </span>

                    <strong
                      style={{
                        display: "block",
                        overflow: "hidden",
                        color: "#e8f3fa",
                        fontFamily:
                          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.1px",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {wallet.address.slice(0, 6)}
                      ...
                      {wallet.address.slice(-4)}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "20px",
                      height: "20px",
                      flexShrink: 0,
                      border:
                        "1px solid rgba(77,182,165,0.18)",
                      borderRadius: "6px",
                      background:
                        "rgba(14,45,42,0.4)",
                    }}
                  >
                    <span
                      style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: "#5dd4c3",
                        boxShadow:
                          "0 0 9px rgba(93,212,195,0.95)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* =================================================
              MAIN CONTENT
          ================================================= */}

          <main style={styles.content}>
            <div style={styles.contentInner}>
              {activeTab ===
                "dashboard" && (
                <Dashboard
                  wallet={wallet}
                  transactions={
                    transactions
                  }
                  loadingTransactions={
                    loadingTransactions
                  }
                  onRefresh={
                    handleRefresh
                  }
                  onCopyAddress={
                    handleCopyAddress
                  }
                />
              )}

              {activeTab ===
                "payments" && (
                <Payments
                  wallet={wallet}
                  recipient={
                    recipient
                  }
                  amount={amount}
                  sending={sending}
                  onRecipientChange={
                    setRecipient
                  }
                  onAmountChange={
                    setAmount
                  }
                  onSend={
                    handleSendPayment
                  }
                />
              )}

              {activeTab ===
                "payment-request" && (
                <PaymentRequest
                  walletAddress={
                    wallet.address
                  }
                  chainId={
                    wallet.chainId
                  }
                />
              )}

              {activeTab ===
                "invoices" && (
                <Invoices
                  walletAddress={
                    wallet.address
                  }
                  chainId={
                    wallet.chainId
                  }
                />
              )}

              {activeTab ===
                "wallets" && (
                <Wallets
                  onActiveWalletChanged={
                    handleActiveWalletChanged
                  }
                />
              )}

              {activeTab ===
                "networks" && (
                <Networks
                  currentChainId={
                    wallet.chainId
                  }
                  onNetworkChanged={
                    handleConnectWallet
                  }
                />
              )}

              {activeTab ===
                "tokens" && (
                <Tokens
                  walletAddress={
                    wallet.address
                  }
                  chainId={
                    wallet.chainId
                  }
                />
              )}

              {activeTab ===
                "history" && (
                <History
                  walletAddress={
                    wallet.address
                  }
                  chainId={
                    wallet.chainId
                  }
                />
              )}

              {activeWallet &&
                wallet &&
                activeWallet.address.toLowerCase() !==
                  wallet.address.toLowerCase() && (
                  <div
                    style={
                      styles.walletWarning
                    }
                  >
                    <div
                      style={
                        styles.alertIcon
                      }
                    >
                      !
                    </div>

                    <div>
                      <strong>
                        Active wallet differs
                        from MetaMask
                      </strong>

                      <p>
                        Active:{" "}
                        {
                          activeWallet.name
                        }
                        <br />
                        Connected:{" "}
                        {wallet.address.slice(
                          0,
                          6
                        )}
                        ...
                        {wallet.address.slice(
                          -4
                        )}
                      </p>

                      <span>
                        Blockchain transactions
                        will continue to use the
                        wallet currently active
                        in MetaMask.
                      </span>
                    </div>
                  </div>
                )}

              {success && (
                <div
                  style={
                    styles.success
                  }
                >
                  <span
                    style={
                      styles.successIcon
                    }
                  >
                    ✓
                  </span>

                  <span>
                    {success}
                  </span>
                </div>
              )}

              {error && (
                <div
                  style={
                    styles.error
                  }
                >
                  <span
                    style={
                      styles.errorIcon
                    }
                  >
                    !
                  </span>

                  <span>
                    {error}
                  </span>
                </div>
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SIDEBAR ITEM
========================================================= */

interface SidebarItemProps {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}

function SidebarItem({
  label,
  icon,
  active,
  onClick,
}: SidebarItemProps) {
  return (
    <button
      style={{
        ...styles.sidebarItem,
        ...(active
          ? styles.sidebarItemActive
          : {}),
      }}
      onClick={onClick}
    >
      <span
        style={{
          ...styles.sidebarIcon,
          ...(active
            ? styles.sidebarIconActive
            : {}),
        }}
      >
        {icon}
      </span>

      <span style={styles.sidebarItemLabel}>
        {label}
      </span>

      {active && (
        <span
          style={
            styles.sidebarActiveIndicator
          }
        />
      )}
    </button>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles: Record<
  string,
  React.CSSProperties
> = {
  app: {
    position: "relative",
    minHeight: "100vh",
    overflow: "hidden",
    background:
      "linear-gradient(135deg, #050c15 0%, #071321 45%, #050b13 100%)",
    color: "#ffffff",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },

  backgroundGlowOne: {
    position: "fixed",
    top: "-260px",
    right: "-180px",
    width: "650px",
    height: "650px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(0,210,255,0.07) 0%, rgba(0,210,255,0) 68%)",
    pointerEvents: "none",
    zIndex: 0,
  },

  backgroundGlowTwo: {
    position: "fixed",
    bottom: "-300px",
    left: "20%",
    width: "700px",
    height: "500px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(0,100,255,0.045) 0%, rgba(0,100,255,0) 70%)",
    pointerEvents: "none",
    zIndex: 0,
  },

  /* =======================================================
     LOGIN
  ======================================================= */

  main: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1280px",
    minHeight:
      "calc(100vh - 80px)",
    margin: "0 auto",
    padding:
      "30px 24px 20px",
    display: "flex",
    flexDirection: "column",
  },

  loginHero: {
    width: "100%",
    maxWidth: "720px",
    margin: "auto",
    padding:
      "65px 30px 45px",
    textAlign: "center",
  },

  loginOrb: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "94px",
    height: "94px",
    margin: "0 auto 28px",
    border:
      "1px solid rgba(0,210,255,0.24)",
    borderRadius: "28px",
    background:
      "linear-gradient(145deg, rgba(14,42,59,0.9), rgba(7,19,31,0.95))",
    boxShadow:
      "0 0 70px rgba(0,210,255,0.09), inset 0 0 30px rgba(0,210,255,0.04)",
  },

  loginOrbInner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "56px",
    height: "56px",
    border:
      "1px solid rgba(0,210,255,0.3)",
    borderRadius: "18px",
    background:
      "linear-gradient(145deg, #0e3044, #0a1d2c)",
    color: "#00d2ff",
    fontSize: "28px",
    fontWeight: 700,
    boxShadow:
      "0 0 30px rgba(0,210,255,0.08)",
  },

  loginEyebrow: {
    marginBottom: "13px",
    color: "#5f8299",
    fontSize: "9px",
    fontWeight: 900,
    letterSpacing: "2.2px",
  },

  heroTitle: {
    margin: 0,
    color: "#f3f8fc",
    fontSize: "48px",
    fontWeight: 800,
    lineHeight: 1.08,
    letterSpacing: "-2px",
  },

  heroAccent: {
    color: "#00d2ff",
    textShadow:
      "0 0 35px rgba(0,210,255,0.16)",
  },

  heroText: {
    maxWidth: "560px",
    margin:
      "20px auto 30px",
    color: "#71869b",
    fontSize: "13px",
    lineHeight: 1.8,
  },

  connectButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "11px",
    minWidth: "210px",
    padding: "13px 17px",
    border:
      "1px solid rgba(0,210,255,0.5)",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg, #0b354a, #0a2638)",
    color: "#00d2ff",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow:
      "0 12px 35px rgba(0,0,0,0.18), 0 0 25px rgba(0,210,255,0.05)",
  },

  connectButtonLoading: {
    opacity: 0.7,
    cursor: "wait",
  },

  connectIcon: {
    fontSize: "14px",
  },

  buttonArrow: {
    marginLeft: "6px",
    fontSize: "16px",
  },

  loginMeta: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "9px",
    marginTop: "17px",
    color: "#455c70",
    fontSize: "9px",
  },

  metaDot: {
    display: "inline-block",
    width: "5px",
    height: "5px",
    marginRight: "5px",
    borderRadius: "50%",
    background: "#55d5c3",
    boxShadow:
      "0 0 7px rgba(85,213,195,0.8)",
  },

  metaDivider: {
    color: "#263c4f",
  },

  loginError: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    maxWidth: "540px",
    margin:
      "25px auto 0",
    padding: "12px 15px",
    border:
      "1px solid rgba(255,90,110,0.22)",
    borderRadius: "9px",
    background:
      "rgba(57,16,24,0.55)",
    color: "#ff9da9",
    fontSize: "10px",
    lineHeight: 1.5,
    textAlign: "left",
  },

  loginFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding:
      "18px 4px 0",
    borderTop:
      "1px solid rgba(74,100,121,0.12)",
    color: "#334b5f",
    fontSize: "7px",
    fontWeight: 800,
    letterSpacing: "1.2px",
  },

  /* =======================================================
     LAYOUT
  ======================================================= */

  layout: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    minHeight:
      "calc(100vh - 80px)",
  },

  /* =======================================================
     SIDEBAR
  ======================================================= */

  sidebar: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    width: "238px",
    flexShrink: 0,
    padding:
      "25px 15px 18px",
    borderRight:
      "1px solid rgba(70,96,119,0.17)",
    background:
      "linear-gradient(180deg, rgba(7,18,29,0.96), rgba(5,13,21,0.98))",
  },

  sidebarBrand: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding:
      "0 8px 22px",
  },

  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "35px",
    height: "35px",
    border:
      "1px solid rgba(0,210,255,0.3)",
    borderRadius: "10px",
    background:
      "linear-gradient(145deg, #10334a, #0b1d2b)",
    color: "#00d2ff",
    fontSize: "17px",
    fontWeight: 700,
    boxShadow:
      "0 0 22px rgba(0,210,255,0.05)",
  },

  sidebarBrandName: {
    display: "block",
    color: "#edf5fa",
    fontSize: "13px",
    fontWeight: 900,
    letterSpacing: "1px",
  },

  sidebarBrandSub: {
    display: "block",
    marginTop: "2px",
    color: "#40586d",
    fontSize: "6px",
    fontWeight: 800,
    letterSpacing: "1.1px",
  },

  sidebarDivider: {
    height: "1px",
    margin:
      "0 8px 22px",
    background:
      "rgba(70,96,119,0.15)",
  },

  navigationLabel: {
    margin:
      "0 10px 9px",
    color: "#3e566b",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "1.5px",
  },

  navigationLabelSecondary: {
    margin:
      "25px 10px 9px",
    color: "#3e566b",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "1.5px",
  },

  sidebarItem: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    width: "100%",
    height: "42px",
    marginBottom: "3px",
    padding:
      "0 11px",
    border:
      "1px solid transparent",
    borderRadius: "9px",
    background:
      "transparent",
    color: "#62798e",
    textAlign: "left",
    cursor: "pointer",
    transition:
      "all 0.2s ease",
  },

  sidebarItemActive: {
    border:
      "1px solid rgba(0,210,255,0.12)",
    background:
      "linear-gradient(90deg, rgba(0,210,255,0.10), rgba(0,210,255,0.025))",
    color: "#e3f5fb",
    boxShadow:
      "inset 0 0 25px rgba(0,210,255,0.025)",
  },

  sidebarIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "27px",
    height: "27px",
    marginRight: "9px",
    borderRadius: "7px",
    color: "#4e667a",
    fontSize: "13px",
    transition:
      "all 0.2s ease",
  },

  sidebarIconActive: {
    background:
      "rgba(0,210,255,0.09)",
    color: "#00d2ff",
  },

  sidebarItemLabel: {
    fontSize: "10px",
    fontWeight: 650,
    letterSpacing: "0.05px",
  },

  sidebarActiveIndicator: {
    position: "absolute",
    right: "0",
    width: "2px",
    height: "20px",
    borderRadius:
      "3px 0 0 3px",
    background: "#00d2ff",
    boxShadow:
      "0 0 10px rgba(0,210,255,0.7)",
  },

  sidebarBottom: {
    marginTop: "auto",
  },

  sidebarNetwork: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    marginBottom: "9px",
    padding:
      "11px 10px",
    border:
      "1px solid rgba(70,96,119,0.16)",
    borderRadius: "9px",
    background:
      "rgba(10,23,35,0.65)",
  },

  sidebarNetworkDot: {
    width: "6px",
    height: "6px",
    flexShrink: 0,
    borderRadius: "50%",
    background: "#54d5c3",
    boxShadow:
      "0 0 9px rgba(84,213,195,0.8)",
  },

  sidebarNetworkLabel: {
    display: "block",
    marginBottom: "2px",
    color: "#3f576b",
    fontSize: "6px",
    fontWeight: 800,
    letterSpacing: "0.8px",
  },

  sidebarNetworkName: {
    display: "block",
    color: "#9aafc0",
    fontSize: "9px",
    fontWeight: 700,
  },

  sidebarWallet: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding:
      "10px",
    border:
      "1px solid rgba(70,96,119,0.12)",
    borderRadius: "9px",
    background:
      "rgba(6,15,24,0.7)",
  },

  sidebarWalletIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "27px",
    height: "27px",
    borderRadius: "8px",
    background:
      "rgba(0,210,255,0.07)",
    color: "#00d2ff",
    fontSize: "11px",
  },

  sidebarWalletInfo: {
    minWidth: 0,
  },

  sidebarWalletInfoSpan: {
    display: "block",
  },

  /* =======================================================
     CONTENT
  ======================================================= */

  content: {
    position: "relative",
    flex: 1,
    minWidth: 0,
    overflow: "auto",
  },

  contentInner: {
    width: "100%",
    maxWidth: "1280px",
    margin: "0 auto",
    padding:
      "42px 48px 70px",
  },

  /* =======================================================
     ALERTS
  ======================================================= */

  walletWarning: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    marginTop: "25px",
    padding: "14px 16px",
    border:
      "1px solid rgba(224,174,65,0.2)",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, rgba(49,39,18,0.65), rgba(27,23,14,0.75))",
    color: "#d8b75d",
    fontSize: "10px",
    lineHeight: 1.6,
  },

  alertIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    flexShrink: 0,
    border:
      "1px solid rgba(224,174,65,0.25)",
    borderRadius: "7px",
    background:
      "rgba(224,174,65,0.07)",
    color: "#e0b94f",
    fontSize: "11px",
    fontWeight: 900,
  },

  success: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "18px",
    padding: "12px 15px",
    border:
      "1px solid rgba(77,182,165,0.22)",
    borderRadius: "9px",
    background:
      "linear-gradient(135deg, rgba(12,43,39,0.72), rgba(8,27,25,0.78))",
    color: "#72d8ca",
    fontSize: "10px",
    lineHeight: 1.5,
    wordBreak: "break-all",
  },

  successIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "21px",
    height: "21px",
    flexShrink: 0,
    border:
      "1px solid rgba(77,182,165,0.25)",
    borderRadius: "6px",
    background:
      "rgba(77,182,165,0.08)",
    fontSize: "10px",
    fontWeight: 900,
  },

  error: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "18px",
    padding: "12px 15px",
    border:
      "1px solid rgba(255,90,110,0.22)",
    borderRadius: "9px",
    background:
      "linear-gradient(135deg, rgba(55,17,25,0.72), rgba(29,11,17,0.78))",
    color: "#ff9ca8",
    fontSize: "10px",
    lineHeight: 1.5,
    wordBreak: "break-word",
  },

  errorIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "21px",
    height: "21px",
    flexShrink: 0,
    border:
      "1px solid rgba(255,90,110,0.25)",
    borderRadius: "6px",
    background:
      "rgba(255,90,110,0.07)",
    fontSize: "10px",
    fontWeight: 900,
  },
};

export default App;