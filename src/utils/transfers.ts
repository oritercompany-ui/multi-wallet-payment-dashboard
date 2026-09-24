import {
  BrowserProvider,
  Contract,
  formatEther,
  formatUnits,
  parseUnits,
  isAddress,
} from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
];

export interface GasEstimateData {
  gasLimit: string;
  gasPrice: string;
  estimatedFee: string;
  nativeSymbol: string;
}

export interface TransferResult {
  hash: string;
}

/**
 * Estimate ERC-20 gas
 */
export async function estimateERC20Gas(
  tokenAddress: string,
  recipient: string,
  amount: string,
  decimals: number
): Promise<GasEstimateData> {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask belum terinstall."
    );
  }

  if (!isAddress(tokenAddress)) {
    throw new Error(
      "Token contract address tidak valid."
    );
  }

  if (!isAddress(recipient)) {
    throw new Error(
      "Recipient wallet address tidak valid."
    );
  }

  if (!amount || Number(amount) <= 0) {
    throw new Error(
      "Jumlah token harus lebih dari 0."
    );
  }

  const provider =
    new BrowserProvider(
      window.ethereum
    );

  const signer =
    await provider.getSigner();

  const network =
    await provider.getNetwork();

  const token =
    new Contract(
      tokenAddress,
      ERC20_ABI,
      signer
    );

  let parsedAmount;

  try {
    parsedAmount =
      parseUnits(
        amount,
        decimals
      );
  } catch {
    throw new Error(
      "Jumlah token tidak valid."
    );
  }

  try {
    const gasLimit =
      await token.transfer.estimateGas(
        recipient,
        parsedAmount
      );

    const feeData =
      await provider.getFeeData();

    if (!feeData.gasPrice) {
      throw new Error(
        "Gas price tidak tersedia."
      );
    }

    const estimatedFee =
      gasLimit *
      feeData.gasPrice;

    const nativeSymbol =
      network.chainId === 137n
        ? "POL"
        : "ETH";

    return {
      gasLimit:
        gasLimit.toString(),

      gasPrice:
        formatUnits(
          feeData.gasPrice,
          "gwei"
        ),

      estimatedFee:
        formatEther(
          estimatedFee
        ),

      nativeSymbol,
    };
  } catch {
    throw new Error(
      "Gagal melakukan estimasi gas. Pastikan token, recipient, amount, balance token, dan network sudah benar."
    );
  }
}

/**
 * Send ERC-20 token
 */
export async function sendERC20(
  tokenAddress: string,
  recipient: string,
  amount: string,
  decimals: number
): Promise<TransferResult> {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask belum terinstall."
    );
  }

  if (!isAddress(tokenAddress)) {
    throw new Error(
      "Token contract address tidak valid."
    );
  }

  if (!isAddress(recipient)) {
    throw new Error(
      "Recipient wallet address tidak valid."
    );
  }

  if (!amount || Number(amount) <= 0) {
    throw new Error(
      "Jumlah token harus lebih dari 0."
    );
  }

  const provider =
    new BrowserProvider(
      window.ethereum
    );

  const signer =
    await provider.getSigner();

  const token =
    new Contract(
      tokenAddress,
      ERC20_ABI,
      signer
    );

  let parsedAmount;

  try {
    parsedAmount =
      parseUnits(
        amount,
        decimals
      );
  } catch {
    throw new Error(
      "Jumlah token tidak valid."
    );
  }

  let transaction;

  try {
    transaction =
      await token.transfer(
        recipient,
        parsedAmount
      );
  } catch (error: any) {
    if (error?.code === 4001) {
      throw new Error(
        "Transaksi dibatalkan di MetaMask."
      );
    }

    throw new Error(
      "Gagal mengirim token. Pastikan balance token dan native gas mencukupi."
    );
  }

  try {
    // Tunggu sampai transaksi mendapatkan confirmation
    await transaction.wait();
  } catch {
    const error =
      new Error(
        "Transaksi token gagal atau revert setelah dikirim."
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

