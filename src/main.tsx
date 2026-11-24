import React from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends React.Component<
  {children: React.ReactNode},
  ErrorBoundaryState
> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = {hasError: false, errorMessage: ''};
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected application error',
    };
  }

  handleRecover = async () => {
    try {
      localStorage.removeItem('cbebank_banking_state_v2');
      localStorage.removeItem('cbebank_banking_state_v1');
    } catch {
      // Ignore storage errors
    }
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister().catch(() => false)));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k).catch(() => false)));
      }
    } catch {
      // Ignore SW/cache errors
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#ECEEF2] p-5 text-slate-900">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#5B2082]/10 text-[#5B2082] font-bold text-lg">
              CBE
            </div>
            <h1 className="mt-4 text-base font-bold text-slate-900">
              Something interrupted the screen
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={this.handleRecover}
              className="mt-5 min-h-[44px] w-full rounded-xl bg-[#5B2082] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#49186A]"
            >
              Reset &amp; Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

if (import.meta.env.PROD) {
  registerSW({immediate: true});
} else {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => {
        regs.forEach((reg) => {
          const url = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '';
          if (url.includes('dev-sw.js') || url.includes('/sw.js')) {
            reg.unregister().catch(() => {});
          }
        });
      })
      .catch(() => {});
  }
  if ('caches' in window) {
    caches
      .keys()
      .then((keys) => {
        keys.forEach((key) => {
          caches.delete(key).catch(() => {});
        });
      })
      .catch(() => {});
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
