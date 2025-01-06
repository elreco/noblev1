export interface BridgeFormData {
  amount: string;
  recipient: string;
}

export interface TransactionState {
  loading: boolean;
  error: string;
  success: boolean;
  hash?: string;
}
