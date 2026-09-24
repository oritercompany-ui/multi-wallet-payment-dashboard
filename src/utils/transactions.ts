import { formatEther } from "ethers";

const BLOCKSCOUT_API =
  "https://eth-sepolia.blockscout.com/api/v2";

export interface TransactionData {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  timestamp: string;
  status: string;
  blockNumber: number;
  fee: string;
}

interface BlockscoutTransaction {
  hash: string;
  from?: {
    hash?: string;
  };
  to?: {
    hash?: string;
  } | null;
  value?: string;
  timestamp?: string;
  status?: string;
  block?: number;
  fee?: {
    value?: string;
  };
}

interface BlockscoutResponse {
  items?: BlockscoutTransaction[];
}

export async function getTransactions(
  address: string
): Promise<TransactionData[]> {
  const url =
    `${BLOCKSCOUT_API}/addresses/${address}/transactions`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Gagal mengambil transaction history. HTTP ${response.status}`
    );
  }

  const data: BlockscoutResponse = await response.json();

  if (!data.items) {
    return [];
  }

  return data.items.map((tx) => ({
    hash: tx.hash,
    from: tx.from?.hash ?? "",
    to: tx.to?.hash ?? null,
    value: formatEther(tx.value ?? "0"),
    timestamp: tx.timestamp ?? "",
    status: tx.status ?? "unknown",
    blockNumber: tx.block ?? 0,
    fee: formatEther(tx.fee?.value ?? "0"),
  }));
}