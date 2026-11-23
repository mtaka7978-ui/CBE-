import React from 'react';
import { Globe, RotateCcw, ShieldCheck } from 'lucide-react';
import { Language, UserSettings } from '../types/banking';
import { TranslationStrings } from '../data/translations';
import { formatEtb } from '../utils/formatters';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  language: Language;
  t: TranslationStrings;
  settings: UserSettings;
  onChangeLanguage: (lang: Language) => void;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onResetDemo: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  t,
  settings,
  onChangeLanguage,
  onUpdateSettings,
  onResetDemo,
}) => {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-6 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <Globe className="h-5 w-5 text-[#4A148C]" />
          <h3 className="text-base font-semibold text-slate-900">{t.languageTitle}</h3>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChangeLanguage('en')}
            className={`min-h-[48px] rounded-xl border px-4 py-3 text-left transition-colors ${
              language === 'en'
                ? 'border-[#4A148C] bg-[#4A148C]/6 text-[#4A148C]'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <p className="text-sm font-semibold">English</p>
            <p className="mt-0.5 text-xs text-slate-500">Default banking labels</p>
          </button>

          <button
            type="button"
            onClick={() => onChangeLanguage('am')}
            className={`min-h-[48px] rounded-xl border px-4 py-3 text-left transition-colors ${
              language === 'am'
                ? 'border-[#4A148C] bg-[#4A148C]/6 text-[#4A148C]'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <p className="text-sm font-semibold">አማርኛ</p>
            <p className="mt-0.5 text-xs text-slate-500">የኢትዮጵያ ብር በይነገጽ</p>
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
          <PWAInstallButton language={language} variant="settings" />
          <button
            type="button"
            onClick={onResetDemo}
            className="flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4 text-[#4A148C]" />
            <span>{t.resetDemo}</span>
          </button>
        </div>
      </div>

      <div className="lg:col-span-6 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-[#4A148C]" />
          <h3 className="text-base font-semibold text-slate-900">{t.securitySection}</h3>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          <label className="flex min-h-[56px] cursor-pointer items-center justify-between gap-4 py-3">
            <span className="text-sm font-medium text-slate-800">{t.hideBalanceSetting}</span>
            <input
              type="checkbox"
              checked={settings.hideBalanceOnStart}
              onChange={(e) => onUpdateSettings({ hideBalanceOnStart: e.target.checked })}
              className="h-5 w-5 accent-[#4A148C] rounded cursor-pointer"
            />
          </label>

          <label className="flex min-h-[56px] cursor-pointer items-center justify-between gap-4 py-3">
            <span className="text-sm font-medium text-slate-800">{t.biometricSetting}</span>
            <input
              type="checkbox"
              checked={settings.biometricLogin}
              onChange={(e) => onUpdateSettings({ biometricLogin: e.target.checked })}
              className="h-5 w-5 accent-[#4A148C] rounded cursor-pointer"
            />
          </label>

          <label className="flex min-h-[56px] cursor-pointer items-center justify-between gap-4 py-3">
            <span className="text-sm font-medium text-slate-800">{t.smsAlertsSetting}</span>
            <input
              type="checkbox"
              checked={settings.smsAlerts}
              onChange={(e) => onUpdateSettings({ smsAlerts: e.target.checked })}
              className="h-5 w-5 accent-[#4A148C] rounded cursor-pointer"
            />
          </label>

          <div className="py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-800">{t.dailyLimitSetting}</span>
              <span className="font-mono-nums font-semibold text-[#4A148C]">
                {formatEtb(settings.dailyLimitEtb)}
              </span>
            </div>
            <input
              type="range"
              min={10000}
              max={150000}
              step={5000}
              value={settings.dailyLimitEtb}
              onChange={(e) => onUpdateSettings({ dailyLimitEtb: Number(e.target.value) })}
              className="mt-3 w-full accent-[#4A148C] cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
