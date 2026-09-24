import {
  BrowserProvider,
  Contract,
  formatUnits,
  isAddress,
} from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface TokenData {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
}

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
];

export async function getTokenData(
  tokenAddress: string,
  walletAddress: string
): Promise<TokenData> {
  if (!window.ethereum) {
    throw new Error("MetaMask belum terinstall.");
  }

  if (!isAddress(tokenAddress)) {
    throw new Error("Token contract address tidak valid.");
  }

  if (!isAddress(walletAddress)) {
    throw new Error("Wallet address tidak valid.");
  }

  const provider = new BrowserProvider(
    window.ethereum
  );

  const token = new Contract(
    tokenAddress,
    ERC20_ABI,
    provider
  );

  try {
    const [
      name,
      symbol,
      decimals,
      rawBalance,
    ] = await Promise.all([
      token.name(),
      token.symbol(),
      token.decimals(),
      token.balanceOf(walletAddress),
    ]);

    return {
      address: tokenAddress,
      name,
      symbol,
      decimals: Number(decimals),
      balance: formatUnits(
        rawBalance,
        Number(decimals)
      ),
    };
  } catch {
    throw new Error(
      "Gagal membaca token. Pastikan contract address adalah ERC-20 pada network yang sedang aktif."
    );
  }
}