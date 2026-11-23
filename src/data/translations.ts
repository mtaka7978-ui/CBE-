import { Language } from '../types/banking';

export interface TranslationStrings {
  brandName: string;
  navHome: string;
  navHistory: string;
  navQr: string;
  navSettings: string;
  quickSend: string;
  balanceSynced: string;
  showBalance: string;
  hideBalance: string;
  refreshBalance: string;
  miniStatement: string;
  details: string;
  services: string;
  allServices: string;
  quickTransfer: string;
  recentActivity: string;
  viewAll: string;
  availableBalance: string;
  dailyLimit: string;
  serviceSend: string;
  serviceTransfers: string;
  serviceQr: string;
  serviceAirtime: string;
  serviceBills: string;
  serviceMerchant: string;
  serviceCashout: string;
  serviceLoan: string;
  searchTransactions: string;
  filterAll: string;
  filterIncome: string;
  filterTransfers: string;
  filterBills: string;
  noTransactions: string;
  notifications: string;
  markAllRead: string;
  noNotifications: string;
  accountDetailsTitle: string;
  accountHolder: string;
  accountNumber: string;
  branchName: string;
  interestRate: string;
  copyNumber: string;
  copied: string;
  close: string;
  confirmPayment: string;
  processing: string;
  paymentSuccess: string;
  insufficientBalance: string;
  enterValidAmount: string;
  recipientAccount: string;
  amountEtb: string;
  optionalNote: string;
  securityPin: string;
  selectNetwork: string;
  phoneNumber: string;
  selectBiller: string;
  billReference: string;
  merchantId: string;
  generateToken: string;
  withdrawalTokenReady: string;
  loanEligibility: string;
  repaymentTerm: string;
  disburseLoan: string;
  scanToPay: string;
  myQrCode: string;
  tapQrPreset: string;
  requestAmount: string;
  downloadReceipt: string;
  repeatTransfer: string;
  referenceId: string;
  transactionFee: string;
  totalDebited: string;
  statusLabel: string;
  completed: string;
  languageTitle: string;
  securitySection: string;
  hideBalanceSetting: string;
  biometricSetting: string;
  smsAlertsSetting: string;
  dailyLimitSetting: string;
  resetDemo: string;
  demoResetDone: string;
  monthsLabel: string;
  interestLabel: string;
  monthlyPayment: string;
  activeLoanLimit: string;
}

export const translations: Record<Language, TranslationStrings> = {
  en: {
    brandName: 'CBE Bank',
    navHome: 'Home',
    navHistory: 'History',
    navQr: 'QR Pay',
    navSettings: 'Settings',
    quickSend: 'Send Money',
    balanceSynced: 'Balance synced',
    showBalance: 'Show balance',
    hideBalance: 'Hide balance',
    refreshBalance: 'Refresh balance',
    miniStatement: 'Mini Statement',
    details: 'Details',
    services: 'Services',
    allServices: '8 Core Services',
    quickTransfer: 'Quick Contacts',
    recentActivity: 'Recent Activity',
    viewAll: 'View All',
    availableBalance: 'Available Balance',
    dailyLimit: 'Daily Limit',
    serviceSend: 'Send Money',
    serviceTransfers: 'Other Transfers',
    serviceQr: 'Scan QR',
    serviceAirtime: 'Airtime',
    serviceBills: 'Bills & Tax',
    serviceMerchant: 'Merchant Pay',
    serviceCashout: 'Cash Out',
    serviceLoan: 'Fast Loan',
    searchTransactions: 'Search merchant, recipient, or reference...',
    filterAll: 'All',
    filterIncome: 'Income',
    filterTransfers: 'Transfers',
    filterBills: 'Bills & Airtime',
    noTransactions: 'No matching transactions found.',
    notifications: 'Notifications',
    markAllRead: 'Mark all read',
    noNotifications: 'All caught up. No new alerts.',
    accountDetailsTitle: 'Account Details',
    accountHolder: 'Account Holder',
    accountNumber: 'Account Number',
    branchName: 'Home Branch',
    interestRate: 'Annual Interest',
    copyNumber: 'Copy Number',
    copied: 'Copied',
    close: 'Close',
    confirmPayment: 'Confirm & Submit',
    processing: 'Processing...',
    paymentSuccess: 'Transaction completed',
    insufficientBalance: 'Amount exceeds your available balance.',
    enterValidAmount: 'Enter a valid amount greater than 0 ETB.',
    recipientAccount: 'Recipient Account or Phone',
    amountEtb: 'Amount (ETB)',
    optionalNote: 'Payment Note (Optional)',
    securityPin: '4-Digit Mobile PIN',
    selectNetwork: 'Destination Bank / Wallet',
    phoneNumber: 'Mobile Number',
    selectBiller: 'Select Biller / Utility',
    billReference: 'Bill / Meter Reference',
    merchantId: 'Merchant Till ID',
    generateToken: 'Generate Cash-Out Code',
    withdrawalTokenReady: 'Active ATM / Agent Code',
    loanEligibility: 'Instant Micro-Loan',
    repaymentTerm: 'Repayment Period',
    disburseLoan: 'Disburse to Account',
    scanToPay: 'Scan to Pay',
    myQrCode: 'My QR Code',
    tapQrPreset: 'Tap a sample merchant QR payload below to simulate scanning:',
    requestAmount: 'Request Specific Amount (Optional)',
    downloadReceipt: 'Print / Save Receipt',
    repeatTransfer: 'Repeat Transaction',
    referenceId: 'Reference ID',
    transactionFee: 'Service Fee',
    totalDebited: 'Total',
    statusLabel: 'Status',
    completed: 'Completed',
    languageTitle: 'Language Preference',
    securitySection: 'Security & Privacy',
    hideBalanceSetting: 'Mask balance on launch',
    biometricSetting: 'Biometric confirmation',
    smsAlertsSetting: 'SMS & in-app debit alerts',
    dailyLimitSetting: 'Daily transfer limit',
    resetDemo: 'Restore Initial Demo Balance',
    demoResetDone: 'Demo account restored to 24,850.75 ETB',
    monthsLabel: 'Months',
    interestLabel: 'Service Charge (4.5%)',
    monthlyPayment: 'Est. Monthly',
    activeLoanLimit: 'Pre-approved up to 15,000.00 ETB',
  },
  am: {
    brandName: 'ሲቢኢ ባንክ',
    navHome: 'መነሻ',
    navHistory: 'ታሪክ',
    navQr: 'QR ክፍያ',
    navSettings: 'ቅንብሮች',
    quickSend: 'ገንዘብ ላክ',
    balanceSynced: 'ቀሪ ሂሳብ ታድሷል',
    showBalance: 'ቀሪ ሂሳብ አሳይ',
    hideBalance: 'ቀሪ ሂሳብ ደብቅ',
    refreshBalance: 'ቀሪ ሂሳብ አድስ',
    miniStatement: 'አጭር መግለጫ',
    details: 'ዝርዝር',
    services: 'አገልግሎቶች',
    allServices: '8 ዋና አገልግሎቶች',
    quickTransfer: 'ፈጣን ተቀባዮች',
    recentActivity: 'የቅርብ ጊዜ እንቅስቃሴ',
    viewAll: 'ሁሉንም ይመልከቱ',
    availableBalance: 'ያለዎት ቀሪ ሂሳብ',
    dailyLimit: 'የዕለት ገደብ',
    serviceSend: 'ገንዘብ ላክ',
    serviceTransfers: 'ሌሎች ዝውውሮች',
    serviceQr: 'QR ስካን',
    serviceAirtime: 'የአየር ሰዓት',
    serviceBills: 'ቢል እና ግብር',
    serviceMerchant: 'ለነጋዴ ክፈል',
    serviceCashout: 'ጥሬ ገንዘብ',
    serviceLoan: 'ፈጣን ብድር',
    searchTransactions: 'ነጋዴ፣ ተቀባይ ወይም መለያ ቁጥር ይፈልጉ...',
    filterAll: 'ሁሉም',
    filterIncome: 'ገቢ',
    filterTransfers: 'ዝውውር',
    filterBills: 'ቢል እና አየር ሰዓት',
    noTransactions: 'ተመሳሳይ ግብይት አልተገኘም።',
    notifications: 'ማሳወቂያዎች',
    markAllRead: 'ሁሉንም አንብቧል',
    noNotifications: 'አዲስ ማሳወቂያ የለም።',
    accountDetailsTitle: 'የሂሳብ ዝርዝር',
    accountHolder: 'የሂሳብ ባለቤት',
    accountNumber: 'የሂሳብ ቁጥር',
    branchName: 'ቅርንጫፍ',
    interestRate: 'ዓመታዊ ወለድ',
    copyNumber: 'ቁጥር ቅዳ',
    copied: 'ተቀድቷል',
    close: 'ዝጋ',
    confirmPayment: 'አረጋግጥ እና ላክ',
    processing: 'በሂደት ላይ...',
    paymentSuccess: 'ግብይቱ በተሳካ ሁኔታ ተጠናቋል',
    insufficientBalance: 'መጠኑ ካለዎት ቀሪ ሂሳብ ይበልጣል።',
    enterValidAmount: 'ከ0 ብር በላይ ትክክለኛ መጠን ያስገቡ።',
    recipientAccount: 'የተቀባይ ሂሳብ ወይም ስልክ',
    amountEtb: 'መጠን (ብር)',
    optionalNote: 'ማስታወሻ (አማራጭ)',
    securityPin: 'ባለ 4-አሃዝ ሚስጥር ቁጥር',
    selectNetwork: 'ባንክ ወይም ዋሌት ይምረጡ',
    phoneNumber: 'ስልክ ቁጥር',
    selectBiller: 'አገልግሎት ሰጪ ይምረጡ',
    billReference: 'የቢል / ቆጣሪ ቁጥር',
    merchantId: 'የነጋዴ መለያ ቁጥር',
    generateToken: 'የጥሬ ገንዘብ ኮድ ፍጠር',
    withdrawalTokenReady: 'ንቁ የኤቲኤም / ኤጀንት ኮድ',
    loanEligibility: 'ፈጣን አነስተኛ ብድር',
    repaymentTerm: 'የመክፈያ ጊዜ',
    disburseLoan: 'ወደ ሂሳብ አስገባ',
    scanToPay: 'ስካን አድርገው ይክፈሉ',
    myQrCode: 'የእኔ QR ኮድ',
    tapQrPreset: 'ስካን ለማስመሰል ከታች ያለውን የነጋዴ QR ይንኩ:',
    requestAmount: 'የሚጠየቅ መጠን (አማራጭ)',
    downloadReceipt: 'ደረሰኝ አትም / አስቀምጥ',
    repeatTransfer: 'ግብይቱን ድገም',
    referenceId: 'የማጣቀሻ ቁጥር',
    transactionFee: 'የአገልግሎት ክፍያ',
    totalDebited: 'ጠቅላላ',
    statusLabel: 'ሁኔታ',
    completed: 'ተጠናቋል',
    languageTitle: 'የቋንቋ ምርጫ',
    securitySection: 'ደህንነት እና ግላዊነት',
    hideBalanceSetting: 'መጀመሪያ ላይ ቀሪ ሂሳብ ደብቅ',
    biometricSetting: 'የጣት አሻራ ማረጋገጫ',
    smsAlertsSetting: 'የኤስኤምኤስ ማሳወቂያዎች',
    dailyLimitSetting: 'የዕለት ዝውውር ገደብ',
    resetDemo: 'የመጀመሪያ ቀሪ ሂሳብ መልስ',
    demoResetDone: 'ሂሳቡ ወደ 24,850.75 ብር ተመልሷል',
    monthsLabel: 'ወራት',
    interestLabel: 'የአገልግሎት ክፍያ (4.5%)',
    monthlyPayment: 'ወርሃዊ ክፍያ',
    activeLoanLimit: 'እስከ 15,000.00 ብር የተፈቀደ',
  },
};
