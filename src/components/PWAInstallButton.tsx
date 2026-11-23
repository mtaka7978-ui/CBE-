import React, { useEffect, useState } from 'react';
import { Check, Copy, Download, ExternalLink, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Language } from '../types/banking';
import { QrMatrix } from './QrMatrix';
import { CbeLogo } from './CbeLogo';

interface PWAInstallButtonProps {
  language: Language;
  variant?: 'toolbar' | 'settings';
}

const FALLBACK_APP_URL = 'https://ais-dev-bfiqrsgwdh3d4jul7js6rk-99578682153.europe-west2.run.app';

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  language,
  variant = 'toolbar',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inIframe, setInIframe] = useState(false);
  const [appUrl, setAppUrl] = useState(FALLBACK_APP_URL);

  useEffect(() => {
    try {
      setInIframe(window.self !== window.top);
    } catch {
      setInIframe(true);
    }
    if (window.location?.origin && window.location.origin.startsWith('http')) {
      setAppUrl(window.location.origin);
    }
  }, []);

  if (isInstalled) {
    return null;
  }

  const label = language === 'am' ? 'መተግበሪያ ጫን' : 'Install App';

  const handleTrigger = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    setShowGuide(true);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  const buttonClasses =
    variant === 'toolbar'
      ? 'flex min-h-[44px] items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3.5 text-xs font-semibold text-white backdrop-blur-xs transition-colors hover:bg-white/20 whitespace-nowrap shrink-0'
      : 'flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#5B2082] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#49186A] whitespace-nowrap shrink-0';

  return (
    <>
      <button type="button" onClick={handleTrigger} className={buttonClasses}>
        <Download className={`h-4 w-4 ${variant === 'toolbar' ? 'text-[#E8C16F]' : 'text-white'}`} />
        <span>{label}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 backdrop-blur-xs sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={label}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGuide(false);
          }}
        >
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-3">
                <CbeLogo size={40} />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {language === 'am' ? 'CBE Bank መተግበሪያን ይጫኑ' : 'Install CBE Bank App'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'am'
                      ? 'በቀጥታ ከዚህ መተግበሪያ ስልክዎ ላይ ይጫኑ'
                      : 'Install directly to your phone home screen'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close"
                className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Direct Standalone Launch & Copy Link */}
            <div className="mt-4 space-y-3">
              {inIframe && (
                <p className="rounded-xl border border-[#5B2082]/15 bg-[#5B2082]/5 px-3.5 py-2.5 text-xs leading-relaxed text-slate-700">
                  {language === 'am'
                    ? 'መተግበሪያውን በቀጥታ ስልክዎ ላይ ለመጫን መጀመሪያ ከታች ያለውን ቁልፍ በመንካት ከቅድመ-ዕይታው ውጭ ይክፈቱት።'
                    : 'To trigger your phone’s native Install prompt directly, open the standalone app link below outside the preview frame.'}
                </p>
              )}

              <div className="flex flex-col gap-2.5 sm:flex-row">
                <a
                  href={appUrl}
                  target="_top"
                  rel="noopener noreferrer"
                  className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#5B2082] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#49186A] whitespace-nowrap"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  <span>
                    {language === 'am' ? 'መተግበሪያውን በቀጥታ ይክፈቱ' : 'Open Standalone App'}
                  </span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-700">
                        {language === 'am' ? 'ተቀድቷል' : 'Copied'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-[#5B2082]" />
                      <span>{language === 'am' ? 'ሊንኩን ቅዳ' : 'Copy Link'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Scannable QR to open on phone directly */}
            <div className="mt-4 flex flex-col items-center rounded-2xl border border-slate-200/80 bg-[#F8F8FB] p-4 text-center">
              <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-xs">
                <QrMatrix payload={appUrl} size={128} />
              </div>
              <p className="mt-2.5 text-xs font-medium text-slate-600">
                {language === 'am'
                  ? 'በስልክዎ ካሜራ ስካን በማድረግ በቀጥታ ይጫኑ'
                  : 'Scan with another phone camera to open & install'}
              </p>
            </div>

            {/* Platform steps */}
            {isIOS ? (
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p className="text-xs font-semibold text-slate-900">
                  {language === 'am'
                    ? 'በ iPhone / iPad Safari ላይ ለመጫን፦'
                    : 'iPhone & iPad (Safari):'}
                </p>
                <p className="flex items-center gap-2.5 rounded-xl bg-[#F4F4F6] p-3 text-xs font-medium">
                  <Share className="h-4 w-4 shrink-0 text-[#5B2082]" />
                  <span>
                    {language === 'am'
                      ? '1. ከታች ያለውን Share ይንኩ 2. "Add to Home Screen" የሚለውን ይምረጡ።'
                      : '1. Tap Share in Safari toolbar. 2. Scroll down and tap "Add to Home Screen".'}
                  </span>
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                <p className="text-xs font-semibold text-slate-900">
                  {language === 'am'
                    ? 'በ Android Chrome ላይ ለመጫን፦'
                    : 'Android (Chrome):'}
                </p>
                <p className="flex items-center gap-2.5 rounded-xl bg-[#F4F4F6] p-3 text-xs leading-relaxed">
                  <Smartphone className="h-4 w-4 shrink-0 text-[#5B2082]" />
                  <span>
                    {language === 'am'
                      ? 'ከላይ "መተግበሪያውን በቀጥታ ይክፈቱ" የሚለውን ከነኩ በኋላ በ Chrome ⋮ ምናሌ ውስጥ "Install app" ወይም "Add to Home screen" ይንኩ።'
                      : 'After opening the standalone app above, tap Chrome’s ⋮ menu and select "Install app" or "Add to Home screen".'}
                  </span>
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 min-h-[44px] w-full rounded-xl bg-slate-900 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              {language === 'am' ? 'ዝጋ' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
