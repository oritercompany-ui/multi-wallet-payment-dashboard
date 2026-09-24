import { useEffect, useState } from "react";
import {
  getTokenData,
  type TokenData,
} from "../utils/tokens";
import {
  estimateERC20Gas,
  sendERC20,
  type GasEstimateData,
} from "../utils/transfers";
import {
  saveTransactionHistory,
} from "../utils/transactionHistory";

interface TokensProps {
  walletAddress: string;
  chainId: string;
}

const STORAGE_KEY = "opay_tokens";

function Tokens({
  walletAddress,
  chainId,
}: TokensProps) {
  const [tokenAddress, setTokenAddress] =
    useState("");

  const [tokens, setTokens] =
    useState<TokenData[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ERC-20 Transfer
  const [sendToken, setSendToken] =
    useState("");

  const [recipient, setRecipient] =
    useState("");

  const [amount, setAmount] =
    useState("");

  const [sendLoading, setSendLoading] =
    useState(false);

  // ERC-20 Gas Estimator
  const [gasToken, setGasToken] =
    useState("");

  const [gasRecipient, setGasRecipient] =
    useState("");

  const [gasAmount, setGasAmount] =
    useState("");

  const [gasLoading, setGasLoading] =
    useState(false);

  const [gasResult, setGasResult] =
    useState<GasEstimateData | null>(null);

  useEffect(() => {
    loadTokens();
  }, [chainId]);

  function loadTokens() {
    try {
      const saved =
        localStorage.getItem(
          `${STORAGE_KEY}_${chainId}`
        );

      if (!saved) {
        setTokens([]);
        setGasToken("");
        setSendToken("");
        return;
      }

      const parsed =
        JSON.parse(saved);

      setTokens(parsed);

      if (parsed.length > 0) {
        setGasToken(parsed[0].address);
        setSendToken(parsed[0].address);
      }
    } catch {
      setTokens([]);
      setGasToken("");
      setSendToken("");
    }
  }

  function saveTokens(
    updatedTokens: TokenData[]
  ) {
    localStorage.setItem(
      `${STORAGE_KEY}_${chainId}`,
      JSON.stringify(updatedTokens)
    );

    setTokens(updatedTokens);

    if (
      updatedTokens.length > 0 &&
      !updatedTokens.some(
        (token) =>
          token.address.toLowerCase() ===
          gasToken.toLowerCase()
      )
    ) {
      setGasToken(
        updatedTokens[0].address
      );
    }

    if (
      updatedTokens.length > 0 &&
      !updatedTokens.some(
        (token) =>
          token.address.toLowerCase() ===
          sendToken.toLowerCase()
      )
    ) {
      setSendToken(
        updatedTokens[0].address
      );
    }

    if (updatedTokens.length === 0) {
      setGasToken("");
      setSendToken("");
    }
  }

  async function handleAddToken() {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (!tokenAddress.trim()) {
        throw new Error(
          "Masukkan token contract address."
        );
      }

      const token =
        await getTokenData(
          tokenAddress.trim(),
          walletAddress
        );

      const exists = tokens.some(
        (item) =>
          item.address.toLowerCase() ===
          token.address.toLowerCase()
      );

      if (exists) {
        throw new Error(
          "Token sudah ditambahkan."
        );
      }

      saveTokens([
        ...tokens,
        token,
      ]);

      setTokenAddress("");

      setSuccess(
        `${token.symbol} berhasil ditambahkan.`
      );
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Gagal menambahkan token."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRefreshToken(
    token: TokenData
  ) {
    try {
      setError("");

      const updated =
        await getTokenData(
          token.address,
          walletAddress
        );

      const updatedTokens =
        tokens.map((item) =>
          item.address.toLowerCase() ===
          token.address.toLowerCase()
            ? updated
            : item
        );

      saveTokens(updatedTokens);

      setSuccess(
        `${token.symbol} balance berhasil diperbarui.`
      );
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  }

  function handleRemoveToken(
    address: string
  ) {
    const updatedTokens =
      tokens.filter(
        (token) =>
          token.address.toLowerCase() !==
          address.toLowerCase()
      );

    saveTokens(updatedTokens);

    setSuccess(
      "Token berhasil dihapus."
    );

    setGasResult(null);
  }

  async function handleEstimateGas() {
    try {
      setGasLoading(true);
      setError("");
      setSuccess("");
      setGasResult(null);

      if (!gasToken) {
        throw new Error(
          "Pilih token terlebih dahulu."
        );
      }

      if (!gasRecipient.trim()) {
        throw new Error(
          "Masukkan recipient wallet address."
        );
      }

      if (!gasAmount.trim()) {
        throw new Error(
          "Masukkan jumlah token."
        );
      }

      const selectedToken =
        tokens.find(
          (token) =>
            token.address.toLowerCase() ===
            gasToken.toLowerCase()
        );

      if (!selectedToken) {
        throw new Error(
          "Token tidak ditemukan."
        );
      }

      const result =
        await estimateERC20Gas(
          selectedToken.address,
          gasRecipient.trim(),
          gasAmount.trim(),
          selectedToken.decimals
        );

      setGasResult(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Gagal melakukan estimasi gas."
        );
      }
    } finally {
      setGasLoading(false);
    }
  }

  async function handleSendToken() {
    try {
      setSendLoading(true);
      setError("");
      setSuccess("");

      if (!sendToken) {
        throw new Error(
          "Pilih token terlebih dahulu."
        );
      }

      if (!recipient.trim()) {
        throw new Error(
          "Masukkan recipient wallet address."
        );
      }

      if (!amount.trim()) {
        throw new Error(
          "Masukkan jumlah token."
        );
      }

      const selectedToken =
        tokens.find(
          (token) =>
            token.address.toLowerCase() ===
            sendToken.toLowerCase()
        );

      if (!selectedToken) {
        throw new Error(
          "Token tidak ditemukan."
        );
      }

      const result =
        await sendERC20(
          selectedToken.address,
          recipient.trim(),
          amount.trim(),
          selectedToken.decimals
        );

      saveTransactionHistory(
        walletAddress,
        {
          hash: result.hash,
          type: "ERC20",
          asset: selectedToken.symbol,
          amount: amount.trim(),
          recipient: recipient.trim(),
          timestamp: Date.now(),
          status: "confirmed",
          chainId,
        }
      );

      setSuccess(
        `${selectedToken.symbol} transaction submitted.`
      );

      setRecipient("");
      setAmount("");
      setGasResult(null);

      try {
        const updated =
          await getTokenData(
            selectedToken.address,
            walletAddress
          );

        const updatedTokens =
          tokens.map((item) =>
            item.address.toLowerCase() ===
            selectedToken.address.toLowerCase()
              ? updated
              : item
          );

        saveTokens(updatedTokens);
      } catch {
        // Transaction remains successful
        // even if balance refresh fails.
      }

      console.log(
        "ERC-20 Transaction Hash:",
        result.hash
      );
    } catch (err: any) {
      const transactionHash =
        err?.transactionHash;

      if (
        transactionHash &&
        sendToken &&
        recipient.trim() &&
        amount.trim()
      ) {
        const selectedToken =
          tokens.find(
            (token) =>
              token.address.toLowerCase() ===
              sendToken.toLowerCase()
          );

        if (selectedToken) {
          saveTransactionHistory(
            walletAddress,
            {
              hash: transactionHash,
              type: "ERC20",
              asset: selectedToken.symbol,
              amount: amount.trim(),
              recipient: recipient.trim(),
              timestamp: Date.now(),
              status: "failed",
              chainId,
            }
          );
        }
      }

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Gagal mengirim token."
        );
      }
    } finally {
      setSendLoading(false);
    }
  }

  const selectedSendToken =
    tokens.find(
      (token) =>
        token.address.toLowerCase() ===
        sendToken.toLowerCase()
    );

  return (
    <section>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>
            ASSET MANAGEMENT
          </p>

          <h1 style={styles.title}>
            Tokens
          </h1>

          <p style={styles.subtitle}>
            Monitor, transfer, and estimate gas
            for ERC-20 assets across your
            connected network.
          </p>
        </div>

        <div style={styles.networkBadge}>
          <span style={styles.networkDot} />

          <div>
            <span style={styles.networkLabel}>
              ACTIVE NETWORK
            </span>

            <strong style={styles.networkValue}>
              Chain {chainId}
            </strong>
          </div>
        </div>
      </div>

      {/* STATUS */}
      {success && (
        <div style={styles.success}>
          <div style={styles.statusIcon}>
            ✓
          </div>

          <div>
            <strong style={styles.statusTitle}>
              Operation completed
            </strong>

            <div style={styles.statusText}>
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
              Operation failed
            </strong>

            <div style={styles.errorText}>
              {error}
            </div>
          </div>
        </div>
      )}

      {/* TOP STATS */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statTop}>
            <span style={styles.statLabel}>
              TRACKED TOKENS
            </span>

            <span style={styles.statIcon}>
              ◇
            </span>
          </div>

          <strong style={styles.statValue}>
            {tokens.length}
          </strong>

          <span style={styles.statDescription}>
            ERC-20 assets monitored
          </span>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statTop}>
            <span style={styles.statLabel}>
              ACTIVE NETWORK
            </span>

            <span style={styles.statIcon}>
              ◈
            </span>
          </div>

          <strong
            style={{
              ...styles.statValue,
              fontSize: "20px",
            }}
          >
            Chain {chainId}
          </strong>

          <span style={styles.statDescription}>
            Token data is network-specific
          </span>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statTop}>
            <span style={styles.statLabel}>
              TRANSFER MODE
            </span>

            <span style={styles.statIcon}>
              ↗
            </span>
          </div>

          <strong
            style={{
              ...styles.statValue,
              fontSize: "20px",
            }}
          >
            ERC-20
          </strong>

          <span style={styles.statDescription}>
            MetaMask transaction signing
          </span>
        </div>
      </div>

      {/* ADD TOKEN */}
      <div style={styles.sectionHeader}>
        <div>
          <p style={styles.sectionEyebrow}>
            TOKEN REGISTRY
          </p>

          <h2 style={styles.sectionTitle}>
            Add ERC-20 Asset
          </h2>

          <p style={styles.sectionDescription}>
            Import a token by its contract
            address to monitor its balance.
          </p>
        </div>
      </div>

      <div style={styles.addCard}>
        <div style={styles.addIcon}>
          +
        </div>

        <div style={styles.addContent}>
          <div style={styles.inputHeader}>
            <div>
              <span style={styles.inputTitle}>
                Token Contract Address
              </span>

              <span style={styles.inputHint}>
                ERC-20 contract
              </span>
            </div>

            <span style={styles.secureBadge}>
              ON-CHAIN
            </span>
          </div>

          <div style={styles.addRow}>
            <input
              value={tokenAddress}
              onChange={(event) =>
                setTokenAddress(
                  event.target.value
                )
              }
              placeholder="0x..."
              style={styles.input}
              disabled={loading}
            />

            <button
              onClick={handleAddToken}
              disabled={loading}
              style={{
                ...styles.addButton,
                opacity: loading ? 0.65 : 1,
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {loading
                ? "Loading..."
                : "Add Token"}
            </button>
          </div>
        </div>
      </div>

      {/* TRANSFER + GAS */}
      {tokens.length > 0 && (
        <div style={styles.operationsGrid}>
          {/* SEND */}
          <div style={styles.operationCard}>
            <div style={styles.operationHeader}>
              <div>
                <span style={styles.sectionEyebrow}>
                  TRANSFER
                </span>

                <h2 style={styles.formTitle}>
                  Send ERC-20
                </h2>
              </div>

              <div style={styles.operationIcon}>
                ↗
              </div>
            </div>

            <p style={styles.formDescription}>
              Send tokens through MetaMask.
              Network gas is paid using the
              native currency.
            </p>

            <label style={styles.label}>
              Token
            </label>

            <select
              value={sendToken}
              onChange={(event) => {
                setSendToken(
                  event.target.value
                );
                setGasResult(null);
              }}
              style={styles.select}
              disabled={sendLoading}
            >
              {tokens.map((token) => (
                <option
                  key={token.address}
                  value={token.address}
                >
                  {token.symbol} — Balance:{" "}
                  {token.balance}
                </option>
              ))}
            </select>

            {selectedSendToken && (
              <div style={styles.selectedToken}>
                <div style={styles.miniTokenIcon}>
                  $
                </div>

                <div>
                  <strong>
                    {selectedSendToken.symbol}
                  </strong>

                  <span>
                    Available{" "}
                    {selectedSendToken.balance}
                  </span>
                </div>
              </div>
            )}

            <label style={styles.label}>
              Recipient
            </label>

            <input
              value={recipient}
              onChange={(event) => {
                setRecipient(
                  event.target.value
                );
                setGasResult(null);
              }}
              placeholder="0x..."
              style={styles.input}
              disabled={sendLoading}
            />

            <label style={styles.label}>
              Amount
            </label>

            <div style={styles.amountWrapper}>
              <input
                value={amount}
                onChange={(event) => {
                  setAmount(
                    event.target.value
                  );
                  setGasResult(null);
                }}
                placeholder="10.00"
                type="text"
                inputMode="decimal"
                style={styles.amountInput}
                disabled={sendLoading}
              />

              <span style={styles.amountAsset}>
                {selectedSendToken?.symbol ||
                  "TOKEN"}
              </span>
            </div>

            <button
              onClick={handleSendToken}
              disabled={sendLoading}
              style={{
                ...styles.primaryButton,
                opacity: sendLoading ? 0.65 : 1,
                cursor: sendLoading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {sendLoading
                ? "Sending..."
                : "Send Token"}
            </button>

            <p style={styles.metaText}>
              Review the transaction and network
              fee in MetaMask before confirming.
            </p>
          </div>

          {/* GAS */}
          <div style={styles.operationCard}>
            <div style={styles.operationHeader}>
              <div>
                <span style={styles.sectionEyebrow}>
                  TRANSACTION ANALYSIS
                </span>

                <h2 style={styles.formTitle}>
                  Gas Estimator
                </h2>
              </div>

              <div style={styles.operationIcon}>
                ◈
              </div>
            </div>

            <p style={styles.formDescription}>
              Estimate the ERC-20 transaction
              cost before broadcasting anything
              to the blockchain.
            </p>

            <div style={styles.simulationBadge}>
              <span style={styles.simulationDot} />
              Simulation only
            </div>

            <label style={styles.label}>
              Token
            </label>

            <select
              value={gasToken}
              onChange={(event) => {
                setGasToken(
                  event.target.value
                );
                setGasResult(null);
              }}
              style={styles.select}
              disabled={gasLoading}
            >
              {tokens.map((token) => (
                <option
                  key={token.address}
                  value={token.address}
                >
                  {token.symbol} — {token.name}
                </option>
              ))}
            </select>

            <label style={styles.label}>
              Recipient
            </label>

            <input
              value={gasRecipient}
              onChange={(event) =>
                setGasRecipient(
                  event.target.value
                )
              }
              placeholder="0x..."
              style={styles.input}
              disabled={gasLoading}
            />

            <label style={styles.label}>
              Amount
            </label>

            <input
              value={gasAmount}
              onChange={(event) =>
                setGasAmount(
                  event.target.value
                )
              }
              placeholder="10.00"
              type="text"
              inputMode="decimal"
              style={styles.input}
              disabled={gasLoading}
            />

            <button
              onClick={handleEstimateGas}
              disabled={gasLoading}
              style={{
                ...styles.secondaryButton,
                opacity: gasLoading ? 0.65 : 1,
                cursor: gasLoading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {gasLoading
                ? "Estimating..."
                : "Estimate Gas"}
            </button>

            {gasResult && (
              <div style={styles.gasResult}>
                <div style={styles.gasResultHeader}>
                  <span>
                    ESTIMATION RESULT
                  </span>

                  <span style={styles.estimatedBadge}>
                    READY
                  </span>
                </div>

                <div style={styles.gasRow}>
                  <span>Gas Limit</span>

                  <strong>
                    {gasResult.gasLimit}
                  </strong>
                </div>

                <div style={styles.gasRow}>
                  <span>Gas Price</span>

                  <strong>
                    {gasResult.gasPrice} Gwei
                  </strong>
                </div>

                <div
                  style={{
                    ...styles.gasRow,
                    borderBottom: "none",
                  }}
                >
                  <span>Estimated Fee</span>

                  <strong style={styles.feeValue}>
                    {gasResult.estimatedFee}{" "}
                    {gasResult.nativeSymbol}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOKEN PORTFOLIO */}
      <div style={styles.sectionHeaderLarge}>
        <div>
          <p style={styles.sectionEyebrow}>
            ASSET PORTFOLIO
          </p>

          <h2 style={styles.sectionTitle}>
            Your Tokens
          </h2>

          <p style={styles.sectionDescription}>
            ERC-20 assets currently tracked on
            this network.
          </p>
        </div>

        <div style={styles.chainBadge}>
          CHAIN {chainId}
        </div>
      </div>

      {tokens.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>
            ◇
          </div>

          <p style={styles.emptyTitle}>
            No ERC-20 assets tracked
          </p>

          <p style={styles.emptyText}>
            Add a token contract address above
            to start monitoring its on-chain
            balance.
          </p>
        </div>
      ) : (
        <div style={styles.grid}>
          {tokens.map((token) => (
            <div
              key={token.address}
              style={styles.tokenCard}
            >
              <div style={styles.tokenCardTop}>
                <div style={styles.tokenIcon}>
                  $
                </div>

                <div style={styles.tokenIdentity}>
                  <h3 style={styles.symbol}>
                    {token.symbol}
                  </h3>

                  <p style={styles.name}>
                    {token.name}
                  </p>
                </div>

                <span style={styles.trackedBadge}>
                  TRACKED
                </span>
              </div>

              <div style={styles.tokenBalanceLabel}>
                TOKEN BALANCE
              </div>

              <div style={styles.balance}>
                {token.balance}
              </div>

              <div style={styles.currency}>
                {token.symbol}
              </div>

              <div style={styles.addressBox}>
                <span style={styles.addressLabel}>
                  CONTRACT
                </span>

                <p style={styles.address}>
                  {token.address}
                </p>
              </div>

              <div style={styles.actions}>
                <button
                  style={styles.refreshButton}
                  onClick={() =>
                    handleRefreshToken(
                      token
                    )
                  }
                >
                  ↻ Refresh
                </button>

                <button
                  style={styles.removeButton}
                  onClick={() =>
                    handleRemoveToken(
                      token.address
                    )
                  }
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SECURITY */}
      <div style={styles.security}>
        <div style={styles.securityIcon}>
          ✓
        </div>

        <div>
          <strong style={styles.securityTitle}>
            Non-Custodial Security
          </strong>

          <p style={styles.securityText}>
            O-Pay only requires token contract
            addresses to read ERC-20 data.
            Private keys and seed phrases are
            never requested or stored.
          </p>
        </div>

        <span style={styles.securityBadge}>
          SECURE
        </span>
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
    marginBottom: "28px",
  },

  eyebrow: {
    margin: 0,
    color: "#5e748c",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "1.6px",
  },

  title: {
    margin: "7px 0 0",
    fontSize: "34px",
    fontWeight: 800,
    letterSpacing: "-0.8px",
  },

  subtitle: {
    maxWidth: "650px",
    margin: "9px 0 0",
    color: "#8495a9",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  networkBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    border: "1px solid #20364b",
    borderRadius: "10px",
    background: "#091522",
  },

  networkDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#00d2ff",
    boxShadow:
      "0 0 12px rgba(0,210,255,0.7)",
  },

  networkLabel: {
    display: "block",
    color: "#526980",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  networkValue: {
    display: "block",
    marginTop: "3px",
    color: "#d9e5f0",
    fontSize: "11px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(3, 1fr)",
    gap: "14px",
    marginBottom: "30px",
  },

  statCard: {
    minHeight: "105px",
    padding: "18px",
    border: "1px solid #172638",
    borderRadius: "13px",
    background:
      "linear-gradient(145deg, #0b1928, #08131f)",
  },

  statTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  statLabel: {
    color: "#5d7389",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "1.2px",
  },

  statIcon: {
    width: "27px",
    height: "27px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #20364b",
    borderRadius: "7px",
    background: "#0d2032",
    color: "#00d2ff",
    fontSize: "12px",
  },

  statValue: {
    display: "block",
    marginTop: "15px",
    color: "#ffffff",
    fontSize: "26px",
    lineHeight: 1,
  },

  statDescription: {
    display: "block",
    marginTop: "8px",
    color: "#596d82",
    fontSize: "10px",
  },

  sectionHeader: {
    marginBottom: "14px",
  },

  sectionHeaderLarge: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: "20px",
    margin:
      "38px 0 16px",
  },

  sectionEyebrow: {
    display: "block",
    marginBottom: "6px",
    color: "#5d7389",
    fontSize: "9px",
    fontWeight: 800,
    letterSpacing: "1.3px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "21px",
    fontWeight: 750,
  },

  sectionDescription: {
    margin: "6px 0 0",
    color: "#667b90",
    fontSize: "11px",
  },

  addCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "20px",
    border: "1px solid #1a3044",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg, #0b1a29, #081420)",
  },

  addIcon: {
    width: "44px",
    height: "44px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #16445a",
    borderRadius: "11px",
    background: "#0b2637",
    color: "#00d2ff",
    fontSize: "24px",
  },

  addContent: {
    flex: 1,
    minWidth: 0,
  },

  inputHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "9px",
  },

  inputTitle: {
    display: "block",
    color: "#d6e2ed",
    fontSize: "12px",
    fontWeight: 700,
  },

  inputHint: {
    display: "block",
    marginTop: "3px",
    color: "#526980",
    fontSize: "9px",
  },

  secureBadge: {
    padding: "5px 8px",
    border: "1px solid #16445a",
    borderRadius: "5px",
    background: "#0a2230",
    color: "#00d2ff",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "0.8px",
  },

  addRow: {
    display: "flex",
    gap: "9px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #243a4f",
    borderRadius: "8px",
    outline: "none",
    background: "#07111f",
    color: "#ffffff",
    fontSize: "12px",
    fontFamily: "monospace",
  },

  select: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    border: "1px solid #243a4f",
    borderRadius: "8px",
    outline: "none",
    background: "#07111f",
    color: "#ffffff",
    fontSize: "12px",
  },

  addButton: {
    flexShrink: 0,
    padding: "0 20px",
    border: "none",
    borderRadius: "8px",
    background:
      "linear-gradient(135deg, #00d2ff, #00b9e5)",
    color: "#04101a",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },

  operationsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "16px",
    marginTop: "18px",
  },

  operationCard: {
    padding: "22px",
    border: "1px solid #172638",
    borderRadius: "14px",
    background: "#091522",
  },

  operationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "15px",
  },

  operationIcon: {
    width: "35px",
    height: "35px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #1d3a50",
    borderRadius: "9px",
    background: "#0c2031",
    color: "#00d2ff",
    fontSize: "15px",
  },

  formTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: 750,
  },

  formDescription: {
    maxWidth: "500px",
    margin: "8px 0 20px",
    color: "#64788d",
    fontSize: "11px",
    lineHeight: 1.6,
  },

  label: {
    display: "block",
    margin: "14px 0 7px",
    color: "#91a3b5",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "0.4px",
  },

  selectedToken: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    marginTop: "8px",
    padding: "9px 10px",
    border: "1px solid #172e42",
    borderRadius: "8px",
    background: "#07121f",
  },

  miniTokenIcon: {
    width: "25px",
    height: "25px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
    background: "#102b40",
    color: "#00d2ff",
    fontSize: "11px",
    fontWeight: 800,
  },

  primaryButton: {
    width: "100%",
    marginTop: "18px",
    padding: "13px",
    border: "none",
    borderRadius: "8px",
    background:
      "linear-gradient(135deg, #00d2ff, #00b9e5)",
    color: "#04101a",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },

  secondaryButton: {
    width: "100%",
    marginTop: "18px",
    padding: "13px",
    border: "1px solid #00a9cc",
    borderRadius: "8px",
    background: "#0b2231",
    color: "#00d2ff",
    fontSize: "12px",
    fontWeight: 800,
    cursor: "pointer",
  },

  amountWrapper: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #243a4f",
    borderRadius: "8px",
    background: "#07111f",
    overflow: "hidden",
  },

  amountInput: {
    flex: 1,
    minWidth: 0,
    padding: "12px 13px",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#ffffff",
    fontSize: "13px",
  },

  amountAsset: {
    padding: "0 13px",
    color: "#00d2ff",
    fontSize: "10px",
    fontWeight: 800,
  },

  metaText: {
    margin: "10px 0 0",
    color: "#4f6479",
    fontSize: "9px",
    lineHeight: 1.5,
    textAlign: "center",
  },

  simulationBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "5px 8px",
    border: "1px solid #273b4d",
    borderRadius: "5px",
    background: "#0b1825",
    color: "#71849a",
    fontSize: "8px",
    fontWeight: 700,
  },

  simulationDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#8ca1b5",
  },

  gasResult: {
    marginTop: "16px",
    padding: "14px",
    border: "1px solid #20384d",
    borderRadius: "10px",
    background: "#07111f",
  },

  gasResultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "8px",
    color: "#5e748b",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  estimatedBadge: {
    padding: "3px 6px",
    borderRadius: "4px",
    background: "#10382f",
    color: "#65e6b1",
    fontSize: "7px",
    letterSpacing: "0.5px",
  },

  gasRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    padding: "9px 0",
    borderBottom: "1px solid #172638",
    color: "#687d91",
    fontSize: "10px",
  },

  feeValue: {
    color: "#00d2ff",
  },

  sectionTitleLarge: {
    margin: 0,
    fontSize: "21px",
  },

  chainBadge: {
    padding: "7px 10px",
    border: "1px solid #20364a",
    borderRadius: "6px",
    background: "#091522",
    color: "#71849a",
    fontSize: "8px",
    fontFamily: "monospace",
    fontWeight: 700,
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "16px",
  },

  tokenCard: {
    padding: "20px",
    border: "1px solid #172638",
    borderRadius: "14px",
    background:
      "linear-gradient(145deg, #0b1928, #08131f)",
  },

  tokenCardTop: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
  },

  tokenIcon: {
    width: "42px",
    height: "42px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #1b4055",
    borderRadius: "11px",
    background: "#0d2537",
    color: "#00d2ff",
    fontSize: "17px",
    fontWeight: 800,
  },

  tokenIdentity: {
    minWidth: 0,
    flex: 1,
  },

  symbol: {
    margin: 0,
    fontSize: "17px",
    fontWeight: 750,
  },

  name: {
    margin: "4px 0 0",
    color: "#60758a",
    fontSize: "10px",
  },

  trackedBadge: {
    padding: "4px 6px",
    border: "1px solid #183f50",
    borderRadius: "5px",
    background: "#0a202b",
    color: "#00c6ee",
    fontSize: "7px",
    fontWeight: 800,
    letterSpacing: "0.7px",
  },

  tokenBalanceLabel: {
    marginTop: "25px",
    color: "#53697f",
    fontSize: "8px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  balance: {
    marginTop: "7px",
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: 750,
    letterSpacing: "-0.5px",
    wordBreak: "break-word",
  },

  currency: {
    marginTop: "4px",
    color: "#00bfe9",
    fontSize: "10px",
    fontWeight: 700,
  },

  addressBox: {
    marginTop: "20px",
    padding: "11px",
    border: "1px solid #14283a",
    borderRadius: "8px",
    background: "#07111d",
  },

  addressLabel: {
    display: "block",
    marginBottom: "6px",
    color: "#4f657a",
    fontSize: "7px",
    fontWeight: 800,
    letterSpacing: "0.9px",
  },

  address: {
    margin: 0,
    color: "#63788c",
    fontSize: "9px",
    fontFamily: "monospace",
    lineHeight: 1.5,
    wordBreak: "break-all",
  },

  actions: {
    display: "flex",
    gap: "8px",
    marginTop: "12px",
  },

  refreshButton: {
    flex: 1,
    padding: "9px",
    border: "1px solid #263c50",
    borderRadius: "7px",
    background: "#102235",
    color: "#d2dee9",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  removeButton: {
    flex: 1,
    padding: "9px",
    border: "1px solid #4b2931",
    borderRadius: "7px",
    background: "#21151a",
    color: "#e98d99",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  success: {
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    marginBottom: "16px",
    padding: "13px 15px",
    border: "1px solid #235344",
    borderRadius: "9px",
    background: "#10251f",
  },

  statusIcon: {
    width: "24px",
    height: "24px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
    background: "#164536",
    color: "#65e6b1",
    fontSize: "12px",
    fontWeight: 800,
  },

  statusTitle: {
    display: "block",
    color: "#65e6b1",
    fontSize: "11px",
  },

  statusText: {
    marginTop: "3px",
    color: "#8bc8b2",
    fontSize: "10px",
    wordBreak: "break-word",
  },

  error: {
    display: "flex",
    alignItems: "flex-start",
    gap: "11px",
    marginBottom: "16px",
    padding: "13px 15px",
    border: "1px solid #5b2930",
    borderRadius: "9px",
    background: "#29151a",
  },

  errorIcon: {
    width: "24px",
    height: "24px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
    background: "#482129",
    color: "#ff9ca8",
    fontSize: "12px",
    fontWeight: 800,
  },

  errorTitle: {
    display: "block",
    color: "#ff9ca8",
    fontSize: "11px",
  },

  errorText: {
    marginTop: "3px",
    color: "#d9949e",
    fontSize: "10px",
  },

  empty: {
    padding: "60px 20px",
    border: "1px dashed #26394d",
    borderRadius: "14px",
    background: "#08131f",
    textAlign: "center",
  },

  emptyIcon: {
    width: "48px",
    height: "48px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #1b3b50",
    borderRadius: "12px",
    background: "#0c2131",
    color: "#00d2ff",
    fontSize: "22px",
  },

  emptyTitle: {
    margin: "15px 0 6px",
    color: "#d8e4ef",
    fontSize: "14px",
    fontWeight: 750,
  },

  emptyText: {
    maxWidth: "400px",
    margin: "0 auto",
    color: "#61768b",
    fontSize: "11px",
    lineHeight: 1.6,
  },

  security: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "22px",
    padding: "15px 16px",
    border: "1px solid #1b3448",
    borderRadius: "10px",
    background: "#091522",
  },

  securityIcon: {
    width: "29px",
    height: "29px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "7px",
    background: "#10382f",
    color: "#65e6b1",
    fontSize: "12px",
    fontWeight: 800,
  },

  securityTitle: {
    display: "block",
    color: "#b9c8d6",
    fontSize: "11px",
  },

  securityText: {
    margin: "4px 0 0",
    color: "#61768b",
    fontSize: "9px",
    lineHeight: 1.5,
  },

  securityBadge: {
    marginLeft: "auto",
    padding: "5px 7px",
    border: "1px solid #20463d",
    borderRadius: "5px",
    background: "#0d2923",
    color: "#65e6b1",
    fontSize: "7px",
    fontWeight: 800,
    letterSpacing: "0.7px",
  },
};

export default Tokens;