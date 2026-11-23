import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Language } from '../types/banking';

interface OfflineIndicatorProps {
  language: Language;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ language }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-lg md:bottom-6"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>
        {language === 'am'
          ? 'ከመስመር ውጭ — የተቀመጠ መረጃ በመጠቀም ላይ'
          : 'Offline Mode — Using cached data'}
      </span>
    </div>
  );
};
