export interface PaymentRequest {
  id: string;
  invoiceNumber: string;
  title: string;
  description: string;
  amount: string;

  asset: "ETH" | "ERC20";

  tokenAddress?: string;

  recipient: string;

  chainId: string;

  status:
    | "pending"
    | "paid"
    | "cancelled";

  createdAt: number;

  paidAt?: number;

  transactionHash?: string;

  payer?: string;
}

const STORAGE_KEY =
  "opay_payment_requests";

function getStorageKey(
  walletAddress: string
) {
  return `${STORAGE_KEY}_${walletAddress.toLowerCase()}`;
}

export function getPaymentRequests(
  walletAddress: string
): PaymentRequest[] {
  try {
    const saved =
      localStorage.getItem(
        getStorageKey(walletAddress)
      );

    if (!saved) {
      return [];
    }

    return JSON.parse(saved);
  } catch {
    return [];
  }
}

export function savePaymentRequest(
  walletAddress: string,
  request: PaymentRequest
) {
  const existing =
    getPaymentRequests(walletAddress);

  const updated = [
    request,
    ...existing,
  ];

  localStorage.setItem(
    getStorageKey(walletAddress),
    JSON.stringify(updated)
  );
}

export function updatePaymentRequest(
  walletAddress: string,
  requestId: string,
  updates: Partial<PaymentRequest>
) {
  const existing =
    getPaymentRequests(walletAddress);

  const updated = existing.map(
    (request) =>
      request.id === requestId
        ? {
            ...request,
            ...updates,
          }
        : request
  );

  localStorage.setItem(
    getStorageKey(walletAddress),
    JSON.stringify(updated)
  );
}

export function deletePaymentRequest(
  walletAddress: string,
  requestId: string
) {
  const existing =
    getPaymentRequests(walletAddress);

  const updated = existing.filter(
    (request) =>
      request.id !== requestId
  );

  localStorage.setItem(
    getStorageKey(walletAddress),
    JSON.stringify(updated)
  );
}

export function generateInvoiceNumber() {
  const timestamp =
    Date.now()
      .toString()
      .slice(-6);

  return `OP-${timestamp}`;
}