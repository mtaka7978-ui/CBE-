import React, { useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  GitFork,
  Home,
  Landmark,
  LayoutGrid,
  Phone,
  RefreshCw,
  Search,
  Settings,
  ShoppingCart,
  Store,
  Wallet,
  X,
} from 'lucide-react';
import {
  BankAccount,
  Language,
  ModalContext,
  NavTab,
  NotificationItem,
  ServiceId,
  Transaction,
  TransactionCategory,
  UserSettings,
} from './types/banking';
import {
  INITIAL_ACCOUNT,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
  INITIAL_TRANSACTIONS,
  QUICK_CONTACTS,
} from './data/mockBanking';
import { translations } from './data/translations';
import { buildCbeSmsText, formatEtb, generateReference } from './utils/formatters';
import { AccountCard } from './components/AccountCard';
import { HistoryView } from './components/HistoryView';
import { QrView } from './components/QrView';
import { SettingsView } from './components/SettingsView';
import { ServiceModal } from './components/ServiceModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';

const STORAGE_KEY = 'cbebank_banking_state_v2';

interface PersistedState {
  account: BankAccount;
  transactions: Transaction[];
  notifications: NotificationItem[];
  language: Language;
  settings: UserSettings;
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (parsed.account && Array.isArray(parsed.transactions)) {
        const mergedAccount: BankAccount = {
          ...INITIAL_ACCOUNT,
          ...parsed.account,
          fullNumber:
            typeof parsed.account.fullNumber === 'string' && parsed.account.fullNumber
              ? parsed.account.fullNumber
              : INITIAL_ACCOUNT.fullNumber,
          maskedNumber:
            typeof parsed.account.maskedNumber === 'string' && parsed.account.maskedNumber
              ? parsed.account.maskedNumber
              : INITIAL_ACCOUNT.maskedNumber,
          balanceEtb:
            typeof parsed.account.balanceEtb === 'number' && Number.isFinite(parsed.account.balanceEtb)
              ? parsed.account.balanceEtb
              : INITIAL_ACCOUNT.balanceEtb,
        };
        const sanitizedTransactions: Transaction[] = parsed.transactions
          .filter(
            (item): item is Transaction =>
              Boolean(item && typeof item.id === 'string' && typeof item.amountEtb === 'number' && Number.isFinite(item.amountEtb))
          )
          .map((item) => ({
            ...item,
            reference: typeof item.reference === 'string' ? item.reference : 'FT26000000',
            title: typeof item.title === 'string' ? item.title : 'Transfer',
            titleAm: typeof item.titleAm === 'string' ? item.titleAm : 'ዝውውር',
            counterparty: typeof item.counterparty === 'string' ? item.counterparty : 'Recipient',
            accountOrPhone: typeof item.accountOrPhone === 'string' ? item.accountOrPhone : '',
            feeEtb: typeof item.feeEtb === 'number' && Number.isFinite(item.feeEtb) ? item.feeEtb : 0,
            timestamp: typeof item.timestamp === 'string' ? item.timestamp : '',
            direction: item.direction === 'credit' ? 'credit' : 'debit',
            status: item.status === 'Pending' ? 'Pending' : 'Completed',
          }));
        const sanitizedNotifications: NotificationItem[] = Array.isArray(parsed.notifications)
          ? parsed.notifications.filter(
              (n): n is NotificationItem =>
                Boolean(n && typeof n.id === 'string' && typeof n.title === 'string' && typeof n.detail === 'string')
            )
          : INITIAL_NOTIFICATIONS;
        const rawSettings: Partial<UserSettings> = parsed.settings ?? {};
        return {
          account: mergedAccount,
          transactions: sanitizedTransactions,
          notifications: sanitizedNotifications,
          language: parsed.language === 'am' ? 'am' : 'en',
          settings: {
            ...INITIAL_SETTINGS,
            ...rawSettings,
            dailyLimitEtb:
              typeof rawSettings.dailyLimitEtb === 'number' && Number.isFinite(rawSettings.dailyLimitEtb)
                ? rawSettings.dailyLimitEtb
                : INITIAL_SETTINGS.dailyLimitEtb,
          },
        };
      }
    }
  } catch {
    // Fallback to initial defaults
  }
  return {
    account: INITIAL_ACCOUNT,
    transactions: INITIAL_TRANSACTIONS,
    notifications: INITIAL_NOTIFICATIONS,
    language: 'en',
    settings: INITIAL_SETTINGS,
  };
}

export default function App() {
  const [initial] = useState<PersistedState>(() => loadInitialState());
  const [account, setAccount] = useState<BankAccount>(initial.account);
  const [transactions, setTransactions] = useState<Transaction[]>(initial.transactions);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initial.notifications);
  const [language, setLanguage] = useState<Language>(initial.language);
  const [settings, setSettings] = useState<UserSettings>(initial.settings);

  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [qrMode, setQrMode] = useState<'scan' | 'myqr'>('scan');
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(!initial.settings.hideBalanceOnStart);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modal, setModal] = useState<ModalContext>(null);
  const [showQuickDrawer, setShowQuickDrawer] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const t = translations[language];
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    try {
      const state: PersistedState = { account, transactions, notifications, language, settings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota issues
    }
  }, [account, transactions, notifications, language, settings]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (msg: string) => setToast(msg);

  const handleRefreshBalance = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      showToast(t.balanceSynced);
    }, 550);
  };

  const handleOpenService = (
    serviceId: ServiceId,
    presetRecipient?: string,
    presetAmount?: number,
    presetBillerId?: string
  ) => {
    setShowQuickDrawer(false);
    if (serviceId === 'qr') {
      setQrMode('scan');
      setActiveTab('qr');
      setModal(null);
      return;
    }
    setModal({ type: 'service', serviceId, presetRecipient, presetAmount, presetBillerId });
  };

  const handleExecuteTransaction = (payload: {
    title: string;
    titleAm: string;
    counterparty: string;
    accountOrPhone: string;
    category: TransactionCategory;
    direction: 'debit' | 'credit';
    amountEtb: number;
    feeEtb: number;
    note?: string;
    recipientPhone?: string;
    recipientBalanceEtb?: number;
  }): Transaction | null => {
    const totalDelta = payload.amountEtb + payload.feeEtb;
    if (payload.direction === 'debit' && totalDelta > account.balanceEtb) {
      return null;
    }

    const newBalance = Number(
      (payload.direction === 'credit'
        ? account.balanceEtb + payload.amountEtb
        : account.balanceEtb - totalDelta
      ).toFixed(2)
    );

    const now = new Date();
    const datePart = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timePart = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const reference = generateReference();
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      reference,
      title: payload.title,
      titleAm: payload.titleAm,
      counterparty: payload.counterparty,
      accountOrPhone: payload.accountOrPhone,
      category: payload.category,
      direction: payload.direction,
      amountEtb: payload.amountEtb,
      feeEtb: payload.feeEtb,
      timestamp: `${datePart} ${timePart}`,
      note: payload.note,
      recipientPhone: payload.recipientPhone,
      recipientBalanceEtb: payload.recipientBalanceEtb,
      balanceAfterEtb: newBalance,
      status: 'Completed',
    };

    const smsHolderName =
      payload.direction === 'debit' ? payload.counterparty : 'Webalem Tasfaye';
    const smsBalanceEtb = payload.recipientBalanceEtb ?? newBalance;

    const smsMessage = buildCbeSmsText({
      holderName: smsHolderName,
      accountNumber: account.fullNumber,
      amountEtb: payload.amountEtb,
      feeEtb: payload.feeEtb,
      currentBalanceEtb: smsBalanceEtb,
      reference,
      direction: payload.direction,
      counterparty: payload.counterparty,
    });

    setAccount((prev) => ({ ...prev, balanceEtb: newBalance }));
    setTransactions((prev) => [tx, ...prev]);

    if (settings.smsAlerts) {
      const notif: NotificationItem = {
        id: `n-${Date.now()}`,
        title: `CBE SMS · ${payload.title}`,
        titleAm: `ሲቢኢ ኤስኤምኤስ · ${payload.titleAm}`,
        detail: smsMessage,
        detailAm: smsMessage,
        timeAgo: 'Just now',
        read: false,
      };
      setNotifications((prev) => [notif, ...prev]);
    }
    showToast(t.paymentSuccess);
    return tx;
  };

  const handleUpdateTransactionSms = (
    txId: string,
    patch: { recipientPhone?: string; recipientBalanceEtb?: number }
  ) => {
    setTransactions((prev) =>
      prev.map((item) => (item.id === txId ? { ...item, ...patch } : item))
    );
    setModal((prev) =>
      prev?.type === 'receipt' && prev.transaction.id === txId
        ? { ...prev, transaction: { ...prev.transaction, ...patch } }
        : prev
    );
  };

  const handleUpdateSettings = (patch: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleResetDemo = () => {
    setAccount(INITIAL_ACCOUNT);
    setTransactions(INITIAL_TRANSACTIONS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSettings(INITIAL_SETTINGS);
    setIsBalanceVisible(true);
    showToast(t.demoResetDone);
  };

  const pageTitleMap: Record<NavTab, string> = {
    home: t.navHome,
    history: language === 'am' ? 'ግብይቶች' : 'Transactions',
    qr: t.navQr,
    settings: t.navSettings,
  };

  const quickCircleItems = [
    {
      id: 'mini',
      label: t.miniStatement,
      activeStyle: true,
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path
            d="M6 3.5h12v17l-2.2-1.4L13.5 20.5 12 19.3l-1.5 1.2-2.3-1.4L6 20.5v-17Z"
            fill="#5B2082"
          />
          <path d="M9 8h6M9 11.5h6M9 15h4" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ),
      onClick: () => setModal({ type: 'miniStatement' }),
    },
    {
      id: 'cashout',
      label: t.serviceCashout,
      activeStyle: false,
      icon: <CircleDollarSign className="h-5 w-5 text-slate-700" />,
      onClick: () => handleOpenService('cashout'),
    },
    {
      id: 'billshare',
      label: language === 'am' ? 'ቢል ክፍፍል' : 'Bill Share',
      activeStyle: false,
      icon: <GitFork className="h-5 w-5 text-slate-700" />,
      onClick: () => handleOpenService('bills'),
    },
    {
      id: 'cards',
      label: language === 'am' ? 'ካርዶች' : 'Cards',
      activeStyle: false,
      hasChevron: true,
      icon: <CreditCard className="h-5 w-5 text-slate-700" />,
      onClick: () => setModal({ type: 'accountDetails' }),
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#ECEEF2] pb-36 md:pb-12 text-slate-900">
      {/* Curved Deep Purple Top Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 overflow-hidden"
      >
        <div
          className={`w-full bg-gradient-to-b from-[#551E7B] via-[#662590] to-[#7630A2] transition-all duration-200 ${
            activeTab === 'home' ? 'h-[205px] sm:h-[225px]' : 'h-[115px] sm:h-[130px]'
          }`}
        />
        <svg
          viewBox="0 0 1440 56"
          preserveAspectRatio="none"
          className="block h-8 w-full sm:h-11 -mt-px"
        >
          <path d="M0,0 L1440,0 L1440,12 Q720,64 0,12 Z" fill="#7630A2" />
        </svg>
      </div>

      {/* Main Content Container */}
      <main className="relative z-10 mx-auto max-w-lg lg:max-w-5xl px-4 pt-4 sm:px-6 lg:pt-6">
        {/* Top Purple Hero Header (Matches Photo: Grid + Hello Webalem | English v | Refresh | Search) */}
        <header className="mb-4 flex items-center justify-between gap-2 text-white">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setShowQuickDrawer(true)}
              aria-label="Menu"
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-white/90 transition-colors hover:bg-white/10"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              {activeTab === 'home' ? (
                <>
                  <p className="text-xs font-medium text-white/75 leading-none">
                    {language === 'am' ? 'ሰላም,' : 'Hello,'}
                  </p>
                  <h1 className="mt-0.5 truncate text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                    {language === 'am' ? 'ውባለም' : 'Webalem'}
                  </h1>
                </>
              ) : (
                <h1 className="truncate text-lg font-bold tracking-tight text-white">
                  {pageTitleMap[activeTab]}
                </h1>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Desktop Nav Shortcuts */}
            <nav className="hidden lg:flex items-center gap-4 mr-2" aria-label="Desktop navigation">
              <button
                type="button"
                onClick={() => setActiveTab('home')}
                className={`text-xs font-semibold ${activeTab === 'home' ? 'text-[#E8C16F]' : 'text-white/80 hover:text-white'}`}
              >
                {t.navHome}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`text-xs font-semibold ${activeTab === 'history' ? 'text-[#E8C16F]' : 'text-white/80 hover:text-white'}`}
              >
                {language === 'am' ? 'ግብይቶች' : 'Transactions'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setQrMode('scan');
                  setActiveTab('qr');
                }}
                className={`text-xs font-semibold ${activeTab === 'qr' ? 'text-[#E8C16F]' : 'text-white/80 hover:text-white'}`}
              >
                {t.serviceQr}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`text-xs font-semibold ${activeTab === 'settings' ? 'text-[#E8C16F]' : 'text-white/80 hover:text-white'}`}
              >
                {t.navSettings}
              </button>
            </nav>

            <button
              type="button"
              onClick={() => setLanguage((prev) => (prev === 'en' ? 'am' : 'en'))}
              className="flex min-h-[38px] items-center gap-1 rounded-lg px-2 text-xs sm:text-sm font-medium text-white/95 transition-colors hover:bg-white/10 whitespace-nowrap"
            >
              <span>{language === 'en' ? 'English' : 'አማርኛ'}</span>
              <ChevronDown className="h-3.5 w-3.5 text-white/80" />
            </button>

            <button
              type="button"
              onClick={handleRefreshBalance}
              disabled={isRefreshing}
              aria-label={t.refreshBalance}
              className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              aria-label="Search transactions"
              className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/10"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* HOME VIEW */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              {/* Obsidian Saving Account Card */}
              <div>
                <AccountCard
                  account={account}
                  language={language}
                  t={t}
                  isBalanceVisible={isBalanceVisible}
                  onToggleVisibility={() => setIsBalanceVisible((prev) => !prev)}
                />
                {/* Gold Card Indicator */}
                <div aria-hidden="true" className="mx-auto mt-3 h-1 w-6 rounded-full bg-[#D9A74A]" />
              </div>

              {/* 4-Circle Quick Action Row */}
              <section
                aria-label="Quick Actions"
                className="grid grid-cols-4 gap-2 pt-1"
              >
                {quickCircleItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={item.onClick}
                    className="group relative flex flex-col items-center text-center focus-visible:outline-2 focus-visible:outline-[#5B2082] rounded-xl py-1"
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-150 group-hover:scale-105 ${
                        item.activeStyle
                          ? 'bg-[#E9E4F2] shadow-xs'
                          : 'bg-[#E5E7EB]'
                      }`}
                    >
                      {item.icon}
                    </div>
                    {item.hasChevron && (
                      <ChevronRight
                        aria-hidden="true"
                        className="absolute right-1 top-5 h-3.5 w-3.5 text-slate-400"
                      />
                    )}
                    <span className="mt-1.5 text-[11px] sm:text-xs font-medium leading-tight text-slate-700">
                      {item.label}
                    </span>
                  </button>
                ))}
              </section>

              {/* 2-Column CBE Service Cards Grid */}
              <section aria-label={t.services} className="grid grid-cols-2 gap-3 pt-1">
                {/* Row 1 Left: CBE Transfer / Send Money */}
                <button
                  type="button"
                  onClick={() => handleOpenService('send')}
                  className="flex min-h-[76px] items-center gap-3 rounded-2xl bg-[#F7F8FA] px-3.5 py-3 text-left shadow-xs border border-slate-200/70 transition-colors hover:bg-white hover:border-[#682692]/35 focus-visible:outline-2 focus-visible:outline-[#5B2082]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F4DFDC] text-[#B95248]">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs sm:text-sm font-semibold text-slate-900">
                      {language === 'am' ? 'ሲቢኢ ዝውውር' : 'CBE Transfer'}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {language === 'am' ? 'ገንዘብ ላክ' : 'Send Money'}
                    </p>
                  </div>
                </button>

                {/* Row 1 Right: Receive / Get Paid */}
                <button
                  type="button"
                  onClick={() => {
                    setQrMode('myqr');
                    setActiveTab('qr');
                  }}
                  className="flex min-h-[76px] items-center gap-3 rounded-2xl bg-[#F7F8FA] px-3.5 py-3 text-left shadow-xs border border-slate-200/70 transition-colors hover:bg-white hover:border-[#682692]/35 focus-visible:outline-2 focus-visible:outline-[#5B2082]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D8ECE3] text-[#3B8263]">
                    <ArrowDownLeft className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs sm:text-sm font-semibold text-slate-900">
                      {language === 'am' ? 'ተቀበል' : 'Receive'}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {language === 'am' ? 'ክፍያ ተቀበል' : 'Get Paid'}
                    </p>
                  </div>
                </button>

                {/* Row 2 Left: Airtime */}
                <button
                  type="button"
                  onClick={() => handleOpenService('airtime')}
                  className="flex min-h-[96px] flex-col items-center justify-center rounded-2xl bg-[#F7F8FA] p-3 text-center shadow-xs border border-slate-200/70 transition-colors hover:bg-white hover:border-[#682692]/35 focus-visible:outline-2 focus-visible:outline-[#5B2082]"
                >
                  <Phone className="h-5 w-5 fill-[#5B2082] text-[#5B2082]" />
                  <span className="mt-2 text-xs sm:text-sm font-semibold text-slate-800">
                    {t.serviceAirtime}
                  </span>
                </button>

                {/* Row 2 Right: Other Transfers */}
                <button
                  type="button"
                  onClick={() => handleOpenService('transfers')}
                  className="flex min-h-[96px] flex-col items-center justify-center rounded-2xl bg-[#F7F8FA] p-3 text-center shadow-xs border border-slate-200/70 transition-colors hover:bg-white hover:border-[#682692]/35 focus-visible:outline-2 focus-visible:outline-[#5B2082]"
                >
                  <ArrowLeftRight className="h-5 w-5 text-slate-700" />
                  <span className="mt-2 text-xs sm:text-sm font-semibold text-slate-800">
                    {t.serviceTransfers}
                  </span>
                </button>

                {/* Row 3 Left: CBEBirr */}
                <button
                  type="button"
                  onClick={() => handleOpenService('transfers', 'CBEBirr Wallet')}
                  className="flex min-h-[96px] flex-col items-center justify-center rounded-2xl bg-[#F7F8FA] p-3 text-center shadow-xs border border-slate-200/70 transition-colors hover:bg-white hover:border-[#682692]/35 focus-visible:outline-2 focus-visible:outline-[#5B2082]"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="3" fill="#5B2082" />
                    <path d="M15 10h6v4h-6a2 2 0 1 1 0-4Z" fill="#EDEAF3" />
                    <circle cx="16.5" cy="12" r="1" fill="#5B2082" />
                  </svg>
                  <span className="mt-2 text-xs sm:text-sm font-semibold text-slate-800">
                    {language === 'am' ? 'ሲቢኢ ብር' : 'CBEBirr'}
                  </span>
                </button>

                {/* Row 3 Right: Bills & Utilities */}
                <button
                  type="button"
                  onClick={() => handleOpenService('bills')}
                  className="flex min-h-[96px] flex-col items-center justify-center rounded-2xl bg-[#F7F8FA] p-3 text-center shadow-xs border border-slate-200/70 transition-colors hover:bg-white hover:border-[#682692]/35 focus-visible:outline-2 focus-visible:outline-[#5B2082]"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                    <path
                      d="M6 3.5h12v17l-2.2-1.4L13.5 20.5 12 19.3l-1.5 1.2-2.3-1.4L6 20.5v-17Z"
                      fill="#5B2082"
                    />
                    <path d="M9 8h6M9 11.5h6M9 15h4" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  <span className="mt-2 text-xs sm:text-sm font-semibold text-slate-800">
                    {language === 'am' ? 'ቢል እና አገልግሎት' : 'Bills & Utilities'}
                  </span>
                </button>

                {/* Row 4 Left: Pay to Merchant */}
                <button
                  type="button"
                  onClick={() => handleOpenService('merchant')}
                  className="flex min-h-[96px] flex-col items-center justify-center rounded-2xl bg-[#F7F8FA] p-3 text-center shadow-xs border border-slate-200/70 transition-colors hover:bg-white hover:border-[#682692]/35 focus-visible:outline-2 focus-visible:outline-[#5B2082]"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5V8H4V5.5Z" fill="#5B2082" />
                    <path
                      d="M3.5 9h17l-.8 3.2a1.6 1.6 0 0 1-1.55 1.2H17v5.6a1 1 0 0 1-1 1h-3v-4.5h-2V20H8a1 1 0 0 1-1-1v-5.6H5.85a1.6 1.6 0 0 1-1.55-1.2L3.5 9Z"
                      fill="#5B2082"
                    />
                  </svg>
                  <span className="mt-2 text-xs sm:text-sm font-semibold text-slate-800">
                    {language === 'am' ? 'ለነጋዴ ክፍያ' : 'Pay to Merchant'}
                  </span>
                </button>

                {/* Row 4 Right: Payment Request */}
                <button
                  type="button"
                  onClick={() => {
                    setQrMode('myqr');
                    setActiveTab('qr');
                  }}
                  className="flex min-h-[96px] flex-col items-center justify-center rounded-2xl bg-[#F7F8FA] p-3 text-center shadow-xs border border-slate-200/70 transition-colors hover:bg-white hover:border-[#682692]/35 focus-visible:outline-2 focus-visible:outline-[#5B2082]"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                    <path
                      d="M21 3 3 10.5l6.8 2.6L18 6.5l-6.4 8.1v5.1l3.6-3.5 3.6 1.8L21 3Z"
                      fill="#5B2082"
                    />
                  </svg>
                  <span className="mt-2 text-xs sm:text-sm font-semibold text-slate-800">
                    {language === 'am' ? 'የክፍያ ጥያቄ' : 'Payment Request'}
                  </span>
                </button>

                {/* Row 5 Left: Travel */}
                <button
                  type="button"
                  onClick={() => handleOpenService('bills', undefined, 4850, 'travel')}
                  className="flex min-h-[96px] flex-col items-center justify-center rounded-2xl bg-[#F7F8FA] p-3 text-center shadow-xs border border-slate-200/70 transition-colors hover:bg-white hover:border-[#682692]/35 focus-visible:outline-2 focus-visible:outline-[#5B2082]"
                >
                  <svg viewBox="0 0 26 24" className="h-5 w-6" fill="none" aria-hidden="true">
                    <path
                      d="M6.2 4 8.5 4l2.1 5.6 1.9.7a1 1 0 0 1 0 1.8l-1.9.7L8.5 18H6.2l1.2-5.4-2.1-.6-.9 1.2H3.1l.6-2-.6-2h1.3l.9 1.2 2.1-.6L6.2 4Z"
                      fill="#5B2082"
                    />
                    <rect x="13.5" y="7" width="9" height="10" rx="2" fill="#5B2082" />
                    <rect x="15" y="9" width="6" height="3.2" rx="0.6" fill="#FFFFFF" />
                    <circle cx="15.5" cy="14.5" r="0.8" fill="#FFFFFF" />
                    <circle cx="20.5" cy="14.5" r="0.8" fill="#FFFFFF" />
                    <rect x="14.5" y="17" width="1.6" height="1.5" rx="0.4" fill="#5B2082" />
                    <rect x="19.9" y="17" width="1.6" height="1.5" rx="0.4" fill="#5B2082" />
                  </svg>
                  <span className="mt-2 text-xs sm:text-sm font-semibold text-slate-800">
                    {language === 'am' ? 'ጉዞ' : 'Travel'}
                  </span>
                </button>

                {/* Row 5 Right: Shopping */}
                <button
                  type="button"
                  onClick={() => handleOpenService('merchant', '882914', 1200)}
                  className="flex min-h-[96px] flex-col items-center justify-center rounded-2xl bg-[#F7F8FA] p-3 text-center shadow-xs border border-slate-200/70 transition-colors hover:bg-white hover:border-[#682692]/35 focus-visible:outline-2 focus-visible:outline-[#5B2082]"
                >
                  <ShoppingCart className="h-5 w-5 fill-[#5B2082] text-[#5B2082]" />
                  <span className="mt-2 text-xs sm:text-sm font-semibold text-slate-800">
                    {language === 'am' ? 'ግዢ' : 'Shopping'}
                  </span>
                </button>

                {/* Row 6 Left: Entertainment */}
                <button
                  type="button"
                  onClick={() => handleOpenService('bills', undefined, 1150, 'dstv')}
                  className="flex min-h-[96px] flex-col items-center justify-center rounded-2xl bg-[#F7F8FA] p-3 text-center shadow-xs border border-slate-200/70 transition-colors hover:bg-white hover:border-[#682692]/35 focus-visible:outline-2 focus-visible:outline-[#5B2082]"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2.5" fill="#5B2082" />
                    <rect x="5" y="7" width="2.2" height="2" rx="0.4" fill="#FFFFFF" />
                    <rect x="5" y="11" width="2.2" height="2" rx="0.4" fill="#FFFFFF" />
                    <rect x="5" y="15" width="2.2" height="2" rx="0.4" fill="#FFFFFF" />
                    <rect x="16.8" y="7" width="2.2" height="2" rx="0.4" fill="#FFFFFF" />
                    <rect x="16.8" y="11" width="2.2" height="2" rx="0.4" fill="#FFFFFF" />
                    <rect x="16.8" y="15" width="2.2" height="2" rx="0.4" fill="#FFFFFF" />
                    <rect x="9" y="7" width="6" height="4.2" rx="0.5" fill="#FFFFFF" />
                    <rect x="9" y="12.8" width="6" height="4.2" rx="0.5" fill="#FFFFFF" />
                  </svg>
                  <span className="mt-2 text-xs sm:text-sm font-semibold text-slate-800">
                    {language === 'am' ? 'መዝናኛ' : 'Entertainment'}
                  </span>
                </button>

                {/* Row 6 Right: Pay for */}
                <button
                  type="button"
                  onClick={() => handleOpenService('bills', undefined, 640, 'eeu')}
                  className="flex min-h-[96px] flex-col items-center justify-center rounded-2xl bg-[#F7F8FA] p-3 text-center shadow-xs border border-slate-200/70 transition-colors hover:bg-white hover:border-[#682692]/35 focus-visible:outline-2 focus-visible:outline-[#5B2082]"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                    <path
                      d="M12.2 4.2v1m0 5v1m1.5-4.7c-.3-.4-.9-.6-1.5-.6-.9 0-1.6.4-1.6 1.1 0 .7.6 1 1.6 1.2 1 .2 1.7.6 1.7 1.3 0 .8-.7 1.3-1.7 1.3-.8 0-1.4-.3-1.8-.8"
                      stroke="#5B2082"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M4 15.5h3.5l4.2 1.5h4.1c1 0 1.8.6 1.9 1.4l-5.6 1.8a3.2 3.2 0 0 1-1.9 0L4 18.4v-2.9Z"
                      fill="#5B2082"
                    />
                  </svg>
                  <span className="mt-2 text-xs sm:text-sm font-semibold text-slate-800">
                    {language === 'am' ? 'ክፍያ ለ' : 'Pay for'}
                  </span>
                </button>

                {/* Row 7 Left: Tax Payment */}
                <button
                  type="button"
                  onClick={() => handleOpenService('bills', undefined, 3250, 'erca')}
                  className="flex min-h-[96px] flex-col items-center justify-center rounded-2xl bg-[#F7F8FA] p-3 text-center shadow-xs border border-slate-200/70 transition-colors hover:bg-white hover:border-[#682692]/35 focus-visible:outline-2 focus-visible:outline-[#5B2082]"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                    <path
                      d="M6 3.5h12v17l-2.2-1.4L13.5 20.5 12 19.3l-1.5 1.2-2.3-1.4L6 20.5v-17Z"
                      fill="#5B2082"
                    />
                    <path d="M9 8h6M9 11.5h6M9 15h4" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  <span className="mt-2 text-xs sm:text-sm font-semibold text-slate-800">
                    {language === 'am' ? 'የግብር ክፍያ' : 'Tax Payment'}
                  </span>
                </button>

                {/* Row 7 Right: Ethiopian Shipping & Logistics */}
                <button
                  type="button"
                  onClick={() => handleOpenService('bills', undefined, 2750, 'esl')}
                  className="flex min-h-[96px] flex-col items-center justify-center rounded-2xl bg-[#F7F8FA] px-2.5 py-3 text-center shadow-xs border border-slate-200/70 transition-colors hover:bg-white hover:border-[#682692]/35 focus-visible:outline-2 focus-visible:outline-[#5B2082]"
                >
                  <div className="flex flex-col items-center leading-none">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-700" fill="none" aria-hidden="true">
                      <circle cx="12" cy="11" r="4.8" stroke="currentColor" strokeWidth="1.6" />
                      <circle cx="12" cy="11" r="1.4" fill="currentColor" />
                      <path
                        d="M12 3.5v15M4.5 11h15M6.7 5.7l10.6 10.6M17.3 5.7 6.7 16.3"
                        stroke="currentColor"
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="mt-0.5 text-[7px] font-bold tracking-wider text-slate-700">
                      ESL
                    </span>
                  </div>
                  <span className="mt-1.5 text-xs sm:text-sm font-semibold leading-tight text-slate-800">
                    {language === 'am' ? 'የኢትዮጵያ ባህር ትራንስፖርት' : 'Ethiopian Shipping & Logistics'}
                  </span>
                </button>

                {/* Row 8 Left: CBE Fast Loan */}
                <button
                  type="button"
                  onClick={() => handleOpenService('loan')}
                  className="flex min-h-[96px] flex-col items-center justify-center rounded-2xl bg-[#F7F8FA] p-3 text-center shadow-xs border border-slate-200/70 transition-colors hover:bg-white hover:border-[#682692]/35 focus-visible:outline-2 focus-visible:outline-[#5B2082]"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                    <path
                      d="M9.5 4h5l-1 2.4h-3L9.5 4ZM8.6 7.5h6.8c2.6 2 4.1 5.1 4.1 8.2 0 2.5-1.9 4.3-4.5 4.3H9c-2.6 0-4.5-1.8-4.5-4.3 0-3.1 1.5-6.2 4.1-8.2Z"
                      fill="#5B2082"
                    />
                    <path
                      d="M12 10.6v6.4M13.3 12.1c-.3-.4-.8-.6-1.3-.6-.7 0-1.3.4-1.3 1s.5.9 1.3 1.1c.8.2 1.4.5 1.4 1.1s-.6 1.1-1.4 1.1c-.6 0-1.1-.2-1.4-.6"
                      stroke="#FFFFFF"
                      strokeWidth="1.35"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="mt-2 text-xs sm:text-sm font-semibold text-slate-800">
                    {language === 'am' ? 'ሲቢኢ ፈጣን ብድር' : 'CBE Fast Loan'}
                  </span>
                </button>
              </section>
            </div>

            {/* Desktop Secondary Column (Hidden on Mobile so mobile matches photo 1:1) */}
            <div className="hidden lg:block space-y-6 lg:col-span-5">
              <section
                aria-label={t.quickTransfer}
                className="rounded-2xl border border-slate-200/80 bg-white p-5"
              >
                <div className="mb-3.5 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">{t.quickTransfer}</h2>
                  <PWAInstallButton language={language} variant="settings" />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {QUICK_CONTACTS.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() =>
                        handleOpenService('send', language === 'am' ? contact.nameAm : contact.name)
                      }
                      className="flex min-h-[54px] items-center gap-3 rounded-xl border border-slate-100 bg-[#F6F5FA]/70 px-3 py-2.5 text-left transition-colors hover:border-[#4A148C]/30 hover:bg-white"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4A148C] text-xs font-bold text-white">
                        {contact.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900">
                          {language === 'am' ? contact.nameAm : contact.name}
                        </p>
                        <p className="truncate font-mono-nums text-[11px] text-slate-500">
                          {contact.accountNumber.slice(-4).padStart(8, '*')}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section
                aria-label={t.recentActivity}
                className="rounded-2xl border border-slate-200/80 bg-white p-5"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">{t.recentActivity}</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="min-h-[36px] text-xs font-semibold text-[#4A148C] hover:underline whitespace-nowrap shrink-0"
                  >
                    {t.viewAll}
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {transactions.slice(0, 5).map((tx) => (
                    <button
                      key={tx.id}
                      type="button"
                      onClick={() => setModal({ type: 'receipt', transaction: tx })}
                      className="flex min-h-[60px] w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-slate-50 rounded-xl px-2 -mx-2"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            tx.direction === 'credit'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-[#4A148C]/8 text-[#4A148C]'
                          }`}
                        >
                          {tx.direction === 'credit' ? (
                            <ArrowDownLeft className="h-4 w-4" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {language === 'am' ? tx.titleAm : tx.title}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500 truncate">
                            {tx.timestamp} · <span className="font-mono-nums">{tx.reference}</span>
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-mono-nums text-sm font-semibold whitespace-nowrap shrink-0 ${
                          tx.direction === 'credit' ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {tx.direction === 'credit' ? '+' : '-'}
                        {formatEtb(tx.amountEtb, isBalanceVisible)}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryView
            transactions={transactions}
            language={language}
            t={t}
            isBalanceVisible={isBalanceVisible}
            onSelectTransaction={(tx) => setModal({ type: 'receipt', transaction: tx })}
          />
        )}

        {activeTab === 'qr' && (
          <QrView
            account={account}
            language={language}
            t={t}
            initialMode={qrMode}
            onScanPresetPay={(merchant, merchantId, presetAmount, presetNote) => {
              const tx = handleExecuteTransaction({
                title: merchant,
                titleAm: merchant,
                counterparty: `Till #${merchantId}`,
                accountOrPhone: merchantId,
                category: 'merchant',
                direction: 'debit',
                amountEtb: presetAmount,
                feeEtb: 0,
                note: presetNote,
              });
              if (tx) {
                setModal({ type: 'receipt', transaction: tx });
              }
            }}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            language={language}
            t={t}
            settings={settings}
            onChangeLanguage={setLanguage}
            onUpdateSettings={handleUpdateSettings}
            onResetDemo={handleResetDemo}
          />
        )}
      </main>

      {/* Bottom Floating Scan QR Row + 3-Tab Navigation Bar (Matches Photo) */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        {activeTab === 'home' && (
          <div className="mx-auto flex max-w-md items-center justify-center gap-9 px-6 pb-2">
            <button
              type="button"
              onClick={() => setModal({ type: 'accountDetails' })}
              aria-label={t.accountDetailsTitle}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#5B2082] transition-transform hover:scale-105"
            >
              <Landmark className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setQrMode('scan');
                setActiveTab('qr');
              }}
              className="relative flex min-h-[42px] items-center justify-center rounded-full bg-gradient-to-r from-[#5B2082] to-[#7731A3] px-6 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-[#5B2082]/35 transition-transform active:scale-95 whitespace-nowrap"
            >
              <span aria-hidden="true" className="absolute left-3 top-2 h-2 w-2 border-l-2 border-t-2 border-white/75 rounded-tl-[2px]" />
              <span aria-hidden="true" className="absolute right-3 top-2 h-2 w-2 border-r-2 border-t-2 border-white/75 rounded-tr-[2px]" />
              <span aria-hidden="true" className="absolute left-3 bottom-2 h-2 w-2 border-b-2 border-l-2 border-white/75 rounded-bl-[2px]" />
              <span aria-hidden="true" className="absolute right-3 bottom-2 h-2 w-2 border-b-2 border-r-2 border-white/75 rounded-br-[2px]" />
              <span>{t.serviceQr}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowQuickDrawer(true)}
              aria-label="More services & install"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#5B2082] transition-transform hover:scale-105"
            >
              <LayoutGrid className="h-5 w-5" />
            </button>
          </div>
        )}

        <nav
          aria-label="Mobile navigation"
          className="grid h-[62px] grid-cols-3 border-t border-slate-200/80 bg-[#F7F7F9]/95 backdrop-blur-md lg:hidden"
        >
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium"
          >
            <div
              className={`flex h-7 w-14 items-center justify-center rounded-full transition-colors ${
                activeTab === 'home' ? 'bg-[#E5DFD5] text-[#5B2082]' : 'text-slate-500'
              }`}
            >
              <Home className={`h-4 w-4 ${activeTab === 'home' ? 'fill-[#5B2082]' : ''}`} />
            </div>
            <span className={activeTab === 'home' ? 'font-semibold text-slate-900' : 'text-slate-500'}>
              {t.navHome}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium"
          >
            <div
              className={`flex h-7 w-14 items-center justify-center rounded-full transition-colors ${
                activeTab === 'history' ? 'bg-[#E5DFD5] text-[#5B2082]' : 'text-slate-500'
              }`}
            >
              <Landmark className="h-4 w-4" />
            </div>
            <span className={activeTab === 'history' ? 'font-semibold text-slate-900' : 'text-slate-500'}>
              {language === 'am' ? 'ግብይቶች' : 'Transactions'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium"
          >
            <div
              className={`flex h-7 w-14 items-center justify-center rounded-full transition-colors ${
                activeTab === 'settings' ? 'bg-[#E5DFD5] text-[#5B2082]' : 'text-slate-500'
              }`}
            >
              <Settings className="h-4 w-4" />
            </div>
            <span className={activeTab === 'settings' ? 'font-semibold text-slate-900' : 'text-slate-500'}>
              {t.navSettings}
            </span>
          </button>
        </nav>
      </div>

      {/* Quick Services & Install Drawer */}
      {showQuickDrawer && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 backdrop-blur-xs sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="CBE Services & App"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowQuickDrawer(false);
          }}
        >
          <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                {language === 'am' ? 'ተጨማሪ አገልግሎቶች' : 'CBE Bank Menu'}
              </h2>
              <button
                type="button"
                onClick={() => setShowQuickDrawer(false)}
                aria-label={t.close}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleOpenService('merchant')}
                className="flex min-h-[48px] items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50"
              >
                <Store className="h-4 w-4 text-[#5B2082]" />
                <span>{t.serviceMerchant}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenService('loan')}
                className="flex min-h-[48px] items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50"
              >
                <Wallet className="h-4 w-4 text-[#5B2082]" />
                <span>{t.serviceLoan}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowQuickDrawer(false);
                  setModal({ type: 'notifications' });
                }}
                className="flex min-h-[48px] items-center justify-between rounded-xl border border-slate-200 px-3.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#5B2082]" />
                  <span>{t.notifications}</span>
                </span>
                {unreadCount > 0 && (
                  <span className="font-mono-nums text-[#5B2082]">({unreadCount})</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowQuickDrawer(false);
                  setModal({ type: 'accountDetails' });
                }}
                className="flex min-h-[48px] items-center gap-2.5 rounded-xl border border-slate-200 px-3.5 text-left text-xs font-semibold text-slate-800 hover:bg-slate-50"
              >
                <Landmark className="h-4 w-4 text-[#5B2082]" />
                <span>{t.accountDetailsTitle}</span>
              </button>
            </div>

            <div className="mt-4 flex justify-center border-t border-slate-100 pt-4">
              <PWAInstallButton language={language} variant="settings" />
            </div>
          </div>
        </div>
      )}

      {/* Modals & Action Sheets */}
      <ServiceModal
        modal={modal}
        account={account}
        transactions={transactions}
        notifications={notifications}
        language={language}
        t={t}
        isBalanceVisible={isBalanceVisible}
        onClose={() => setModal(null)}
        onExecuteTransaction={handleExecuteTransaction}
        onUpdateTransactionSms={handleUpdateTransactionSms}
        onSelectTransaction={(tx) => setModal({ type: 'receipt', transaction: tx })}
        onOpenService={handleOpenService}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
      />

      {/* Non-intrusive Toast Feedback */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg md:bottom-6 md:left-auto md:right-6 md:translate-x-0"
        >
          {toast}
        </div>
      )}

      <OfflineIndicator language={language} />
    </div>
  );
}
