import { useEffect, useState } from "react";

import {
  sendPayment,
  switchNetwork,
  verifyPayment,
} from "../utils/ethereum";

interface InvoicesProps {
  walletAddress: string;
  chainId: string;
}

type InvoiceStatus =
  | "pending"
  | "paid"
  | "cancelled";

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
  status: InvoiceStatus;
  createdAt: number;
  paidAt?: number;
  transactionHash?: string;
  payer?: string;
  createdBy?: string;
}

type Filter =
  | "all"
  | "pending"
  | "paid"
  | "cancelled";

const API_BASE_URL =
  "http://localhost:5000";

function Invoices({
  walletAddress,
}: InvoicesProps) {
  const [invoices, setInvoices] = useState<
    PaymentRequest[]
  >([]);

  const [filter, setFilter] =
    useState<Filter>("all");

  const [selectedInvoice, setSelectedInvoice] =
    useState<PaymentRequest | null>(null);

  const [showPaymentConfirm, setShowPaymentConfirm] =
    useState(false);

  const [isPaying, setIsPaying] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [paymentError, setPaymentError] =
    useState("");

  const [paymentSuccess, setPaymentSuccess] =
    useState("");

  const [copiedInvoiceId, setCopiedInvoiceId] =
    useState("");

  function mapInvoice(
    invoice: any
  ): PaymentRequest {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      title: invoice.title,
      description: invoice.description || "",
      amount: invoice.amount,
      asset: invoice.asset,

      ...(invoice.tokenAddress
        ? {
            tokenAddress:
              invoice.tokenAddress,
          }
        : {}),

      recipient: invoice.recipient,
      chainId: invoice.chainId,
      status: invoice.status,

      createdAt: new Date(
        invoice.createdAt
      ).getTime(),

      ...(invoice.paidAt
        ? {
            paidAt: new Date(
              invoice.paidAt
            ).getTime(),
          }
        : {}),

      ...(invoice.transactionHash
        ? {
            transactionHash:
              invoice.transactionHash,
          }
        : {}),

      ...(invoice.payer
        ? {
            payer: invoice.payer,
          }
        : {}),

      ...(invoice.createdBy
        ? {
            createdBy:
              invoice.createdBy,
          }
        : {}),
    };
  }

  async function loadInvoices() {
    try {
      setIsLoading(true);
      setPaymentError("");

      const response =
        await fetch(
          `${API_BASE_URL}/invoices?createdBy=${encodeURIComponent(
            walletAddress
          )}`
        );

      let data: any = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Failed to retrieve invoices."
        );
      }

      const backendInvoices =
        Array.isArray(data)
          ? data
          : Array.isArray(
                data?.invoices
              )
            ? data.invoices
            : Array.isArray(
                  data?.data
                )
              ? data.data
              : [];

      const mappedInvoices =
        backendInvoices.map(
          mapInvoice
        );

      setInvoices(
        mappedInvoices
      );
    } catch (error) {
      setPaymentError(
        error instanceof Error
          ? error.message
          : "Failed to retrieve invoices."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, [walletAddress]);

  const filteredInvoices =
    invoices.filter((invoice) => {
      if (filter === "all") {
        return true;
      }

      return invoice.status === filter;
    });

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
    return `${address.slice(
      0,
      8
    )}...${address.slice(-6)}`;
  }

  function shortenHash(
    hash: string
  ) {
    return `${hash.slice(
      0,
      10
    )}...${hash.slice(-8)}`;
  }

  function getStatusStyle(
    status: PaymentRequest["status"]
  ) {
    switch (status) {
      case "paid":
        return styles.statusPaid;

      case "cancelled":
        return styles.statusCancelled;

      default:
        return styles.statusPending;
    }
  }

  function getPaymentLink(
    invoiceId: string
  ) {
    return `${window.location.origin}/pay/${encodeURIComponent(
      invoiceId
    )}`;
  }

  async function handleCopyPaymentLink(
    invoiceId: string
  ) {
    try {
      const paymentLink =
        getPaymentLink(invoiceId);

      await navigator.clipboard.writeText(
        paymentLink
      );

      setCopiedInvoiceId(
        invoiceId
      );

      setPaymentError("");

      setPaymentSuccess(
        "Payment link copied successfully."
      );

      setTimeout(() => {
        setCopiedInvoiceId("");
      }, 2000);
    } catch {
      setPaymentSuccess("");

      setPaymentError(
        "Failed to copy payment link."
      );
    }
  }

  async function handlePayInvoice() {
    if (!selectedInvoice) {
      return;
    }

    setIsPaying(true);
    setPaymentError("");
    setPaymentSuccess("");

    try {
      if (
        selectedInvoice.asset !==
        "ETH"
      ) {
        throw new Error(
          "Currently, only ETH payments are supported."
        );
      }

      if (
        selectedInvoice.chainId !==
        "11155111"
      ) {
        throw new Error(
          "This invoice is not configured for Ethereum Sepolia."
        );
      }

      await switchNetwork(
        "11155111"
      );

      const result =
        await sendPayment(
          selectedInvoice.recipient,
          selectedInvoice.amount
        );

      const verification =
        await verifyPayment(
          result.hash,
          selectedInvoice.recipient,
          selectedInvoice.amount
        );

      if (!verification.verified) {
        throw new Error(
          "Payment could not be verified."
        );
      }

      const paidAt =
        Date.now();

      const response =
        await fetch(
          `${API_BASE_URL}/invoices/${encodeURIComponent(
            selectedInvoice.id
          )}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              status: "paid",

              paidAt:
                new Date(
                  paidAt
                ).toISOString(),

              transactionHash:
                result.hash,

              payer:
                verification.from,
            }),
          }
        );

      let data: any = null;

      try {
        data =
          await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Payment succeeded on-chain, but the invoice could not be updated."
        );
      }

      const updatedInvoice: PaymentRequest = {
        ...selectedInvoice,

        status: "paid",

        paidAt,

        transactionHash:
          result.hash,

        payer:
          verification.from,
      };

      setSelectedInvoice(
        updatedInvoice
      );

      setInvoices((current) =>
        current.map((invoice) =>
          invoice.id ===
          selectedInvoice.id
            ? updatedInvoice
            : invoice
        )
      );

      setShowPaymentConfirm(
        false
      );

      setPaymentSuccess(
        "Payment submitted, verified on-chain, and the invoice was updated successfully."
      );
    } catch (error: any) {
      setPaymentError(
        error?.message ||
          "Payment failed."
      );
    } finally {
      setIsPaying(false);
    }
  }

  /*
   * PAYMENT CONFIRMATION
   */

  if (
    selectedInvoice &&
    showPaymentConfirm
  ) {
    return (
      <section>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>
              PAYMENT FLOW
            </p>

            <h1 style={styles.title}>
              Confirm Payment
            </h1>

            <p style={styles.subtitle}>
              Review the transaction details
              before signing with MetaMask.
            </p>
          </div>

          <button
            style={styles.backButton}
            onClick={() =>
              !isPaying &&
              setShowPaymentConfirm(
                false
              )
            }
            disabled={isPaying}
          >
            ← Back
          </button>
        </div>

        <div style={styles.confirmLayout}>
          <div
            style={
              styles.confirmMainCard
            }
          >
            <div
              style={
                styles.paymentOrb
              }
            >
              Ξ
            </div>

            <p
              style={
                styles.confirmEyebrow
              }
            >
              PAYMENT REQUEST
            </p>

            <h2
              style={
                styles.confirmInvoiceNumber
              }
            >
              {
                selectedInvoice.invoiceNumber
              }
            </h2>

            <p
              style={
                styles.confirmTitle
              }
            >
              {selectedInvoice.title}
            </p>

            <div
              style={
                styles.confirmAmount
              }
            >
              <span>
                {selectedInvoice.amount}
              </span>

              <small>
                {selectedInvoice.asset}
              </small>
            </div>

            <div
              style={
                styles.confirmNetwork
              }
            >
              <span
                style={
                  styles.networkDot
                }
              />

              Ethereum Sepolia
            </div>

            {paymentError && (
              <div
                style={
                  styles.errorBox
                }
              >
                <span>!</span>
                {paymentError}
              </div>
            )}

            <div
              style={
                styles.paymentWarning
              }
            >
              <strong
                style={
                  styles.warningTitle
                }
              >
                MetaMask confirmation
              </strong>

              <p
                style={
                  styles.warningText
                }
              >
                Your wallet will open to
                review and authorize this
                Ethereum transaction. Network
                fees are paid separately by
                the connected wallet.
              </p>
            </div>

            <button
              style={{
                ...styles.payButton,
                opacity: isPaying
                  ? 0.55
                  : 1,
                cursor: isPaying
                  ? "not-allowed"
                  : "pointer",
              }}
              onClick={
                handlePayInvoice
              }
              disabled={isPaying}
            >
              {isPaying
                ? "Processing Transaction..."
                : "Confirm & Pay"}
            </button>
          </div>

          <div
            style={
              styles.confirmSideCard
            }
          >
            <p
              style={
                styles.sideCardLabel
              }
            >
              TRANSACTION DETAILS
            </p>

            <div
              style={
                styles.sideDetail
              }
            >
              <span>Recipient</span>

              <strong>
                {shortenAddress(
                  selectedInvoice.recipient
                )}
              </strong>
            </div>

            <div
              style={
                styles.sideDetail
              }
            >
              <span>Network</span>

              <strong>
                Ethereum Sepolia
              </strong>
            </div>

            <div
              style={
                styles.sideDetail
              }
            >
              <span>Asset</span>

              <strong>
                {selectedInvoice.asset}
              </strong>
            </div>

            <div
              style={
                styles.sideDetail
              }
            >
              <span>Status</span>

              <strong
                style={
                  styles.sidePending
                }
              >
                PENDING
              </strong>
            </div>
          </div>
        </div>
      </section>
    );
  }

  /*
   * INVOICE DETAIL
   */

  if (selectedInvoice) {
    return (
      <section>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>
              PAYMENT MANAGEMENT
            </p>

            <h1 style={styles.title}>
              Invoice Detail
            </h1>

            <p style={styles.subtitle}>
              Review payment information,
              verification status, and the
              shareable payment link.
            </p>
          </div>

          <button
            style={styles.backButton}
            onClick={() => {
              setSelectedInvoice(
                null
              );

              setPaymentError("");
              setPaymentSuccess("");
            }}
          >
            ← Back to Invoices
          </button>
        </div>

        <div style={styles.detailCard}>
          <div style={styles.detailTop}>
            <div>
              <p
                style={
                  styles.invoiceLabel
                }
              >
                INVOICE NUMBER
              </p>

              <h2
                style={
                  styles.invoiceNumber
                }
              >
                {
                  selectedInvoice.invoiceNumber
                }
              </h2>

              <p
                style={
                  styles.detailMuted
                }
              >
                Created{" "}
                {formatDate(
                  selectedInvoice.createdAt
                )}
              </p>
            </div>

            <span
              style={getStatusStyle(
                selectedInvoice.status
              )}
            >
              <span
                style={
                  styles.statusDot
                }
              />

              {selectedInvoice.status.toUpperCase()}
            </span>
          </div>

          {paymentSuccess && (
            <div
              style={
                styles.successBox
              }
            >
              <span>✓</span>
              {paymentSuccess}
            </div>
          )}

          {paymentError && (
            <div
              style={
                styles.errorBox
              }
            >
              <span>!</span>
              {paymentError}
            </div>
          )}

          <div
            style={
              styles.heroAmountCard
            }
          >
            <div>
              <span
                style={
                  styles.heroAmountLabel
                }
              >
                PAYMENT AMOUNT
              </span>

              <strong
                style={
                  styles.heroAmount
                }
              >
                {selectedInvoice.amount}
                <small>
                  {" "}
                  {selectedInvoice.asset}
                </small>
              </strong>
            </div>

            <div
              style={
                styles.heroAmountIcon
              }
            >
              Ξ
            </div>
          </div>

          <div
            style={
              styles.detailGrid
            }
          >
            <DetailItem
              label="Title"
              value={
                selectedInvoice.title
              }
            />

            <DetailItem
              label="Network"
              value={
                selectedInvoice.chainId ===
                "11155111"
                  ? "Ethereum Sepolia"
                  : `Chain ID ${selectedInvoice.chainId}`
              }
            />

            <DetailItem
              label="Description"
              value={
                selectedInvoice.description ||
                "-"
              }
            />

            <DetailItem
              label="Created At"
              value={formatDate(
                selectedInvoice.createdAt
              )}
            />
          </div>

          <div
            style={
              styles.addressSection
            }
          >
            <p
              style={
                styles.detailLabel
              }
            >
              RECIPIENT WALLET
            </p>

            <div
              style={
                styles.addressBox
              }
            >
              <span>
                {selectedInvoice.recipient}
              </span>
            </div>
          </div>

          {selectedInvoice.payer && (
            <div
              style={
                styles.addressSection
              }
            >
              <p
                style={
                  styles.detailLabel
                }
              >
                PAYER WALLET
              </p>

              <div
                style={
                  styles.addressBox
                }
              >
                <span>
                  {selectedInvoice.payer}
                </span>

                <span
                  style={
                    styles.verifiedBadge
                  }
                >
                  VERIFIED
                </span>
              </div>
            </div>
          )}

          {selectedInvoice.asset ===
            "ERC20" &&
            selectedInvoice.tokenAddress && (
              <div
                style={
                  styles.addressSection
                }
              >
                <p
                  style={
                    styles.detailLabel
                  }
                >
                  TOKEN CONTRACT
                </p>

                <div
                  style={
                    styles.addressBox
                  }
                >
                  <span>
                    {
                      selectedInvoice.tokenAddress
                    }
                  </span>
                </div>
              </div>
            )}

          {selectedInvoice.paidAt && (
            <div
              style={
                styles.detailSection
              }
            >
              <p
                style={
                  styles.detailLabel
                }
              >
                PAID AT
              </p>

              <p
                style={
                  styles.detailValue
                }
              >
                {formatDate(
                  selectedInvoice.paidAt
                )}
              </p>
            </div>
          )}

          {selectedInvoice.transactionHash && (
            <div
              style={
                styles.addressSection
              }
            >
              <p
                style={
                  styles.detailLabel
                }
              >
                TRANSACTION HASH
              </p>

              <div
                style={
                  styles.addressBox
                }
              >
                <span>
                  {shortenHash(
                    selectedInvoice.transactionHash
                  )}
                </span>

                <a
                  href={`https://sepolia.etherscan.io/tx/${selectedInvoice.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={
                    styles.explorerLink
                  }
                >
                  View on Explorer ↗
                </a>
              </div>
            </div>
          )}

          <div
            style={
              styles.shareSection
            }
          >
            <div>
              <p
                style={
                  styles.detailLabel
                }
              >
                SHAREABLE PAYMENT LINK
              </p>

              <p
                style={
                  styles.shareDescription
                }
              >
                Send this link to the customer
                to open the payment page.
              </p>
            </div>

            <div
              style={
                styles.linkBox
              }
            >
              <span
                style={
                  styles.linkText
                }
              >
                {getPaymentLink(
                  selectedInvoice.id
                )}
              </span>

              <button
                style={
                  styles.copyLinkButton
                }
                onClick={() =>
                  handleCopyPaymentLink(
                    selectedInvoice.id
                  )
                }
              >
                {copiedInvoiceId ===
                selectedInvoice.id
                  ? "Copied"
                  : "Copy Link"}
              </button>
            </div>
          </div>

          {selectedInvoice.status ===
            "pending" && (
            <button
              style={
                styles.payButton
              }
              onClick={() => {
                setPaymentError("");
                setPaymentSuccess("");
                setShowPaymentConfirm(
                  true
                );
              }}
            >
              Pay Invoice
              <span>→</span>
            </button>
          )}
        </div>
      </section>
    );
  }

  /*
   * INVOICE LIST
   */

  return (
    <section>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>
            PAYMENT MANAGEMENT
          </p>

          <h1 style={styles.title}>
            Invoices
          </h1>

          <p style={styles.subtitle}>
            Create, monitor, and manage
            blockchain payment requests.
          </p>
        </div>

        <button
          style={
            styles.refreshButton
          }
          onClick={loadInvoices}
          disabled={isLoading}
        >
          <span>↻</span>

          {isLoading
            ? "Loading..."
            : "Refresh"}
        </button>
      </div>

      {paymentError && (
        <div
          style={
            styles.errorBox
          }
        >
          <span>!</span>
          {paymentError}
        </div>
      )}

      <div style={styles.stats}>
        <StatCard
          label="TOTAL INVOICES"
          value={invoices.length}
          icon="▤"
        />

        <StatCard
          label="PENDING"
          value={
            invoices.filter(
              (invoice) =>
                invoice.status ===
                "pending"
            ).length
          }
          icon="◷"
        />

        <StatCard
          label="PAID"
          value={
            invoices.filter(
              (invoice) =>
                invoice.status ===
                "paid"
            ).length
          }
          icon="✓"
        />

        <StatCard
          label="CANCELLED"
          value={
            invoices.filter(
              (invoice) =>
                invoice.status ===
                "cancelled"
            ).length
          }
          icon="×"
        />
      </div>

      <div
        style={
          styles.toolbar
        }
      >
        <div
          style={
            styles.filters
          }
        >
          {(
            [
              ["all", "All"],
              ["pending", "Pending"],
              ["paid", "Paid"],
              [
                "cancelled",
                "Cancelled",
              ],
            ] as [
              Filter,
              string
            ][]
          ).map(
            ([value, label]) => (
              <button
                key={value}
                style={
                  filter === value
                    ? styles.filterActive
                    : styles.filterButton
                }
                onClick={() =>
                  setFilter(value)
                }
              >
                {label}
              </button>
            )
          )}
        </div>

        <span
          style={
            styles.resultCount
          }
        >
          {filteredInvoices.length}{" "}
          result
          {filteredInvoices.length !==
          1
            ? "s"
            : ""}
        </span>
      </div>

      {filteredInvoices.length ===
      0 ? (
        <div
          style={
            styles.empty
          }
        >
          <div
            style={
              styles.emptyIcon
            }
          >
            ◇
          </div>

          <h3
            style={
              styles.emptyTitle
            }
          >
            {isLoading
              ? "Loading invoices..."
              : "No invoices found"}
          </h3>

          <p
            style={
              styles.emptyText
            }
          >
            {isLoading
              ? "Retrieving payment requests from the backend..."
              : "There are no invoices matching the selected filter."}
          </p>
        </div>
      ) : (
        <div
          style={
            styles.tableCard
          }
        >
          <div
            style={
              styles.tableHeader
            }
          >
            <span>Invoice</span>
            <span>Amount</span>
            <span>Status</span>
            <span>Created</span>
            <span>Actions</span>
          </div>

          {filteredInvoices.map(
            (invoice) => (
              <div
                key={invoice.id}
                style={
                  styles.tableRow
                }
              >
                <div
                  style={
                    styles.invoiceCell
                  }
                >
                  <div
                    style={
                      styles.invoiceIcon
                    }
                  >
                    {invoice.status ===
                    "paid"
                      ? "✓"
                      : "◇"}
                  </div>

                  <div
                    style={
                      styles.invoiceInfo
                    }
                  >
                    <strong
                      style={
                        styles.invoiceTitle
                      }
                    >
                      {
                        invoice.invoiceNumber
                      }
                    </strong>

                    <span
                      style={
                        styles.invoiceDescription
                      }
                    >
                      {invoice.title}
                    </span>
                  </div>
                </div>

                <div
                  style={
                    styles.tableAmount
                  }
                >
                  <strong>
                    {invoice.amount}
                  </strong>

                  <span>
                    {invoice.asset}
                  </span>
                </div>

                <div>
                  <span
                    style={getStatusStyle(
                      invoice.status
                    )}
                  >
                    <span
                      style={
                        styles.statusDot
                      }
                    />

                    {invoice.status}
                  </span>
                </div>

                <div
                  style={
                    styles.tableDate
                  }
                >
                  {formatDate(
                    invoice.createdAt
                  )}
                </div>

                <div
                  style={
                    styles.actionGroup
                  }
                >
                  <button
                    style={
                      styles.viewButton
                    }
                    onClick={() =>
                      setSelectedInvoice(
                        invoice
                      )
                    }
                  >
                    View
                  </button>

                  <button
                    style={
                      styles.copySmallButton
                    }
                    onClick={() =>
                      handleCopyPaymentLink(
                        invoice.id
                      )
                    }
                  >
                    {copiedInvoiceId ===
                    invoice.id
                      ? "Copied"
                      : "Copy"}
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </section>
  );
}

/* =========================
   SMALL UI COMPONENTS
========================= */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: string;
}) {
  return (
    <div style={styles.statCard}>
      <div
        style={
          styles.statIcon
        }
      >
        {icon}
      </div>

      <div>
        <span
          style={
            styles.statLabel
          }
        >
          {label}
        </span>

        <strong
          style={
            styles.statValue
          }
        >
          {value}
        </strong>
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p
        style={
          styles.detailLabel
        }
      >
        {label}
      </p>

      <p
        style={
          styles.detailValue
        }
      >
        {value}
      </p>
    </div>
  );
}

/* =========================
   STYLES
========================= */

const styles: Record<
  string,
  React.CSSProperties
> = {
  header: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap: "20px",
    marginBottom: "28px",
  },

  eyebrow: {
    margin: 0,
    color: "#4e7087",
    fontSize: "8px",
    fontWeight: 900,
    letterSpacing: "1.8px",
  },

  title: {
    margin: "7px 0 0",
    color: "#edf5fa",
    fontSize: "30px",
    fontWeight: 800,
    letterSpacing: "-1px",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#6f8599",
    fontSize: "11px",
    lineHeight: 1.6,
  },

  refreshButton: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "9px 13px",
    border:
      "1px solid rgba(0,210,255,0.18)",
    borderRadius: "8px",
    background:
      "rgba(9,25,39,0.8)",
    color: "#00d2ff",
    fontSize: "10px",
    fontWeight: 800,
    cursor: "pointer",
  },

  backButton: {
    padding: "9px 13px",
    border:
      "1px solid rgba(70,96,119,0.25)",
    borderRadius: "8px",
    background:
      "rgba(9,21,34,0.8)",
    color: "#8ea3b6",
    fontSize: "10px",
    fontWeight: 700,
    cursor: "pointer",
  },

  stats: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "12px",
    marginBottom: "20px",
  },

  statCard: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "15px",
    border:
      "1px solid rgba(70,96,119,0.16)",
    borderRadius: "11px",
    background:
      "linear-gradient(145deg, rgba(9,25,39,0.95), rgba(6,17,28,0.95))",
  },

  statIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "31px",
    height: "31px",
    flexShrink: 0,
    border:
      "1px solid rgba(0,210,255,0.13)",
    borderRadius: "8px",
    background:
      "rgba(0,210,255,0.055)",
    color: "#00d2ff",
    fontSize: "12px",
  },

  statLabel: {
    display: "block",
    marginBottom: "3px",
    color: "#496177",
    fontSize: "7px",
    fontWeight: 800,
    letterSpacing: "1px",
  },

  statValue: {
    display: "block",
    color: "#eaf4f9",
    fontSize: "20px",
    fontWeight: 800,
  },

  toolbar: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "15px",
    marginBottom: "12px",
  },

  filters: {
    display: "flex",
    gap: "6px",
  },

  filterButton: {
    padding: "7px 12px",
    border:
      "1px solid rgba(70,96,119,0.22)",
    borderRadius: "7px",
    background:
      "rgba(7,18,29,0.75)",
    color: "#62798e",
    fontSize: "9px",
    fontWeight: 700,
    cursor: "pointer",
  },

  filterActive: {
    padding: "7px 12px",
    border:
      "1px solid rgba(0,210,255,0.35)",
    borderRadius: "7px",
    background:
      "rgba(0,210,255,0.08)",
    color: "#00d2ff",
    fontSize: "9px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow:
      "0 0 18px rgba(0,210,255,0.04)",
  },

  resultCount: {
    color: "#40576c",
    fontSize: "8px",
    fontWeight: 700,
  },

  tableCard: {
    overflow: "hidden",
    border:
      "1px solid rgba(70,96,119,0.16)",
    borderRadius: "12px",
    background:
      "rgba(7,18,29,0.88)",
    boxShadow:
      "0 20px 60px rgba(0,0,0,0.12)",
  },

  tableHeader: {
    display: "grid",
    gridTemplateColumns:
      "2fr 1.2fr 1fr 1.4fr 125px",
    gap: "15px",
    padding: "12px 16px",
    borderBottom:
      "1px solid rgba(70,96,119,0.14)",
    color: "#3f566a",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "1px",
    textTransform:
      "uppercase",
  },

  tableRow: {
    display: "grid",
    gridTemplateColumns:
      "2fr 1.2fr 1fr 1.4fr 125px",
    gap: "15px",
    alignItems: "center",
    minHeight: "67px",
    padding: "12px 16px",
    borderBottom:
      "1px solid rgba(70,96,119,0.09)",
    transition:
      "background 0.2s ease",
  },

  invoiceCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  },

  invoiceIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "30px",
    height: "30px",
    flexShrink: 0,
    borderRadius: "8px",
    background:
      "rgba(0,210,255,0.06)",
    border:
      "1px solid rgba(0,210,255,0.1)",
    color: "#00d2ff",
    fontSize: "11px",
    fontWeight: 800,
  },

  invoiceInfo: {
    minWidth: 0,
  },

  invoiceTitle: {
    display: "block",
    color: "#dce8f0",
    fontSize: "10px",
    fontWeight: 800,
  },

  invoiceDescription: {
    display: "block",
    marginTop: "4px",
    overflow: "hidden",
    color: "#536a7e",
    fontSize: "8px",
    textOverflow:
      "ellipsis",
    whiteSpace:
      "nowrap",
  },

  tableAmount: {
    color: "#dbe7f0",
    fontSize: "10px",
    fontWeight: 800,
  },

  tableAmountSpan: {
    color: "#4d6478",
    fontSize: "8px",
    marginLeft: "4px",
  },

  tableDate: {
    color: "#61778b",
    fontSize: "8px",
    lineHeight: 1.5,
  },

  actionGroup: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },

  viewButton: {
    padding: "6px 9px",
    border:
      "1px solid rgba(0,210,255,0.16)",
    borderRadius: "6px",
    background:
      "rgba(0,210,255,0.06)",
    color: "#00d2ff",
    fontSize: "8px",
    fontWeight: 800,
    cursor: "pointer",
  },

  copySmallButton: {
    padding: "6px 9px",
    border:
      "1px solid rgba(70,96,119,0.2)",
    borderRadius: "6px",
    background:
      "transparent",
    color: "#71869a",
    fontSize: "8px",
    fontWeight: 700,
    cursor: "pointer",
  },

  statusPending: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 7px",
    border:
      "1px solid rgba(224,174,65,0.13)",
    borderRadius: "6px",
    background:
      "rgba(74,55,16,0.35)",
    color: "#e0bb61",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "0.5px",
  },

  statusPaid: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 7px",
    border:
      "1px solid rgba(77,182,165,0.14)",
    borderRadius: "6px",
    background:
      "rgba(12,51,44,0.4)",
    color: "#65d8c7",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "0.5px",
  },

  statusCancelled: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 7px",
    border:
      "1px solid rgba(255,90,110,0.13)",
    borderRadius: "6px",
    background:
      "rgba(68,19,27,0.4)",
    color: "#ff9ca8",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "0.5px",
  },

  statusDot: {
    width: "4px",
    height: "4px",
    borderRadius: "50%",
    background:
      "currentColor",
    boxShadow:
      "0 0 6px currentColor",
  },

  empty: {
    padding: "65px 20px",
    textAlign: "center",
    border:
      "1px solid rgba(70,96,119,0.15)",
    borderRadius: "12px",
    background:
      "rgba(7,18,29,0.8)",
  },

  emptyIcon: {
    marginBottom: "12px",
    color: "#00d2ff",
    fontSize: "27px",
    textShadow:
      "0 0 20px rgba(0,210,255,0.2)",
  },

  emptyTitle: {
    margin: 0,
    color: "#dbe8f0",
    fontSize: "14px",
  },

  emptyText: {
    maxWidth: "390px",
    margin:
      "8px auto 0",
    color: "#536a7e",
    fontSize: "10px",
    lineHeight: 1.6,
  },

  detailCard: {
    maxWidth: "850px",
    padding: "24px",
    border:
      "1px solid rgba(70,96,119,0.17)",
    borderRadius: "15px",
    background:
      "linear-gradient(145deg, rgba(8,22,35,0.97), rgba(5,15,25,0.97))",
    boxShadow:
      "0 25px 80px rgba(0,0,0,0.16)",
  },

  detailTop: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
    gap: "20px",
    paddingBottom: "20px",
    borderBottom:
      "1px solid rgba(70,96,119,0.13)",
  },

  invoiceLabel: {
    margin: 0,
    color: "#40596d",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "1.3px",
  },

  invoiceNumber: {
    margin: "6px 0 0",
    color: "#eaf4f9",
    fontSize: "21px",
    fontWeight: 800,
    letterSpacing: "-0.4px",
  },

  detailMuted: {
    margin: "5px 0 0",
    color: "#4b6276",
    fontSize: "8px",
  },

  heroAmountCard: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginTop: "20px",
    padding: "18px",
    border:
      "1px solid rgba(0,210,255,0.12)",
    borderRadius: "10px",
    background:
      "linear-gradient(135deg, rgba(0,210,255,0.065), rgba(7,21,34,0.75))",
  },

  heroAmountLabel: {
    display: "block",
    marginBottom: "6px",
    color: "#4a667a",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "1.2px",
  },

  heroAmount: {
    display: "block",
    color: "#00d2ff",
    fontSize: "27px",
    fontWeight: 800,
    letterSpacing: "-1px",
    textShadow:
      "0 0 25px rgba(0,210,255,0.1)",
  },

  heroAmountSmall: {
    fontSize: "12px",
  },

  heroAmountIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "45px",
    height: "45px",
    border:
      "1px solid rgba(0,210,255,0.18)",
    borderRadius: "12px",
    background:
      "rgba(0,210,255,0.07)",
    color: "#00d2ff",
    fontSize: "20px",
  },

  detailSection: {
    marginTop: "20px",
  },

  detailGrid: {
    display: "grid",
    gridTemplateColumns:
      "1fr 1fr",
    gap: "20px",
    marginTop: "20px",
  },

  detailLabel: {
    margin: 0,
    color: "#425a6f",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "1px",
    textTransform:
      "uppercase",
  },

  detailValue: {
    margin: "6px 0 0",
    color: "#c9d9e5",
    fontSize: "10px",
    lineHeight: 1.6,
  },

  amount: {
    margin: "6px 0 0",
    color: "#00d2ff",
    fontSize: "17px",
    fontWeight: 800,
  },

  addressSection: {
    marginTop: "20px",
  },

  addressBox: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "space-between",
    gap: "12px",
    marginTop: "7px",
    padding: "10px 12px",
    border:
      "1px solid rgba(70,96,119,0.17)",
    borderRadius: "8px",
    background:
      "rgba(4,12,20,0.65)",
    color: "#849bad",
    fontFamily:
      "monospace",
    fontSize: "9px",
    lineHeight: 1.5,
    wordBreak:
      "break-all",
  },

  verifiedBadge: {
    flexShrink: 0,
    padding: "4px 6px",
    borderRadius: "5px",
    background:
      "rgba(77,182,165,0.08)",
    color: "#65d8c7",
    fontFamily:
      "Inter, sans-serif",
    fontSize: "6px",
    fontWeight: 900,
    letterSpacing: "0.8px",
  },

  explorerLink: {
    flexShrink: 0,
    color: "#00d2ff",
    fontFamily:
      "Inter, sans-serif",
    fontSize: "8px",
    fontWeight: 800,
    textDecoration: "none",
  },

  shareSection: {
    marginTop: "25px",
    paddingTop: "20px",
    borderTop:
      "1px solid rgba(70,96,119,0.13)",
  },

  shareDescription: {
    margin: "6px 0 0",
    color: "#52697c",
    fontSize: "9px",
  },

  linkBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "10px",
    padding: "9px",
    border:
      "1px solid rgba(70,96,119,0.2)",
    borderRadius: "8px",
    background:
      "rgba(4,12,20,0.7)",
  },

  linkText: {
    flex: 1,
    color: "#62798d",
    fontSize: "8px",
    lineHeight: 1.5,
    wordBreak:
      "break-all",
  },

  copyLinkButton: {
    flexShrink: 0,
    padding: "8px 11px",
    border:
      "1px solid rgba(0,210,255,0.14)",
    borderRadius: "6px",
    background:
      "rgba(0,210,255,0.06)",
    color: "#00d2ff",
    fontSize: "8px",
    fontWeight: 800,
    cursor: "pointer",
  },

  payButton: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    gap: "10px",
    width: "100%",
    marginTop: "25px",
    padding: "13px",
    border:
      "1px solid rgba(0,210,255,0.45)",
    borderRadius: "8px",
    background:
      "linear-gradient(135deg, #00d2ff, #00a9d0)",
    color: "#031018",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "0.2px",
    cursor: "pointer",
    boxShadow:
      "0 10px 30px rgba(0,210,255,0.09)",
  },

  paymentWarning: {
    marginTop: "20px",
    padding: "13px",
    border:
      "1px solid rgba(70,96,119,0.16)",
    borderRadius: "8px",
    background:
      "rgba(4,12,20,0.55)",
  },

  warningTitle: {
    display: "block",
    color: "#d4e2eb",
    fontSize: "9px",
  },

  warningText: {
    margin: "6px 0 0",
    color: "#5d7488",
    fontSize: "8px",
    lineHeight: 1.6,
  },

  successBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "16px",
    padding: "11px 13px",
    border:
      "1px solid rgba(77,182,165,0.18)",
    borderRadius: "8px",
    background:
      "rgba(12,45,39,0.6)",
    color: "#72d8ca",
    fontSize: "9px",
    lineHeight: 1.5,
  },

  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "16px",
    padding: "11px 13px",
    border:
      "1px solid rgba(255,90,110,0.18)",
    borderRadius: "8px",
    background:
      "rgba(57,16,24,0.6)",
    color: "#ff9da9",
    fontSize: "9px",
    lineHeight: 1.5,
    wordBreak:
      "break-word",
  },

  /*
   * PAYMENT CONFIRMATION
   */

  confirmLayout: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1fr) 260px",
    gap: "15px",
    maxWidth: "850px",
  },

  confirmMainCard: {
    padding: "30px",
    border:
      "1px solid rgba(0,210,255,0.12)",
    borderRadius: "15px",
    background:
      "linear-gradient(145deg, rgba(8,24,38,0.98), rgba(5,15,25,0.98))",
    textAlign: "center",
    boxShadow:
      "0 25px 80px rgba(0,0,0,0.16)",
  },

  paymentOrb: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "55px",
    height: "55px",
    margin:
      "0 auto 17px",
    border:
      "1px solid rgba(0,210,255,0.22)",
    borderRadius: "16px",
    background:
      "rgba(0,210,255,0.07)",
    color: "#00d2ff",
    fontSize: "24px",
    fontWeight: 700,
    boxShadow:
      "0 0 30px rgba(0,210,255,0.07)",
  },

  confirmEyebrow: {
    margin: 0,
    color: "#4b6a7e",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "1.5px",
  },

  confirmInvoiceNumber: {
    margin: "7px 0 0",
    color: "#edf6fa",
    fontSize: "21px",
    fontWeight: 800,
  },

  confirmTitle: {
    margin: "6px 0 0",
    color: "#667e91",
    fontSize: "9px",
  },

  confirmAmount: {
    display: "flex",
    alignItems: "baseline",
    justifyContent:
      "center",
    gap: "6px",
    marginTop: "22px",
    color: "#00d2ff",
    fontSize: "32px",
    fontWeight: 800,
    letterSpacing: "-1px",
    textShadow:
      "0 0 30px rgba(0,210,255,0.1)",
  },

  confirmAmountSmall: {
    color: "#5b7488",
    fontSize: "12px",
    letterSpacing: "0",
  },

  confirmNetwork: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "12px",
    padding: "6px 9px",
    border:
      "1px solid rgba(77,182,165,0.13)",
    borderRadius: "6px",
    background:
      "rgba(77,182,165,0.05)",
    color: "#6fcabd",
    fontSize: "7px",
    fontWeight: 800,
  },

  networkDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#65d8c7",
    boxShadow:
      "0 0 7px rgba(101,216,199,0.7)",
  },

  confirmSideCard: {
    alignSelf: "start",
    padding: "18px",
    border:
      "1px solid rgba(70,96,119,0.16)",
    borderRadius: "12px",
    background:
      "rgba(7,18,29,0.9)",
  },

  sideCardLabel: {
    margin:
      "0 0 15px",
    color: "#40596d",
    fontSize: "7px",
    fontWeight: 900,
    letterSpacing: "1.2px",
  },

  sideDetail: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    padding:
      "11px 0",
    borderBottom:
      "1px solid rgba(70,96,119,0.1)",
  },

  sideDetailSpan: {
    color: "#4c6579",
    fontSize: "7px",
  },

  sideDetailStrong: {
    color: "#b7c9d6",
    fontSize: "9px",
    fontWeight: 700,
  },

  sidePending: {
    color: "#e0bb61",
  },
};

export default Invoices;