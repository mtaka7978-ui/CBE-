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
