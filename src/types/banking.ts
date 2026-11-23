export type Language = 'en' | 'am';

export type NavTab = 'home' | 'history' | 'qr' | 'settings';

export type ServiceId =
  | 'send'
  | 'transfers'
  | 'qr'
  | 'airtime'
  | 'bills'
  | 'merchant'
  | 'cashout'
  | 'loan';

export type ModalContext =
  | { type: 'service'; serviceId: ServiceId; presetRecipient?: string; presetAmount?: number }
  | { type: 'miniStatement' }
  | { type: 'accountDetails' }
  | { type: 'receipt'; transaction: Transaction }
  | { type: 'notifications' }
  | null;

export type TransactionCategory = 'transfer' | 'income' | 'airtime' | 'bill' | 'merchant' | 'cashout' | 'loan';

export interface Transaction {
  id: string;
  reference: string;
  title: string;
  titleAm: string;
  counterparty: string;
  accountOrPhone: string;
  category: TransactionCategory;
  direction: 'debit' | 'credit';
  amountEtb: number;
  feeEtb: number;
  timestamp: string;
  note?: string;
  recipientPhone?: string;
  balanceAfterEtb?: number;
  status: 'Completed' | 'Pending';
}

export interface BankAccount {
  id: string;
  type: string;
  typeAm: string;
  maskedNumber: string;
  fullNumber: string;
  branch: string;
  branchAm: string;
  balanceEtb: number;
  dailyLimitEtb: number;
  interestRate: string;
  iban: string;
}

export interface QuickContact {
  id: string;
  name: string;
  nameAm: string;
  accountNumber: string;
  phone: string;
  initials: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  titleAm: string;
  detail: string;
  detailAm: string;
  timeAgo: string;
  read: boolean;
}

export interface UserSettings {
  hideBalanceOnStart: boolean;
  biometricLogin: boolean;
  smsAlerts: boolean;
  dailyLimitEtb: number;
}
