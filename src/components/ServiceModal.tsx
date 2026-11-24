import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Bell,
  Check,
  Copy,
  MessageSquare,
  MoreHorizontal,
  ReceiptText,
  Scan,
  Send,
  Share2,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  BankAccount,
  Language,
  ModalContext,
  NotificationItem,
  ServiceId,
  Transaction,
  TransactionCategory,
} from '../types/banking';
import { TranslationStrings } from '../data/translations';
import { ETHIOPIAN_BILLERS, EXTERNAL_NETWORKS, QUICK_CONTACTS } from '../data/mockBanking';
import { buildCbeSmsText, formatCbeAmount, formatEtb, getCbeFeeBreakdown } from '../utils/formatters';
import { QrView } from './QrView';
import { QrMatrix } from './QrMatrix';
import { CbeLogo } from './CbeLogo';

interface ExecutePayload {
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
}

interface ServiceModalProps {
  modal: ModalContext;
  account: BankAccount;
  transactions: Transaction[];
  notifications: NotificationItem[];
  language: Language;
  t: TranslationStrings;
  isBalanceVisible: boolean;
  onClose: () => void;
  onExecuteTransaction: (payload: ExecutePayload) => Transaction | null;
  onUpdateTransactionSms?: (
    txId: string,
    patch: { recipientPhone?: string; recipientBalanceEtb?: number }
  ) => void;
  onSelectTransaction: (tx: Transaction) => void;
  onOpenService: (
    serviceId: ServiceId,
    presetRecipient?: string,
    presetAmount?: number,
    presetBillerId?: string
  ) => void;
  onMarkAllRead: () => void;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  modal,
  account,
  transactions,
  notifications,
  language,
  t,
  isBalanceVisible,
  onClose,
  onExecuteTransaction,
  onUpdateTransactionSms,
  onSelectTransaction,
  onOpenService,
  onMarkAllRead,
}) => {
  const [recipient, setRecipient] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientBalance, setRecipientBalance] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pin, setPin] = useState('1234');
  const [networkId, setNetworkId] = useState(EXTERNAL_NETWORKS[0].id);
  const [billerId, setBillerId] = useState(ETHIOPIAN_BILLERS[0].id);
  const [billRef, setBillRef] = useState('0492817');
  const [airtimeOperator, setAirtimeOperator] = useState<'Ethio Telecom' | 'Safaricom'>('Ethio Telecom');
  const [loanAmount, setLoanAmount] = useState(5000);
  const [loanMonths, setLoanMonths] = useState<1 | 3 | 6>(3);
  const [cashoutCode, setCashoutCode] = useState<string | null>(null);
  const [showQrData, setShowQrData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [smsCopied, setSmsCopied] = useState(false);
  const [receiptSmsPhone, setReceiptSmsPhone] = useState('');
  const [receiptSmsBalance, setReceiptSmsBalance] = useState('');
  const [showReceiptSms, setShowReceiptSms] = useState(false);
  const [receiptFeedback, setReceiptFeedback] = useState<string | null>(null);

  const modalKey =
    modal?.type === 'receipt'
      ? `receipt:${modal.transaction.id}`
      : modal?.type === 'service'
        ? `service:${modal.serviceId}:${modal.presetRecipient ?? ''}:${modal.presetAmount ?? ''}:${modal.presetBillerId ?? ''}`
        : modal?.type ?? 'none';

  useEffect(() => {
    setError(null);
    setCashoutCode(null);
    setShowQrData(false);
    setShowReceiptSms(false);
    setSmsCopied(false);
    setReceiptFeedback(null);
    if (modal?.type === 'receipt') {
      setReceiptSmsPhone(modal.transaction.recipientPhone ?? '');
      const initialBal =
        modal.transaction.recipientBalanceEtb ??
        modal.transaction.balanceAfterEtb ??
        account.balanceEtb;
      setReceiptSmsBalance(formatCbeAmount(initialBal));
    }
    if (modal?.type === 'service') {
      const preset = modal.presetRecipient ?? '';
      const matchedContact = QUICK_CONTACTS.find(
        (c) => c.name === preset || c.nameAm === preset || c.accountNumber === preset
      );
      if (matchedContact) {
        setRecipient(language === 'am' ? matchedContact.nameAm : matchedContact.name);
        setRecipientAccount(matchedContact.accountNumber);
        setRecipientPhone(matchedContact.phone);
      } else {
        setRecipient(preset);
        setRecipientAccount(modal.serviceId === 'send' ? '' : preset);
        setRecipientPhone('');
      }
      setRecipientBalance('');
      setAmount(modal.presetAmount ? String(modal.presetAmount) : '');
      setNote('');
      if (modal.serviceId === 'bills') {
        const selected =
          ETHIOPIAN_BILLERS.find((b) => b.id === modal.presetBillerId) ?? ETHIOPIAN_BILLERS[0];
        setBillerId(selected.id);
        setAmount(String(modal.presetAmount ?? selected.sampleDue));
      }
      if (modal.serviceId === 'airtime' && !modal.presetRecipient) {
        setRecipient('0911482910');
      }
      if (modal.serviceId === 'cashout' && !modal.presetAmount) {
        setAmount('1000');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalKey, language]);

  if (!modal) return null;

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(account.fullNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const showReceiptNote = (msg: string) => {
    setReceiptFeedback(msg);
    setTimeout(() => setReceiptFeedback(null), 2200);
  };

  const handleDownloadReceipt = (tx: Transaction) => {
    const fromText =
      tx.direction === 'debit'
        ? `Webalem Tasfaye (${account.fullNumber})`
        : `${tx.counterparty} (${tx.accountOrPhone})`;
    const toText =
      tx.direction === 'debit'
        ? `${tx.counterparty} (${tx.accountOrPhone})`
        : `Webalem Tasfaye (${account.fullNumber})`;

    const content = [
      'CBE BANK MOBILE BANKING RECEIPT',
      '----------------------------------------',
      `Transaction ID: ${tx.reference}`,
      `Status:         ${tx.direction === 'debit' ? 'Transferred' : tx.status}`,
      `Date:           ${tx.timestamp}`,
      `From Account:   ${fromText}`,
      `To Account:     ${toText}`,
      `Transferred:    ${tx.amountEtb.toFixed(2)} ETB`,
      `Fee:            ${tx.feeEtb.toFixed(2)} ETB`,
      `Total:          ${(tx.amountEtb + tx.feeEtb).toFixed(2)} ETB`,
      tx.note ? `Note:           ${tx.note}` : '',
      '----------------------------------------',
    ]
      .filter(Boolean)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tx.reference}-receipt.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showReceiptNote(language === 'am' ? 'ደረሰኝ ተቀምጧል' : 'Receipt saved');
  };

  const handleScreenshotReceipt = async (
    tx: Transaction,
    summaryText: string,
    qrPayload: string
  ) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 240,
        margin: 1,
        color: { dark: '#111111', light: '#FFFFFF' },
      });

      const canvas = document.createElement('canvas');
      canvas.width = 760;
      canvas.height = 1040;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // White card background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Purple header
      ctx.fillStyle = '#6A1B9A';
      ctx.fillRect(0, 0, canvas.width, 165);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('Thank you', 44, 72);
      ctx.font = '20px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.fillText('Success', 44, 102);

      // Overlapping checkmark circle
      ctx.beginPath();
      ctx.arc(380, 165, 58, 0, Math.PI * 2);
      ctx.fillStyle = '#6A1B9A';
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // White check stroke
      ctx.beginPath();
      ctx.moveTo(354, 165);
      ctx.lineTo(372, 184);
      ctx.lineTo(408, 146);
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // Completed heading
      ctx.fillStyle = '#0F172A';
      ctx.font = '600 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Transaction Completed Successfully!', 380, 265);

      const fillRoundedRect = (x: number, rectY: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, rectY, w, h, r);
        } else {
          ctx.moveTo(x + r, rectY);
          ctx.lineTo(x + w - r, rectY);
          ctx.quadraticCurveTo(x + w, rectY, x + w, rectY + r);
          ctx.lineTo(x + w, rectY + h - r);
          ctx.quadraticCurveTo(x + w, rectY + h, x + w - r, rectY + h);
          ctx.lineTo(x + r, rectY + h);
          ctx.quadraticCurveTo(x, rectY + h, x, rectY + h - r);
          ctx.lineTo(x, rectY + r);
          ctx.quadraticCurveTo(x, rectY, x + r, rectY);
          ctx.closePath();
        }
        ctx.fill();
      };

      // Gray Summary box
      ctx.fillStyle = '#F4F4F6';
      fillRoundedRect(44, 298, 672, 680, 24);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748B';
      ctx.font = '500 20px sans-serif';
      ctx.fillText('Transaction Summary', 74, 344);

      // Wrap summary text
      ctx.fillStyle = '#1E293B';
      ctx.font = '22px sans-serif';
      const words = summaryText.split(/\s+/);
      let line = '';
      let y = 392;
      const maxWidth = 612;
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth) {
          ctx.fillText(line, 74, y);
          line = word;
          y += 32;
        } else {
          line = test;
        }
      }
      if (line) {
        ctx.fillText(line, 74, y);
      }

      // Draw QR code image
      const qrImg = new Image();
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject(new Error('QR image load failed'));
        qrImg.src = qrDataUrl;
      });
      const qrSize = 230;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = Math.max(y + 42, 610);
      ctx.fillStyle = '#FFFFFF';
      fillRoundedRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 18);
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // CBE footer text
      ctx.textAlign = 'center';
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('Commercial Bank of Ethiopia', 380, qrY + qrSize + 52);
      ctx.fillStyle = '#64748B';
      ctx.font = '18px sans-serif';
      ctx.fillText('The bank you can always rely on!', 380, qrY + qrSize + 82);

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `${tx.reference}-cbe-screenshot.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showReceiptNote(language === 'am' ? 'ስክሪንሾት ተቀምጧል' : 'Screenshot saved');
    } catch {
      handleDownloadReceipt(tx);
    }
  };

  const handleShareReceipt = async (tx: Transaction, summaryText: string) => {
    const shareText = `Commercial Bank of Ethiopia\n${summaryText}`;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `CBE Receipt · ${tx.reference}`,
          text: shareText,
        });
        return;
      } catch {
        // Fallback to copy if share canceled or unsupported
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      // Ignore clipboard failures
    }
    showReceiptNote(language === 'am' ? 'ደረሰኙ ተቀድቷል' : 'Receipt copied to share');
  };

  const handleServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (modal.type !== 'service') return;

    const serviceId = modal.serviceId;
    const numericAmount = serviceId === 'loan' ? loanAmount : Number(amount);

    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError(t.enterValidAmount);
      return;
    }

    let feeEtb = 0;
    if (serviceId === 'send') {
      feeEtb = 0.61;
    } else if (serviceId === 'transfers') {
      feeEtb = EXTERNAL_NETWORKS.find((n) => n.id === networkId)?.fee ?? 0;
    } else if (serviceId === 'bills') {
      feeEtb = ETHIOPIAN_BILLERS.find((b) => b.id === billerId)?.fee ?? 0;
    }

    if (serviceId !== 'loan' && numericAmount + feeEtb > account.balanceEtb) {
      setError(t.insufficientBalance);
      return;
    }

    if (serviceId === 'cashout') {
      const token = String(Math.floor(100000 + Math.random() * 900000));
      const tx = onExecuteTransaction({
        title: 'ATM / Agent Cash Out',
        titleAm: 'ጥሬ ገንዘብ ማውጣት',
        counterparty: `Cardless Token #${token}`,
        accountOrPhone: account.maskedNumber,
        category: 'cashout',
        direction: 'debit',
        amountEtb: numericAmount,
        feeEtb: 0,
        note: 'Valid for 30 minutes at any CBE Bank ATM or Agent',
      });
      if (tx) {
        setCashoutCode(token);
      }
      return;
    }

    let payload: ExecutePayload;
    if (serviceId === 'send') {
      const targetName = recipient.trim() || 'Tsgie Mesho Mesfn';
      const targetAcct = recipientAccount.trim() || '1000519308397';
      const cleanedRecBal = recipientBalance.replace(/,/g, '').trim();
      const parsedRecBal =
        cleanedRecBal !== '' && !Number.isNaN(Number(cleanedRecBal))
          ? Number(cleanedRecBal)
          : undefined;
      payload = {
        title: `Transfer to ${targetName}`,
        titleAm: `ለ${targetName} የተላከ`,
        counterparty: targetName,
        accountOrPhone: targetAcct,
        category: 'transfer',
        direction: 'debit',
        amountEtb: numericAmount,
        feeEtb,
        note: note.trim() || 'MB Transfer',
        recipientPhone: recipientPhone.trim() || undefined,
        recipientBalanceEtb: parsedRecBal,
      };
    } else if (serviceId === 'transfers') {
      const net = EXTERNAL_NETWORKS.find((n) => n.id === networkId)!;
      const target = recipient.trim() || '10009482011';
      payload = {
        title: `${net.name} Transfer`,
        titleAm: `የ${net.name} ዝውውር`,
        counterparty: net.name,
        accountOrPhone: target,
        category: 'transfer',
        direction: 'debit',
        amountEtb: numericAmount,
        feeEtb,
        note: note.trim() || undefined,
      };
    } else if (serviceId === 'airtime') {
      const phone = recipient.trim() || '0911482910';
      payload = {
        title: `${airtimeOperator} Airtime`,
        titleAm: `${airtimeOperator} የአየር ሰዓት`,
        counterparty: phone,
        accountOrPhone: phone,
        category: 'airtime',
        direction: 'debit',
        amountEtb: numericAmount,
        feeEtb: 0,
        recipientPhone: phone,
      };
    } else if (serviceId === 'bills') {
      const biller = ETHIOPIAN_BILLERS.find((b) => b.id === billerId)!;
      payload = {
        title: biller.name,
        titleAm: biller.name,
        counterparty: `Ref #${billRef || '0492817'}`,
        accountOrPhone: billRef || '0492817',
        category: 'bill',
        direction: 'debit',
        amountEtb: numericAmount,
        feeEtb,
        note: note.trim() || undefined,
      };
    } else if (serviceId === 'merchant') {
      const merch = recipient.trim() || '408120';
      payload = {
        title: `Merchant #${merch}`,
        titleAm: `ነጋዴ #${merch}`,
        counterparty: `Till ID ${merch}`,
        accountOrPhone: merch,
        category: 'merchant',
        direction: 'debit',
        amountEtb: numericAmount,
        feeEtb: 0,
        note: note.trim() || undefined,
      };
    } else {
      // Fast loan disbursement
      payload = {
        title: 'Fast Loan Disbursement',
        titleAm: 'የፈጣን ብድር ገቢ',
        counterparty: `${loanMonths} ${t.monthsLabel} Term`,
        accountOrPhone: account.maskedNumber,
        category: 'loan',
        direction: 'credit',
        amountEtb: numericAmount,
        feeEtb: 0,
        note: `4.5% service charge · Repay in ${loanMonths} months`,
      };
    }

    const created = onExecuteTransaction(payload);
    if (created) {
      onSelectTransaction(created);
    }
  };

  const getModalTitle = (): string => {
    if (modal.type === 'miniStatement') return t.miniStatement;
    if (modal.type === 'accountDetails') return t.accountDetailsTitle;
    if (modal.type === 'notifications') return t.notifications;
    if (modal.type === 'receipt') return t.paymentSuccess;
    const titles: Record<ServiceId, string> = {
      send: t.serviceSend,
      transfers: t.serviceTransfers,
      qr: t.serviceQr,
      airtime: t.serviceAirtime,
      bills: t.serviceBills,
      merchant: t.serviceMerchant,
      cashout: t.serviceCashout,
      loan: t.serviceLoan,
    };
    return titles[modal.serviceId];
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center ${
        modal.type === 'receipt'
          ? 'items-stretch bg-white sm:items-center sm:bg-slate-950/55 sm:backdrop-blur-xs sm:p-4'
          : 'items-end bg-slate-950/50 backdrop-blur-xs sm:items-center sm:p-4'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label={getModalTitle()}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-lg overflow-y-auto bg-white ${
          modal.type === 'receipt'
            ? 'min-h-screen sm:min-h-0 sm:max-h-[92vh] sm:rounded-2xl sm:shadow-2xl p-0'
            : 'max-h-[92vh] rounded-t-3xl shadow-2xl sm:rounded-2xl p-5 sm:p-6'
        }`}
      >
        {modal.type !== 'receipt' && (
          <>
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200 sm:hidden" />

            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">{getModalTitle()}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={t.close}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </>
        )}

        {/* Account Details */}
        {modal.type === 'accountDetails' && (
          <div className="mt-5 space-y-4">
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 px-4">
              <div className="flex items-center justify-between py-3.5 text-sm">
                <span className="text-slate-500">{t.accountHolder}</span>
                <span className="font-semibold text-slate-900">Webalem Tasfaye</span>
              </div>
              <div className="flex items-center justify-between py-3.5 text-sm">
                <span className="text-slate-500">{t.accountNumber}</span>
                <span className="font-mono-nums font-semibold text-slate-900">{account.fullNumber}</span>
              </div>
              <div className="flex items-center justify-between py-3.5 text-sm">
                <span className="text-slate-500">IBAN</span>
                <span className="font-mono-nums text-xs font-medium text-slate-800">{account.iban}</span>
              </div>
              <div className="flex items-center justify-between py-3.5 text-sm">
                <span className="text-slate-500">{t.branchName}</span>
                <span className="text-right font-medium text-slate-800">
                  {language === 'am' ? account.branchAm : account.branch}
                </span>
              </div>
              <div className="flex items-center justify-between py-3.5 text-sm">
                <span className="text-slate-500">{t.interestRate}</span>
                <span className="font-mono-nums font-semibold text-emerald-700">{account.interestRate}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyAccount}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#4A148C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#3B0F70]"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? t.copied : t.copyNumber}</span>
            </button>
          </div>
        )}

        {/* Mini Statement */}
        {modal.type === 'miniStatement' && (
          <div className="mt-4 divide-y divide-slate-100">
            {transactions.slice(0, 5).map((tx) => (
              <button
                key={tx.id}
                type="button"
                onClick={() => onSelectTransaction(tx)}
                className="flex min-h-[60px] w-full items-center justify-between gap-3 py-3 text-left hover:bg-slate-50 rounded-xl px-2 -mx-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {language === 'am' ? tx.titleAm : tx.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {tx.timestamp} · <span className="font-mono-nums">{tx.reference}</span> ·{' '}
                    <span className="font-medium text-emerald-700">
                      {language === 'am' ? 'ተላልፏል' : 'Transferred'}
                    </span>
                  </p>
                </div>
                <span
                  className={`font-mono-nums text-sm font-semibold whitespace-nowrap ${
                    tx.direction === 'credit' ? 'text-emerald-700' : 'text-slate-900'
                  }`}
                >
                  {tx.direction === 'credit' ? '+' : '-'}
                  {formatEtb(tx.amountEtb, isBalanceVisible)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Notifications */}
        {modal.type === 'notifications' && (
          <div className="mt-4 space-y-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-xs font-semibold text-[#4A148C] hover:underline"
              >
                {t.markAllRead}
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">{t.noNotifications}</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 py-3.5">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        n.read ? 'bg-slate-100 text-slate-500' : 'bg-[#4A148C]/10 text-[#4A148C]'
                      }`}
                    >
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">
                          {language === 'am' ? n.titleAm : n.title}
                        </p>
                        <span className="text-xs text-slate-400 whitespace-nowrap">{n.timeAgo}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-line break-words text-xs leading-relaxed text-slate-600">
                        {language === 'am' ? n.detailAm : n.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CBE Bank Transaction Completion Receipt */}
        {modal.type === 'receipt' && (() => {
          const tx = modal.transaction;
          const safeAmount = Number.isFinite(tx.amountEtb) ? tx.amountEtb : 0;
          const safeFee = Number.isFinite(tx.feeEtb) ? tx.feeEtb : 0;
          const safeAccountOrPhone = tx.accountOrPhone ?? '';
          const totalAmount = safeAmount + safeFee;
          const fees = getCbeFeeBreakdown(safeFee);
          const senderTail = (account.fullNumber ?? '').slice(-4) || '3347';
          const recipientDigits = safeAccountOrPhone.replace(/\D/g, '').slice(-4) || '8397';
          const reasonText = tx.note || (tx.category === 'transfer' ? 'MB Transfer' : tx.title);

          const fromLabel =
            tx.direction === 'debit'
              ? `Webalem Tasfaye (${account.fullNumber})`
              : `${tx.counterparty} (${tx.accountOrPhone})`;
          const toLabel =
            tx.direction === 'debit'
              ? `${tx.counterparty} (${tx.accountOrPhone})`
              : `Webalem Tasfaye (${account.fullNumber})`;

          const qrTransferPayload = [
            `CBE TRANSFER`,
            `Status: Transferred`,
            `Transaction ID: ${tx.reference} (Transferred)`,
            `From: ${fromLabel}`,
            `To: ${toLabel}`,
            `Transferred: ETB ${tx.amountEtb.toFixed(2)}`,
            `Total: ETB ${totalAmount.toFixed(2)}`,
            `Date: ${tx.timestamp}`,
          ].join('\n');

          const smsRecipientName =
            tx.direction === 'debit' ? tx.counterparty : 'Webalem Tasfaye';
          const cleanedReceiptBal = receiptSmsBalance.replace(/,/g, '').trim();
          const parsedReceiptBalance = Number(cleanedReceiptBal);
          const effectiveSmsBalance =
            cleanedReceiptBal !== '' && !Number.isNaN(parsedReceiptBalance)
              ? parsedReceiptBalance
              : tx.recipientBalanceEtb ?? tx.balanceAfterEtb ?? account.balanceEtb;
          const smsText = buildCbeSmsText({
            holderName: smsRecipientName,
            accountNumber: account.fullNumber,
            amountEtb: tx.amountEtb,
            feeEtb: tx.feeEtb,
            currentBalanceEtb: effectiveSmsBalance,
            reference: tx.reference,
            direction: tx.direction,
            counterparty: tx.counterparty,
          });
          const cleanSmsPhone = receiptSmsPhone.replace(/[^\d+]/g, '');
          const smsHref = cleanSmsPhone
            ? `sms:${cleanSmsPhone}?body=${encodeURIComponent(smsText)}`
            : `sms:?body=${encodeURIComponent(smsText)}`;

          const handleCopySms = async () => {
            try {
              await navigator.clipboard.writeText(smsText);
            } catch {
              // Ignore clipboard errors
            }
            setSmsCopied(true);
            setTimeout(() => setSmsCopied(false), 1800);
          };

          const summaryPlainText =
            tx.direction === 'debit'
              ? `ETB ${tx.amountEtb.toFixed(2)} has been debited from Webalem Tasfaye ETB-${senderTail} for ${tx.counterparty} ETB-${recipientDigits} on ${tx.timestamp} with transaction ID: ${tx.reference}. Reason: ${reasonText} Total Amount Debited: ETB${totalAmount.toFixed(2)} with Service Charge of ETB${fees.serviceCharge.toFixed(2)}, VAT (15%) of ETB${fees.vat.toFixed(2)} and Disaster Recovery (5%) of ETB${fees.disasterRecovery.toFixed(2)}.`
              : `ETB ${tx.amountEtb.toFixed(2)} has been credited to Webalem Tasfaye ETB-${senderTail} from ${tx.counterparty} on ${tx.timestamp} with transaction ID: ${tx.reference}. Reason: ${reasonText} Total Amount Credited: ETB${tx.amountEtb.toFixed(2)}.`;

          return (
            <div className="min-h-full bg-white">
              {/* Sticky Purple Receipt Top Bar */}
              <div className="sticky top-0 z-30 bg-[#6A1B9A] px-5 pt-4 pb-3 text-white">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                      <ShieldCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold leading-tight text-white">
                        {language === 'am' ? 'እናመሰግናለን' : 'Thank you'}
                      </h2>
                      <p className="text-xs font-medium text-white/85">
                        {language === 'am' ? 'ተሳክቷል' : 'Success'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleScreenshotReceipt(tx, summaryPlainText, qrTransferPayload)
                    }
                    aria-label={language === 'am' ? 'ስክሪንሾት' : 'Screenshot'}
                    title={language === 'am' ? 'ስክሪንሾት' : 'Screenshot'}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-white/90 transition-colors hover:bg-white/15 hover:text-white"
                  >
                    <Scan className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Purple Backing Behind Overlapping Checkmark */}
              <div aria-hidden="true" className="relative z-10 h-12 bg-[#6A1B9A]" />

              {/* White Curved Sheet Overlapping Purple Header */}
              <div className="relative z-20 -mt-8 rounded-t-[32px] bg-white px-5 pb-8 pt-13 sm:px-6">
                {/* Overlapping Purple Circle Checkmark */}
                <div className="absolute -top-11 left-1/2 flex h-[84px] w-[84px] -translate-x-1/2 items-center justify-center rounded-full border-[5px] border-white bg-[#6A1B9A] shadow-md">
                  <Check className="h-10 w-10 stroke-[3.2] text-white" />
                </div>

                <p className="text-center text-sm sm:text-base font-semibold text-slate-900">
                  {language === 'am'
                    ? 'ግብይቱ በተሳካ ሁኔታ ተጠናቋል!'
                    : 'Transaction Completed Successfully!'}
                </p>

                {/* Transaction Summary Card */}
                <div className="mt-4 rounded-2xl border border-slate-200/75 bg-[#F4F4F6] p-4 sm:p-5 shadow-xs">
                  <p className="text-xs font-medium text-slate-500">
                    {language === 'am' ? 'የግብይት ማጠቃለያ' : 'Transaction Summary'}
                  </p>

                  {tx.direction === 'debit' ? (
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-800">
                      <span className="font-mono-nums font-bold text-slate-950">
                        ETB {tx.amountEtb.toFixed(2)}
                      </span>{' '}
                      has been debited from{' '}
                      <span className="font-bold text-slate-950">
                        Webalem Tasfaye ETB-{senderTail}
                      </span>{' '}
                      for{' '}
                      <span className="font-bold text-slate-950">
                        {tx.counterparty} ETB-{recipientDigits}
                      </span>{' '}
                      on <span className="font-bold text-slate-950">{tx.timestamp}</span> with
                      transaction ID:{' '}
                      <span className="font-mono-nums font-bold text-slate-950">
                        {tx.reference}
                      </span>
                      . Reason: {reasonText}. Total Amount Debited:{' '}
                      <span className="font-mono-nums font-semibold text-slate-950">
                        ETB{totalAmount.toFixed(2)}
                      </span>{' '}
                      with Service Charge of{' '}
                      <span className="font-mono-nums">
                        ETB{fees.serviceCharge.toFixed(2)}
                      </span>
                      , VAT (15%) of{' '}
                      <span className="font-mono-nums">ETB{fees.vat.toFixed(2)}</span> and Disaster
                      Recovery (5%) of{' '}
                      <span className="font-mono-nums">
                        ETB{fees.disasterRecovery.toFixed(2)}
                      </span>
                      .
                    </p>
                  ) : (
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-800">
                      <span className="font-mono-nums font-bold text-slate-950">
                        ETB {tx.amountEtb.toFixed(2)}
                      </span>{' '}
                      has been credited to{' '}
                      <span className="font-bold text-slate-950">
                        Webalem Tasfaye ETB-{senderTail}
                      </span>{' '}
                      from <span className="font-bold text-slate-950">{tx.counterparty}</span> on{' '}
                      <span className="font-bold text-slate-950">{tx.timestamp}</span> with
                      transaction ID:{' '}
                      <span className="font-mono-nums font-bold text-slate-950">
                        {tx.reference}
                      </span>
                      . Reason: {reasonText}. Total Amount Credited:{' '}
                      <span className="font-mono-nums font-semibold text-slate-950">
                        ETB{tx.amountEtb.toFixed(2)}
                      </span>
                      .
                    </p>
                  )}

                  {/* Centered Scannable Receipt QR Code (Encodes From -> To Accounts) */}
                  <div className="mt-5 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => setShowQrData((prev) => !prev)}
                      title="Tap to view QR transfer accounts"
                      className="rounded-2xl border-2 border-slate-500/70 bg-white p-1.5 transition-transform hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-[#6A1B9A]"
                    >
                      <QrMatrix payload={qrTransferPayload} size={156} />
                    </button>

                    {/* Commercial Bank of Ethiopia Golden Emblem directly under QR code */}
                    <div className="mt-3.5 flex items-center justify-center gap-3">
                      <CbeLogo size={62} className="shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-slate-700">
                          {language === 'am'
                            ? 'የኢትዮጵያ ንግድ ባንክ'
                            : 'Commercial Bank of Ethiopia'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {language === 'am'
                            ? 'ሁልጊዜ የሚታመኑበት ባንክ!'
                            : 'The bank you can always rely on!'}
                        </p>
                      </div>
                    </div>

                    {showQrData && (
                      <div className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-left text-xs text-slate-700 space-y-1">
                        <p>
                          <span className="font-semibold text-slate-900">TX ID:</span>{' '}
                          <span className="font-mono-nums font-semibold">{tx.reference}</span>{' '}
                          <span className="font-semibold text-emerald-700">· Transferred</span>
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">From:</span>{' '}
                          <span className="font-mono-nums">{fromLabel}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">To:</span>{' '}
                          <span className="font-mono-nums">{toLabel}</span>
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">Transferred:</span>{' '}
                          <span className="font-mono-nums font-semibold">
                            ETB {tx.amountEtb.toFixed(2)}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3-Item Receipt Action Row (Receipt | Screenshot | Share) + Full-Width Close Button */}
                <div className="mt-5 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadReceipt(tx)}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs sm:text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 whitespace-nowrap"
                  >
                    <ReceiptText className="h-4 w-4 text-slate-700 shrink-0" />
                    <span>{language === 'am' ? 'ደረሰኝ' : 'Receipt'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleScreenshotReceipt(tx, summaryPlainText, qrTransferPayload)
                    }
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs sm:text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 whitespace-nowrap"
                  >
                    <Scan className="h-4 w-4 text-slate-700 shrink-0" />
                    <span>{language === 'am' ? 'ስክሪንሾት' : 'Screenshot'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareReceipt(tx, summaryPlainText)}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs sm:text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 whitespace-nowrap"
                  >
                    <Share2 className="h-4 w-4 text-slate-700 shrink-0" />
                    <span>{language === 'am' ? 'አጋራ' : 'Share'}</span>
                  </button>
                </div>

                {receiptFeedback && (
                  <p className="mt-1.5 text-center text-xs font-medium text-[#6A1B9A]">
                    {receiptFeedback}
                  </p>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2.5 flex min-h-[50px] w-full items-center justify-center rounded-full bg-[#E3E5EA] px-6 text-base font-semibold text-slate-700 transition-colors hover:bg-[#D5D8E0] active:scale-[0.99]"
                >
                  {t.close}
                </button>

                {/* Subtle Three-Dot Line Toggle for Transaction SMS */}
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowReceiptSms((prev) => !prev)}
                    aria-expanded={showReceiptSms}
                    aria-label={language === 'am' ? 'የግብይት ኤስኤምኤስ አሳይ' : 'Show transaction SMS'}
                    className="flex min-h-[38px] min-w-[56px] items-center justify-center rounded-full px-3 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>

                {/* Official CBE SMS Alert Card + Send Text to Transaction Person (Hidden until 3-dot touched) */}
                {showReceiptSms && (
                  <div className="mt-2 rounded-2xl border border-slate-200/80 bg-[#1B1D24] p-4 text-white">
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-[#E8C16F]" />
                      <span className="text-xs font-semibold text-[#E8C16F]">
                        {language === 'am' ? 'የሲቢኢ ኤስኤምኤስ መልዕክት' : 'CBE Transaction SMS'}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 whitespace-pre-line break-words text-xs leading-relaxed text-slate-100">
                    {smsText}
                  </p>

                  <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-medium text-white/70">
                        {language === 'am' ? 'የተቀባይ ስልክ ቁጥር' : 'Recipient Phone Number'}
                      </label>
                      <input
                        type="tel"
                        value={receiptSmsPhone}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReceiptSmsPhone(val);
                          onUpdateTransactionSms?.(tx.id, { recipientPhone: val.trim() || undefined });
                        }}
                        placeholder="+251 911 204 511"
                        className="mt-1 min-h-[40px] w-full rounded-xl border border-white/15 bg-white/10 px-3 font-mono-nums text-xs text-white placeholder:text-white/40 focus:border-[#E8C16F] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-white/70">
                        {language === 'am'
                          ? 'የተቀባይ የአሁን ቀሪ ሂሳብ (ብር)'
                          : 'Reception Current Balance (ETB)'}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={receiptSmsBalance}
                        onChange={(e) => {
                          const val = e.target.value;
                          setReceiptSmsBalance(val);
                          const cleaned = val.replace(/,/g, '').trim();
                          const num = Number(cleaned);
                          if (cleaned !== '' && !Number.isNaN(num) && num >= 0) {
                            onUpdateTransactionSms?.(tx.id, { recipientBalanceEtb: num });
                          }
                        }}
                        onBlur={() => {
                          const cleaned = receiptSmsBalance.replace(/,/g, '').trim();
                          const num = Number(cleaned);
                          if (cleaned !== '' && !Number.isNaN(num) && num >= 0) {
                            setReceiptSmsBalance(formatCbeAmount(num));
                          }
                        }}
                        placeholder="1,250,000.00"
                        className="mt-1 min-h-[40px] w-full rounded-xl border border-white/15 bg-white/10 px-3 font-mono-nums text-xs text-white placeholder:text-white/40 focus:border-[#E8C16F] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleCopySms}
                      className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-semibold text-white transition-colors hover:bg-white/20"
                    >
                      {smsCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>
                        {smsCopied
                          ? t.copied
                          : language === 'am'
                            ? 'መልዕክት ቅዳ'
                            : 'Copy SMS'}
                      </span>
                    </button>

                    <a
                      href={smsHref}
                      target="_top"
                      className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#E8C16F] px-3 text-xs font-bold text-slate-950 transition-colors hover:bg-[#DFB55B]"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>
                        {language === 'am' ? 'በኤስኤምኤስ ላክ' : 'Send SMS Text'}
                      </span>
                    </a>
                  </div>

                  <p className="mt-2.5 text-[11px] leading-relaxed text-white/60">
                    {language === 'am'
                      ? 'የስልክዎን የመልዕክት (Messages) መተግበሪያ ይከፍታል — ለመላክ በስልክዎ ላይ Send ይንኩ።'
                      : 'Opens your phone’s Messages app pre-filled — tap Send in Messages to deliver via your SIM.'}
                  </p>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* QR Modal Shortcut */}
        {modal.type === 'service' && modal.serviceId === 'qr' && (
          <div className="mt-4">
            <QrView
              account={account}
              language={language}
              t={t}
              onScanPresetPay={(merchant, merchantId, presetAmount, presetNote) => {
                const tx = onExecuteTransaction({
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
                if (tx) onSelectTransaction(tx);
              }}
            />
          </div>
        )}

        {/* Interactive Banking Forms */}
        {modal.type === 'service' && modal.serviceId !== 'qr' && (
          <div className="mt-5">
            {cashoutCode ? (
              <div className="space-y-4 text-center">
                <p className="text-sm font-medium text-slate-600">{t.withdrawalTokenReady}</p>
                <div className="rounded-2xl bg-[#F6F5FA] py-6">
                  <p className="font-mono-nums text-4xl font-bold tracking-[0.25em] text-[#4A148C]">
                    {cashoutCode}
                  </p>
                </div>
                <p className="font-mono-nums text-sm font-semibold text-slate-800">
                  {formatEtb(Number(amount))}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[48px] w-full rounded-xl bg-[#4A148C] px-4 text-sm font-semibold text-white hover:bg-[#3B0F70]"
                >
                  {t.close}
                </button>
              </div>
            ) : (
              <form onSubmit={handleServiceSubmit} className="space-y-4">
                {modal.serviceId === 'send' && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-slate-500">{t.quickTransfer}</p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {QUICK_CONTACTS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setRecipient(language === 'am' ? c.nameAm : c.name);
                            setRecipientAccount(c.accountNumber);
                            setRecipientPhone(c.phone);
                          }}
                          className={`min-h-[40px] rounded-xl border px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                            recipientAccount === c.accountNumber
                              ? 'border-[#4A148C] bg-[#4A148C]/8 text-[#4A148C]'
                              : 'border-slate-200 bg-[#F6F5FA] text-slate-700 hover:bg-white'
                          }`}
                        >
                          {language === 'am' ? c.nameAm : c.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {modal.serviceId === 'transfers' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600">
                      {t.selectNetwork}
                    </label>
                    <select
                      value={networkId}
                      onChange={(e) => setNetworkId(e.target.value)}
                      className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F6F5FA] px-3.5 text-sm text-slate-900 focus:border-[#4A148C] focus:bg-white focus:outline-none"
                    >
                      {EXTERNAL_NETWORKS.map((net) => (
                        <option key={net.id} value={net.id}>
                          {net.name} ({net.fee === 0 ? '0 ETB fee' : `${net.fee} ETB fee`})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {modal.serviceId === 'airtime' && (
                  <div className="grid grid-cols-2 gap-2">
                    {(['Ethio Telecom', 'Safaricom'] as const).map((op) => (
                      <button
                        key={op}
                        type="button"
                        onClick={() => setAirtimeOperator(op)}
                        className={`min-h-[44px] rounded-xl border text-sm font-semibold transition-colors ${
                          airtimeOperator === op
                            ? 'border-[#4A148C] bg-[#4A148C]/8 text-[#4A148C]'
                            : 'border-slate-200 bg-[#F6F5FA] text-slate-700'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                )}

                {modal.serviceId === 'bills' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-600">
                        {t.selectBiller}
                      </label>
                      <select
                        value={billerId}
                        onChange={(e) => {
                          const next = ETHIOPIAN_BILLERS.find((b) => b.id === e.target.value);
                          setBillerId(e.target.value);
                          if (next) setAmount(String(next.sampleDue));
                        }}
                        className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F6F5FA] px-3.5 text-sm text-slate-900 focus:border-[#4A148C] focus:bg-white focus:outline-none"
                      >
                        {ETHIOPIAN_BILLERS.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600">
                        {t.billReference}
                      </label>
                      <input
                        type="text"
                        value={billRef}
                        onChange={(e) => setBillRef(e.target.value)}
                        required
                        className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F6F5FA] px-3.5 font-mono-nums text-sm text-slate-900 focus:border-[#4A148C] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </>
                )}

                {modal.serviceId === 'send' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600">
                          {t.accountNumber}
                        </label>
                        <input
                          type="text"
                          value={recipientAccount}
                          onChange={(e) => setRecipientAccount(e.target.value)}
                          required
                          placeholder="1000412099104"
                          className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F6F5FA] px-3.5 font-mono-nums text-sm text-slate-900 focus:border-[#4A148C] focus:bg-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600">
                          {language === 'am' ? 'የተቀባይ ስም' : 'Recipient Name'}
                        </label>
                        <input
                          type="text"
                          value={recipient}
                          onChange={(e) => setRecipient(e.target.value)}
                          required
                          placeholder="Tsgie Mesho Mesfn"
                          className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F6F5FA] px-3.5 text-sm text-slate-900 focus:border-[#4A148C] focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-600">
                          {language === 'am' ? 'የተቀባይ ስልክ (ለኤስኤምኤስ አማራጭ)' : 'Recipient Phone (Optional for SMS)'}
                        </label>
                        <input
                          type="tel"
                          value={recipientPhone}
                          onChange={(e) => setRecipientPhone(e.target.value)}
                          placeholder="+251 911 204 511"
                          className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F6F5FA] px-3.5 font-mono-nums text-sm text-slate-900 focus:border-[#4A148C] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600">
                          {language === 'am'
                            ? 'የተቀባይ የአሁን ቀሪ ሂሳብ (ብር)'
                            : 'Reception Current Balance (ETB)'}
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={recipientBalance}
                          onChange={(e) => setRecipientBalance(e.target.value)}
                          onBlur={() => {
                            const cleaned = recipientBalance.replace(/,/g, '').trim();
                            const num = Number(cleaned);
                            if (cleaned !== '' && !Number.isNaN(num) && num >= 0) {
                              setRecipientBalance(formatCbeAmount(num));
                            }
                          }}
                          placeholder="e.g. 1,250,000.00"
                          className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F6F5FA] px-3.5 font-mono-nums text-sm text-slate-900 focus:border-[#4A148C] focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(modal.serviceId === 'transfers' ||
                  modal.serviceId === 'airtime' ||
                  modal.serviceId === 'merchant') && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600">
                      {modal.serviceId === 'airtime'
                        ? t.phoneNumber
                        : modal.serviceId === 'merchant'
                          ? t.merchantId
                          : t.recipientAccount}
                    </label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      required
                      placeholder={
                        modal.serviceId === 'airtime'
                          ? '0911482910'
                          : modal.serviceId === 'merchant'
                            ? '408120'
                            : '1000****9104'
                      }
                      className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F6F5FA] px-3.5 text-sm text-slate-900 focus:border-[#4A148C] focus:bg-white focus:outline-none"
                    />
                  </div>
                )}

                {modal.serviceId === 'loan' ? (
                  <div className="space-y-4 rounded-xl bg-[#F6F5FA] p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-600">{t.loanEligibility}</span>
                      <span className="font-mono-nums text-xs font-semibold text-[#4A148C]">
                        {t.activeLoanLimit}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">{t.amountEtb}</span>
                        <span className="font-mono-nums text-xl font-bold text-slate-900">
                          {formatEtb(loanAmount)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={500}
                        max={15000}
                        step={500}
                        value={loanAmount}
                        onChange={(e) => setLoanAmount(Number(e.target.value))}
                        className="mt-2 w-full accent-[#4A148C] cursor-pointer"
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium text-slate-600">{t.repaymentTerm}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {([1, 3, 6] as const).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setLoanMonths(m)}
                            className={`min-h-[40px] rounded-xl border text-xs font-semibold transition-colors ${
                              loanMonths === m
                                ? 'border-[#4A148C] bg-white text-[#4A148C]'
                                : 'border-slate-200 bg-transparent text-slate-600'
                            }`}
                          >
                            {m} {t.monthsLabel}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200/80 pt-3 text-xs text-slate-600">
                      <span>{t.monthlyPayment}</span>
                      <span className="font-mono-nums font-semibold text-slate-900">
                        {formatEtb((loanAmount * 1.045) / loanMonths)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-600">{t.amountEtb}</label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      placeholder="0.00"
                      className="mt-1.5 min-h-[48px] w-full rounded-xl border border-slate-200 bg-[#F6F5FA] px-3.5 font-mono-nums text-lg font-semibold text-slate-900 focus:border-[#4A148C] focus:bg-white focus:outline-none"
                    />
                    {(modal.serviceId === 'airtime' || modal.serviceId === 'cashout') && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(modal.serviceId === 'airtime'
                          ? [25, 50, 100, 250, 500]
                          : [500, 1000, 2000, 5000]
                        ).map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setAmount(String(preset))}
                            className="min-h-[36px] rounded-lg border border-slate-200 bg-[#F6F5FA] px-3 font-mono-nums text-xs font-semibold text-slate-700 hover:border-[#4A148C] hover:text-[#4A148C]"
                          >
                            {preset} ETB
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {modal.serviceId !== 'airtime' && modal.serviceId !== 'loan' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600">
                      {t.optionalNote}
                    </label>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F6F5FA] px-3.5 text-sm text-slate-900 focus:border-[#4A148C] focus:bg-white focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    {t.securityPin}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    required
                    className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-[#F6F5FA] px-3.5 font-mono-nums text-sm tracking-[0.4em] text-slate-900 focus:border-[#4A148C] focus:bg-white focus:outline-none"
                  />
                </div>

                {error && (
                  <p role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="min-h-[48px] w-full rounded-xl bg-[#4A148C] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#3B0F70]"
                >
                  {modal.serviceId === 'cashout'
                    ? t.generateToken
                    : modal.serviceId === 'loan'
                      ? t.disburseLoan
                      : t.confirmPayment}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
