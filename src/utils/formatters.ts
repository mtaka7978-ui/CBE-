export function formatEtb(amount: number, visible = true): string {
  if (!visible) {
    return '****** ETB';
  }
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ETB`;
}

export function generateReference(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let suffix = '';
  for (let i = 0; i < 8; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `FT26${suffix}`;
}

export function getCbeFeeBreakdown(feeEtb: number): {
  serviceCharge: number;
  vat: number;
  disasterRecovery: number;
} {
  if (feeEtb <= 0) {
    return { serviceCharge: 0, vat: 0, disasterRecovery: 0 };
  }
  if (Math.abs(feeEtb - 0.61) < 0.005) {
    return { serviceCharge: 0.5, vat: 0.08, disasterRecovery: 0.03 };
  }
  const serviceCharge = Number((feeEtb / 1.2).toFixed(2));
  const vat = Number((serviceCharge * 0.15).toFixed(2));
  const disasterRecovery = Number((feeEtb - serviceCharge - vat).toFixed(2));
  return { serviceCharge, vat, disasterRecovery };
}

export function formatCbeSmsAccount(fullNumber: string): string {
  const digits = fullNumber.replace(/\s+/g, '');
  if (digits.length < 5) return digits;
  return `${digits.slice(0, 1)}********${digits.slice(-4)}`;
}

export function buildCbeSmsText(params: {
  holderName: string;
  accountNumber: string;
  amountEtb: number;
  feeEtb: number;
  currentBalanceEtb: number;
  reference: string;
  direction?: 'debit' | 'credit';
  counterparty?: string;
}): string {
  const smsAcct = formatCbeSmsAccount(params.accountNumber);
  const receiptUrl = `https://mbreciept.cbe.com.et/v2-${params.reference}`;
  const feedbackUrl = 'https://forms.gle/kGNGQpG3mQCCk3iD6';

  if (params.direction === 'credit') {
    return (
      `Dear ${params.holderName} A credit transaction of ETB ${params.amountEtb.toFixed(2)} ` +
      `has occurred on your account ${smsAcct}` +
      `${params.counterparty ? ` from ${params.counterparty}` : ''}. ` +
      `Your current balance is ETB ${params.currentBalanceEtb.toFixed(2)}. ` +
      `Thanks for Banking with CBE.\n${receiptUrl}  for feedback:\n${feedbackUrl}`
    );
  }

  const fees = getCbeFeeBreakdown(params.feeEtb);
  const total = params.amountEtb + params.feeEtb;

  return (
    `Dear ${params.holderName} A debit transaction of ETB ${params.amountEtb.toFixed(2)} ` +
    `has occurred on your account ${smsAcct}. ` +
    `Service charge of ETB ${fees.serviceCharge.toFixed(2)} and ` +
    `VAT(15%) of ETB ${fees.vat.toFixed(2)} and ` +
    `Disaster Recovery(5%) of ${fees.disasterRecovery.toFixed(2)} ` +
    `with total of ETB ${total.toFixed(2)}. ` +
    `Your current balance is ETB ${params.currentBalanceEtb.toFixed(2)}. ` +
    `Thanks for Banking with CBE.\n${receiptUrl}  for feedback:\n${feedbackUrl}`
  );
}
