export interface TransactionHistoryItem {
  hash: string;
  type: "ETH" | "ERC20";
  asset: string;
  amount: string;
  recipient: string;
  timestamp: number;
  status: "submitted" | "confirmed" | "failed";
  chainId: string;
}

const STORAGE_KEY = "opay_transaction_history";

export function getTransactionHistory(
  walletAddress: string
): TransactionHistoryItem[] {
  try {
    const saved = localStorage.getItem(
      `${STORAGE_KEY}_${walletAddress.toLowerCase()}`
    );

    if (!saved) {
      return [];
    }

    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function saveTransactionHistory(
  walletAddress: string,
  transaction: TransactionHistoryItem
) {
  const existing =
    getTransactionHistory(walletAddress);

  const updated = [
    transaction,
    ...existing,
  ];

  localStorage.setItem(
    `${STORAGE_KEY}_${walletAddress.toLowerCase()}`,
    JSON.stringify(updated)
  );
}

export function clearTransactionHistory(
  walletAddress: string
) {
  localStorage.removeItem(
    `${STORAGE_KEY}_${walletAddress.toLowerCase()}`
  );
}