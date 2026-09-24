import {
  BrowserProvider,
  formatEther,
  parseEther,
} from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletData {
  address: string;
  balance: string;
  chainId: string;
  networkName: string;
}

export interface PaymentResult {
  hash: string;
}

export interface PaymentVerificationResult {
  verified: boolean;
  from: string;
  to: string;
  amount: string;
  status: number;
}

export interface NetworkData {
  chainId: string;
  networkName: string;
  nativeCurrency: string;
}

export const SUPPORTED_NETWORKS: NetworkData[] = [
  {
    chainId: "11155111",
    networkName: "Ethereum Sepolia",
    nativeCurrency: "ETH",
  },
  {
    chainId: "1",
    networkName: "Ethereum Mainnet",
    nativeCurrency: "ETH",
  },
  {
    chainId: "8453",
    networkName: "Base",
    nativeCurrency: "ETH",
  },
  {
    chainId: "137",
    networkName: "Polygon",
    nativeCurrency: "POL",
  },
  {
    chainId: "42161",
    networkName: "Arbitrum One",
    nativeCurrency: "ETH",
  },
];

export async function connectWallet(): Promise<WalletData> {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask belum terinstall. Silakan install MetaMask terlebih dahulu."
    );
  }

  const provider = new BrowserProvider(
    window.ethereum
  );

  const accounts = await provider.send(
    "eth_requestAccounts",
    []
  );

  if (!accounts || accounts.length === 0) {
    throw new Error(
      "Tidak ada wallet yang terhubung."
    );
  }

  const address = accounts[0];

  const network =
    await provider.getNetwork();

  const balance =
    await provider.getBalance(address);

  return {
    address,
    balance: formatEther(balance),
    chainId:
      network.chainId.toString(),
    networkName: getNetworkName(
      network.chainId.toString()
    ),
  };
}

export async function sendPayment(
  recipient: string,
  amount: string
): Promise<PaymentResult> {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask belum terinstall."
    );
  }

  if (!recipient) {
    throw new Error(
      "Recipient wallet address wajib diisi."
    );
  }

  if (!amount) {
    throw new Error(
      "Jumlah ETH wajib diisi."
    );
  }

  const provider =
    new BrowserProvider(
      window.ethereum
    );

  const signer =
    await provider.getSigner();

  const value =
    parseEther(amount);

  let transaction;

  try {
    transaction =
      await signer.sendTransaction({
        to: recipient,
        value,
      });
  } catch (error: any) {
    if (error?.code === 4001) {
      throw new Error(
        "Transaksi dibatalkan di MetaMask."
      );
    }

    throw new Error(
      "Gagal mengirim ETH."
    );
  }

  try {
    // Tunggu sampai transaksi mendapatkan confirmation
    await transaction.wait();
  } catch {
    const error =
      new Error(
        "Transaksi ETH gagal atau revert setelah dikirim."
      );

    // Simpan hash transaksi yang gagal
    (error as any).transactionHash =
      transaction.hash;

    throw error;
  }

  return {
    hash: transaction.hash,
  };
}

export async function verifyPayment(
  transactionHash: string,
  expectedRecipient: string,
  expectedAmount: string
): Promise<PaymentVerificationResult> {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask belum terinstall."
    );
  }

  if (!transactionHash) {
    throw new Error(
      "Transaction hash wajib tersedia."
    );
  }

  const provider =
    new BrowserProvider(
      window.ethereum
    );

  const network =
    await provider.getNetwork();

  if (
    network.chainId.toString() !==
    "11155111"
  ) {
    throw new Error(
      "Wallet harus berada di Ethereum Sepolia."
    );
  }

  const transaction =
    await provider.getTransaction(
      transactionHash
    );

  if (!transaction) {
    throw new Error(
      "Transaksi tidak ditemukan di blockchain."
    );
  }

  const receipt =
    await provider.getTransactionReceipt(
      transactionHash
    );

  if (!receipt) {
    throw new Error(
      "Transaction receipt belum tersedia."
    );
  }

  if (receipt.status !== 1) {
    throw new Error(
      "Transaksi gagal di blockchain."
    );
  }

  const expectedValue =
    parseEther(expectedAmount);

  if (
    transaction.to?.toLowerCase() !==
    expectedRecipient.toLowerCase()
  ) {
    throw new Error(
      "Recipient transaksi tidak sesuai dengan invoice."
    );
  }

  if (
    transaction.value !== expectedValue
  ) {
    throw new Error(
      "Jumlah ETH transaksi tidak sesuai dengan invoice."
    );
  }

  return {
    verified: true,
    from: transaction.from,
    to: transaction.to ?? "",
    amount: formatEther(
      transaction.value
    ),
    status: receipt.status,
  };
}

export async function getCurrentWallet(): Promise<
  WalletData | null
> {
  if (!window.ethereum) {
    return null;
  }

  const provider =
    new BrowserProvider(
      window.ethereum
    );

  const accounts =
    await provider.send(
      "eth_accounts",
      []
    );

  if (
    !accounts ||
    accounts.length === 0
  ) {
    return null;
  }

  const address = accounts[0];

  const network =
    await provider.getNetwork();

  const balance =
    await provider.getBalance(
      address
    );

  return {
    address,
    balance: formatEther(balance),
    chainId:
      network.chainId.toString(),
    networkName: getNetworkName(
      network.chainId.toString()
    ),
  };
}

export async function switchNetwork(
  chainId: string
): Promise<void> {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask belum terinstall."
    );
  }

  const hexChainId =
    `0x${BigInt(chainId).toString(16)}`;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [
        {
          chainId: hexChainId,
        },
      ],
    });
  } catch (error: any) {
    if (
      error?.code === 4902
    ) {
      throw new Error(
        "Network belum tersedia di MetaMask. Silakan tambahkan network ini terlebih dahulu."
      );
    }

    if (
      error?.code === 4001
    ) {
      throw new Error(
        "Pergantian network dibatalkan."
      );
    }

    throw new Error(
      "Gagal mengganti network."
    );
  }
}

function getNetworkName(
  chainId: string
): string {
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
      return `Unknown Network (${chainId})`;
  }
}