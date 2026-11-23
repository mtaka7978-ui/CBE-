import React, { useState } from 'react';
import { QrCode, ScanLine } from 'lucide-react';
import { BankAccount, Language } from '../types/banking';
import { TranslationStrings } from '../data/translations';
import { QR_PRESETS } from '../data/mockBanking';
import { QrMatrix } from './QrMatrix';
import { formatEtb } from '../utils/formatters';

interface QrViewProps {
  account: BankAccount;
  language: Language;
  t: TranslationStrings;
  onScanPresetPay: (merchant: string, merchantId: string, amountEtb: number, note: string) => void;
}

export const QrView: React.FC<QrViewProps> = ({ account, t, onScanPresetPay }) => {
  const [mode, setMode] = useState<'scan' | 'myqr'>('scan');
  const [requestAmount, setRequestAmount] = useState('');

  const payload = `CBEBANK:${account.fullNumber}:${requestAmount ? Number(requestAmount).toFixed(2) : 'ANY'}`;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-1 rounded-xl bg-[#F6F5FA] p-1">
          <button
            type="button"
            onClick={() => setMode('scan')}
            className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors whitespace-nowrap ${
              mode === 'scan'
                ? 'bg-white text-[#4A148C] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ScanLine className="h-4 w-4" />
            <span>{t.scanToPay}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('myqr')}
            className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors whitespace-nowrap ${
              mode === 'myqr'
                ? 'bg-white text-[#4A148C] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="h-4 w-4" />
            <span>{t.myQrCode}</span>
          </button>
        </div>

        {mode === 'scan' ? (
          <div className="mt-6 space-y-5">
            <div className="relative mx-auto flex h-64 w-full max-w-sm flex-col items-center justify-center overflow-hidden rounded-2xl bg-slate-950 text-white">
              <div className="relative h-44 w-44">
                <span className="absolute left-0 top-0 h-7 w-7 rounded-tl-xl border-l-3 border-t-3 border-white" />
                <span className="absolute right-0 top-0 h-7 w-7 rounded-tr-xl border-r-3 border-t-3 border-white" />
                <span className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-xl border-b-3 border-l-3 border-white" />
                <span className="absolute bottom-0 right-0 h-7 w-7 rounded-br-xl border-b-3 border-r-3 border-white" />
                <div className="flex h-full w-full items-center justify-center">
                  <ScanLine className="h-10 w-10 text-white/60" />
                </div>
              </div>
              <p className="mt-3 text-xs text-white/75">{t.scanToPay}</p>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-600">{t.tapQrPreset}</p>
              <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {QR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      onScanPresetPay(preset.merchant, preset.merchantId, preset.amountEtb, preset.note)
                    }
                    className="flex min-h-[44px] flex-col items-start rounded-xl border border-slate-200 bg-[#F6F5FA] p-3.5 text-left transition-colors hover:border-[#4A148C] hover:bg-white"
                  >
                    <span className="text-sm font-semibold text-slate-900">{preset.merchant}</span>
                    <span className="mt-1 font-mono-nums text-xs font-medium text-[#4A148C]">
                      {formatEtb(preset.amountEtb)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center space-y-5">
            <QrMatrix payload={payload} size={216} />
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-900">{account.type}</p>
              <p className="mt-0.5 font-mono-nums text-xs text-slate-500">{account.maskedNumber}</p>
            </div>

            <div className="w-full max-w-xs">
              <label className="block text-xs font-medium text-slate-600">
                {t.requestAmount}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                placeholder="0.00 ETB"
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F6F5FA] px-3.5 font-mono-nums text-sm text-slate-900 focus:border-[#4A148C] focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">{t.tapQrPreset}</h3>
        <div className="mt-4 divide-y divide-slate-100">
          {QR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() =>
                onScanPresetPay(preset.merchant, preset.merchantId, preset.amountEtb, preset.note)
              }
              className="flex min-h-[60px] w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-slate-50 rounded-xl px-2 -mx-2"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{preset.merchant}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {preset.note} · #{preset.merchantId}
                </p>
              </div>
              <span className="font-mono-nums text-sm font-semibold text-[#4A148C] whitespace-nowrap">
                {formatEtb(preset.amountEtb)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
