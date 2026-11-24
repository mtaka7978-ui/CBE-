import React, { useState } from 'react';
import { Check, Copy, Eye, EyeOff } from 'lucide-react';
import { BankAccount, Language } from '../types/banking';
import { TranslationStrings } from '../data/translations';
import { CbeLogo } from './CbeLogo';

interface AccountCardProps {
  account: BankAccount;
  language: Language;
  t: TranslationStrings;
  isBalanceVisible: boolean;
  onToggleVisibility: () => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  language,
  t,
  isBalanceVisible,
  onToggleVisibility,
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

  const now = new Date();
  const dateLabel = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeLabel = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const formattedNumber = account.balanceEtb.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <section
      aria-label={t.availableBalance}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#2E3039] via-[#1C1E25] to-[#121318] px-5 py-4 sm:px-6 sm:py-5 text-white shadow-xl shadow-slate-950/30"
    >
      {/* Subtle diagonal metallic card sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full bg-gradient-to-br from-amber-300/10 to-transparent blur-xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-purple-500/10 blur-xl"
      />

      {/* Top Brand Header inside Obsidian Card */}
      <div className="relative flex items-center gap-3 min-w-0">
        <CbeLogo size={44} className="shrink-0" />
        <div className="min-w-0">
          <h2 className="truncate text-sm sm:text-base font-semibold tracking-tight text-[#E8C16F]">
            {language === 'am' ? 'የኢትዮጵያ ንግድ ባንክ' : 'Commercial Bank of Ethiopia'}
          </h2>
          <p className="truncate text-[11px] sm:text-xs text-[#D4AE5E]/85">
            {language === 'am' ? 'ሁልጊዜ የሚታመኑበት ባንክ!' : 'The bank you can always rely on!'}
          </p>
        </div>
      </div>

      {/* Centered Balance with Visibility Toggle */}
      <div className="relative mt-4 flex items-center justify-center gap-2.5">
        <p className="font-mono-nums text-2xl sm:text-3xl font-bold tracking-wider text-white">
          {isBalanceVisible ? formattedNumber : '******'}
          <span className="ml-1.5 text-sm font-semibold tracking-normal text-white/85">
            ETB
          </span>
        </p>

        <button
          type="button"
          onClick={onToggleVisibility}
          aria-label={isBalanceVisible ? t.hideBalance : t.showBalance}
          title={isBalanceVisible ? t.hideBalance : t.showBalance}
          className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-white/65 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-amber-300"
        >
          {isBalanceVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {/* Centered Account Type + Masked Number + Copy */}
      <div className="relative mt-3 flex items-center justify-center gap-2 text-xs text-white/85">
        <span className="font-medium text-[#E8C16F]">
          {language === 'am' ? account.typeAm : account.type}
        </span>
        <span className="font-mono-nums tracking-wider text-white/90">
          {account.maskedNumber}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={t.copyNumber}
          title={copied ? t.copied : t.copyNumber}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Centered Timestamp */}
      <p className="relative mt-2.5 text-center font-mono-nums text-[11px] text-white/40">
        {dateLabel} · {timeLabel}
      </p>
    </section>
  );
};
