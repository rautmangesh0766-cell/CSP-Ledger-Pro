export enum TransactionType {
  CUSTOMER_DEPOSIT = 'Deposit',
  CUSTOMER_WITHDRAWAL = 'Withdrawal',
  CUSTOMER_TRANSFER = 'Money Transfer',
  CSP_DEPOSIT_TO_BANK = 'Cash Deposit to Bank',
  CSP_WITHDRAWAL_FROM_BANK = 'Cash Withdrawal from Bank',
}

export interface Transaction {
  id: string;
  date: string; // ISO string
  type: TransactionType;
  amount: number;
  customerName?: string;
  customerIdentifier?: string; // Aadhaar or Account Number
  customerMobile?: string;
  description?: string;
  isHighlighted?: boolean;
}

export interface LedgerSummary {
  remainingBalance: number;
  cashInHand: number;
  withdrawalToday: number;
  depositToday: number;
  totalDebited: number;
  totalDeposited: number;
}

export interface Customer {
  id: string;
  name: string;
  identifier: string; // Aadhaar or Account Number
  mobile?: string;
}
