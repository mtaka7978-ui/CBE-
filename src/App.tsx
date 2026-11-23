import React, { useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  Bell,
  Clock,
  Globe,
  Home,
  QrCode,
  Receipt,
  ScanLine,
  Send,
  Settings,
  Smartphone,
  Store,
  Wallet,
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
import { formatEtb, generateReference } from './utils/formatters';
import { AccountCard } from './components/AccountCard';
import { HistoryView } from './components/HistoryView';
import { QrView } from './components/QrView';
import { SettingsView } from './components/SettingsView';
import { ServiceModal } from './components/ServiceModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';

const STORAGE_KEY = 'cbebank_banking_state_v1';

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
        return {
          account: parsed.account,
          transactions: parsed.transactions,
          notifications: parsed.notifications ?? INITIAL_NOTIFICATIONS,
          language: parsed.language ?? 'en',
          settings: parsed.settings ?? INITIAL_SETTINGS,
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
  const [isBalanceVisible, setIsBalanceVisible] = useState<boolean>(!initial.settings.hideBalanceOnStart);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modal, setModal] = useState<ModalContext>(null);
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
    presetAmount?: number
  ) => {
    if (serviceId === 'qr') {
      setActiveTab('qr');
      setModal(null);
      return;
    }
    setModal({ type: 'service', serviceId, presetRecipient, presetAmount });
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
  }): Transaction | null => {
    const totalDelta = payload.amountEtb + payload.feeEtb;
    if (payload.direction === 'debit' && totalDelta > account.balanceEtb) {
      return null;
    }

    const newBalance =
      payload.direction === 'credit'
        ? account.balanceEtb + payload.amountEtb
        : account.balanceEtb - totalDelta;

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

    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      reference: generateReference(),
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
      status: 'Completed',
    };

    setAccount((prev) => ({ ...prev, balanceEtb: Number(newBalance.toFixed(2)) }));
    setTransactions((prev) => [tx, ...prev]);

    const notif: NotificationItem = {
      id: `n-${Date.now()}`,
      title: payload.title,
      titleAm: payload.titleAm,
      detail: `${payload.direction === 'credit' ? '+' : '-'}${formatEtb(payload.amountEtb)} · Ref ${tx.reference}`,
      detailAm: `${payload.direction === 'credit' ? '+' : '-'}${formatEtb(payload.amountEtb)} · መለያ ${tx.reference}`,
      timeAgo: 'Just now',
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
    showToast(t.paymentSuccess);
    return tx;
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

  const services: { id: ServiceId; label: string; icon: React.ReactNode }[] = [
    { id: 'send', label: t.serviceSend, icon: <Send className="h-5 w-5" /> },
    { id: 'transfers', label: t.serviceTransfers, icon: <ArrowLeftRight className="h-5 w-5" /> },
    { id: 'qr', label: t.serviceQr, icon: <ScanLine className="h-5 w-5" /> },
    { id: 'airtime', label: t.serviceAirtime, icon: <Smartphone className="h-5 w-5" /> },
    { id: 'bills', label: t.serviceBills, icon: <Receipt className="h-5 w-5" /> },
    { id: 'merchant', label: t.serviceMerchant, icon: <Store className="h-5 w-5" /> },
    { id: 'cashout', label: t.serviceCashout, icon: <Banknote className="h-5 w-5" /> },
    { id: 'loan', label: t.serviceLoan, icon: <Wallet className="h-5 w-5" /> },
  ];

  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: t.navHome, icon: <Home className="h-5 w-5" /> },
    { id: 'history', label: t.navHistory, icon: <Clock className="h-5 w-5" /> },
    { id: 'qr', label: t.navQr, icon: <QrCode className="h-5 w-5" /> },
    { id: 'settings', label: t.navSettings, icon: <Settings className="h-5 w-5" /> },
  ];

  const pageTitleMap: Record<NavTab, string> = {
    home: t.navHome,
    history: t.navHistory,
    qr: t.navQr,
    settings: t.navSettings,
  };

  return (
    <div className="relative min-h-screen bg-[#F1F2F6] pb-20 md:pb-10 text-slate-900">
      {/* Curved Deep Purple Header Backdrop (matches reference photo's sweeping purple-to-gray background) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-0 overflow-hidden"
      >
        <div
          className={`w-full bg-gradient-to-b from-[#5B2082] via-[#682692] to-[#7731A3] transition-all duration-200 ${
            activeTab === 'home' ? 'h-[290px] sm:h-[310px]' : 'h-[155px] sm:h-[168px]'
          }`}
        />
        <svg
          viewBox="0 0 1440 56"
          preserveAspectRatio="none"
          className="block h-8 w-full sm:h-11 -mt-px"
        >
          <path
            d="M0,0 L1440,0 L1440,12 Q720,64 0,12 Z"
            fill="#7731A3"
          />
        </svg>
      </div>

      {/* Sticky Top Bar adhering to the 3-Zone Contract */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#5B2082]">
        <div className="mx-auto flex h-[54px] md:h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single text element wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 text-left focus-visible:outline-2 focus-visible:outline-white rounded-lg"
          >
            {t.brandName}
          </button>

          {/* Zone 2: Clean single-line navigation links */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Primary navigation">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === item.id
                    ? 'text-white font-semibold'
                    : 'text-white/75 hover:text-white'
                }`}
              >
                {item.label}
                {activeTab === item.id && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-[#E8C16F]"
                  />
                )}
              </button>
            ))}
          </nav>

          {/* Zone 3: Single primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => handleOpenService('send')}
              className="min-h-[40px] rounded-xl bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-[#5B2082] transition-colors hover:bg-white/90 whitespace-nowrap shrink-0"
            >
              {t.quickSend}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8 lg:pt-6">
        {/* Workspace Toolbar (Language Toggle & Notifications inside purple hero zone) */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white text-balance">
              {activeTab === 'home'
                ? language === 'am'
                  ? 'ሰላም, Abebe'
                  : 'Hello, Abebe'
                : pageTitleMap[activeTab]}
            </h1>
            <p className="mt-0.5 text-xs text-white/75">
              {language === 'am' ? account.branchAm : account.branch} ·{' '}
              <span className="font-mono-nums">{account.maskedNumber}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PWAInstallButton language={language} variant="toolbar" />

            <div className="flex items-center rounded-xl border border-white/15 bg-white/10 p-1 backdrop-blur-xs">
              <Globe className="ml-2 mr-1.5 h-3.5 w-3.5 text-white/75" />
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`min-h-[34px] rounded-lg px-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  language === 'en' ? 'bg-white text-[#5B2082]' : 'text-white/85 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('am')}
                className={`min-h-[34px] rounded-lg px-2.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  language === 'am' ? 'bg-white text-[#5B2082]' : 'text-white/85 hover:text-white'
                }`}
              >
                አማ
              </button>
            </div>

            <button
              type="button"
              onClick={() => setModal({ type: 'notifications' })}
              aria-label={t.notifications}
              className="flex min-h-[44px] items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 text-xs font-semibold text-white backdrop-blur-xs transition-colors hover:bg-white/20 whitespace-nowrap shrink-0"
            >
              <Bell className="h-4 w-4 text-[#E8C16F]" />
              <span className="hidden sm:inline">{t.notifications}</span>
              {unreadCount > 0 && (
                <span className="font-mono-nums text-[#E8C16F]">({unreadCount})</span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Primary Left Column */}
            <div className="space-y-5 lg:col-span-7">
              <div>
                <AccountCard
                  account={account}
                  language={language}
                  t={t}
                  isBalanceVisible={isBalanceVisible}
                  isRefreshing={isRefreshing}
                  onToggleVisibility={() => setIsBalanceVisible((prev) => !prev)}
                  onRefresh={handleRefreshBalance}
                  onOpenMiniStatement={() => setModal({ type: 'miniStatement' })}
                  onOpenDetails={() => setModal({ type: 'accountDetails' })}
                />
                {/* Subtle gold card indicator matching reference */}
                <div aria-hidden="true" className="mx-auto mt-3 h-1 w-6 rounded-full bg-[#D9A74A]" />
              </div>

              {/* Services Grid */}
              <section aria-label={t.services} className="rounded-2xl border border-slate-200/70 bg-[#F8F8FB] p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">{t.services}</h2>
                  <span className="text-xs font-medium text-slate-500">{t.allServices}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {services.map((svc) => (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => handleOpenService(svc.id)}
                      className="group flex min-h-[96px] flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-white p-3 text-center transition-colors hover:border-[#682692]/35 hover:bg-white focus-visible:outline-2 focus-visible:outline-[#682692]"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAE8F3] text-[#5B2082] transition-transform duration-150 group-hover:scale-105">
                        {svc.icon}
                      </div>
                      <span className="mt-2.5 text-xs font-semibold leading-tight text-slate-800 line-clamp-2">
                        {svc.label}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Secondary Right Column (Quick Contacts + Recent Activity) */}
            <div className="space-y-6 lg:col-span-5">
              {/* Quick Transfer Contacts */}
              <section
                aria-label={t.quickTransfer}
                className="rounded-2xl border border-slate-200/80 bg-white p-5"
              >
                <div className="mb-3.5 flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">{t.quickTransfer}</h2>
                  <span className="font-mono-nums text-xs text-slate-500">
                    {t.dailyLimit}: {formatEtb(settings.dailyLimitEtb)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2">
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

              {/* Recent Activity */}
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
                            {tx.timestamp} · <span className="font-mono-nums">{tx.reference}</span> ·{' '}
                            <span className="font-medium text-emerald-700">
                              {language === 'am' ? 'ተላልፏል' : 'Transferred'}
                            </span>
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

      {/* Mobile Fixed Bottom Tab Bar (<= 15% combined viewport height with 54px top bar) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-40 grid h-[60px] grid-cols-4 border-t border-slate-200/80 bg-white/95 backdrop-blur-md md:hidden"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-[#4A148C] font-semibold' : 'text-slate-500'
              }`}
            >
              {item.icon}
              <span className="truncate max-w-[72px]">{item.label}</span>
            </button>
          );
        })}
      </nav>

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
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg md:bottom-6 md:left-auto md:right-6 md:translate-x-0"
        >
          {toast}
        </div>
      )}

      <OfflineIndicator language={language} />
    </div>
  );
}
