import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Phone,
  Receipt,
  Search,
  Store,
  Wallet,
} from 'lucide-react';
import { Language, Transaction } from '../types/banking';
import { TranslationStrings } from '../data/translations';
import { formatEtb } from '../utils/formatters';

interface HistoryViewProps {
  transactions: Transaction[];
  language: Language;
  t: TranslationStrings;
  isBalanceVisible: boolean;
  onSelectTransaction: (tx: Transaction) => void;
}

type FilterMode = 'all' | 'income' | 'transfers' | 'bills';

export const HistoryView: React.FC<HistoryViewProps> = ({
  transactions,
  language,
  t,
  isBalanceVisible,
  onSelectTransaction,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (filter === 'income' && tx.direction !== 'credit') return false;
      if (filter === 'transfers' && tx.category !== 'transfer' && tx.category !== 'cashout') return false;
      if (filter === 'bills' && tx.category !== 'bill' && tx.category !== 'airtime' && tx.category !== 'merchant') {
        return false;
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          tx.title.toLowerCase().includes(q) ||
          tx.titleAm.toLowerCase().includes(q) ||
          tx.counterparty.toLowerCase().includes(q) ||
          tx.reference.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [transactions, filter, search]);

  const getCategoryIcon = (tx: Transaction) => {
    if (tx.direction === 'credit') {
      return <ArrowDownLeft className="h-4 w-4 text-emerald-700" />;
    }
    switch (tx.category) {
      case 'airtime':
        return <Phone className="h-4 w-4 text-[#4A148C]" />;
      case 'bill':
        return <Receipt className="h-4 w-4 text-[#4A148C]" />;
      case 'merchant':
        return <Store className="h-4 w-4 text-[#4A148C]" />;
      case 'loan':
        return <Wallet className="h-4 w-4 text-emerald-700" />;
      default:
        return <ArrowUpRight className="h-4 w-4 text-slate-700" />;
    }
  };

  const filters: { id: FilterMode; label: string }[] = [
    { id: 'all', label: t.filterAll },
    { id: 'income', label: t.filterIncome },
    { id: 'transfers', label: t.filterTransfers },
    { id: 'bills', label: t.filterBills },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchTransactions}
              className="min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F6F5FA] pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#4A148C] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto rounded-xl bg-[#F6F5FA] p-1">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  filter === item.id
                    ? 'bg-white text-[#4A148C] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500">{t.noTransactions}</p>
          ) : (
            filtered.map((tx) => (
              <button
                key={tx.id}
                type="button"
                onClick={() => onSelectTransaction(tx)}
                className="flex min-h-[64px] w-full items-center justify-between gap-4 py-3.5 text-left transition-colors hover:bg-slate-50/80 rounded-xl px-2 -mx-2 focus-visible:outline-2 focus-visible:outline-[#4A148C]"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      tx.direction === 'credit' ? 'bg-emerald-50' : 'bg-[#4A148C]/8'
                    }`}
                  >
                    {getCategoryIcon(tx)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {language === 'am' ? tx.titleAm : tx.title}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 truncate">
                      <span>{tx.timestamp}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-nums">{tx.reference}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-emerald-700">
                        {language === 'am' ? 'ተላልፏል' : 'Transferred'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <div className="text-right">
                    <p
                      className={`font-mono-nums text-sm font-semibold ${
                        tx.direction === 'credit' ? 'text-emerald-700' : 'text-slate-900'
                      }`}
                    >
                      {tx.direction === 'credit' ? '+' : '-'}
                      {formatEtb(tx.amountEtb, isBalanceVisible)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{tx.counterparty}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
