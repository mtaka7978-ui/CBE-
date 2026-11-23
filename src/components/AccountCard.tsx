import React, { useState } from 'react';
import { Check, Copy, Eye, EyeOff, Info, ListOrdered, RefreshCw } from 'lucide-react';
import { BankAccount, Language } from '../types/banking';
import { TranslationStrings } from '../data/translations';
import { formatEtb } from '../utils/formatters';
import { CbeLogo } from './CbeLogo';

interface AccountCardProps {
  account: BankAccount;
  language: Language;
  t: TranslationStrings;
  isBalanceVisible: boolean;
  isRefreshing: boolean;
  onToggleVisibility: () => void;
  onRefresh: () => void;
  onOpenMiniStatement: () => void;
  onOpenDetails: () => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  language,
  t,
  isBalanceVisible,
  isRefreshing,
  onToggleVisibility,
  onRefresh,
  onOpenMiniStatement,
  onOpenDetails,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(account.fullNumber);
    } catch {
      // Clipboard fallback ignored
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section
      aria-label={t.availableBalance}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#282A33] via-[#1B1D24] to-[#111217] p-5 sm:p-6 text-white shadow-xl shadow-slate-950/25"
    >
      {/* Subtle diagonal metallic card sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-gradient-to-br from-amber-300/10 to-transparent blur-xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-12 h-44 w-44 rounded-full bg-purple-500/10 blur-xl"
      />

      {/* Top Brand Header inside Obsidian Card */}
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <CbeLogo size={46} className="shrink-0" />
          <div className="min-w-0">
            <h2 className="truncate text-sm sm:text-base font-semibold tracking-tight text-[#E8C16F]">
              {language === 'am' ? 'የኢትዮጵያ ንግድ ባንክ' : 'Commercial Bank of Ethiopia'}
            </h2>
            <p className="truncate text-[11px] sm:text-xs text-[#D4AE5E]/80">
              {language === 'am' ? 'ሁልጊዜ የሚታመኑበት ባንክ!' : 'The bank you can always rely on!'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label={t.refreshBalance}
          title={t.refreshBalance}
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Prominent ETB Balance Row */}
      <div className="relative mt-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium text-white/55">{t.availableBalance}</p>
          <p className="mt-1 font-mono-nums text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {formatEtb(account.balanceEtb, isBalanceVisible)}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleVisibility}
          aria-label={isBalanceVisible ? t.hideBalance : t.showBalance}
          title={isBalanceVisible ? t.hideBalance : t.showBalance}
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-white/8 text-white/90 transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
        >
          {isBalanceVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {/* Account Type & Copyable Masked Number */}
      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-white/80">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[#E8C16F]">
            {language === 'am' ? account.typeAm : account.type}
          </span>
          <span aria-hidden="true" className="text-white/35">·</span>
          <span className="font-mono-nums tracking-wider text-white/90">
            {account.maskedNumber}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={t.copyNumber}
            title={copied ? t.copied : t.copyNumber}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/65 transition-colors hover:bg-white/10 hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>

        <span className="font-mono-nums text-[11px] text-white/50">
          {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>

      <div className="relative my-4 h-px bg-white/10" />

      {/* Mini Statement & Account Details Actions */}
      <div className="relative flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onOpenMiniStatement}
          className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 whitespace-nowrap shrink-0"
        >
          <ListOrdered className="h-4 w-4 text-[#E8C16F]" />
          <span>{t.miniStatement}</span>
        </button>

        <button
          type="button"
          onClick={onOpenDetails}
          className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 whitespace-nowrap shrink-0"
        >
          <Info className="h-4 w-4 text-[#E8C16F]" />
          <span>{t.details}</span>
        </button>
      </div>
    </section>
  );
};
