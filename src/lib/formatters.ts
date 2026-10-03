import { TransactionStatus, ApprovalStatus, UserStatus, EmployeeStatus, BranchStatus, TransactionType } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('PHP', '₱');
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatDate(isoString?: string): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatTransactionType(type: TransactionType): string {
  const map: Record<TransactionType, string> = {
    REMITTANCE_SEND: 'Domestic Remittance (Send)',
    REMITTANCE_PAYOUT: 'Domestic Remittance (Claim)',
    BILLS_PAYMENT: 'Bills & Utilities Payment',
    FOREIGN_EXCHANGE: 'Foreign Exchange (Forex)',
    PAWN_LOAN: 'Collateralized Pawn Loan',
    INSURANCE_PREMIUM: 'Microinsurance Premium',
    WALLET_CASHOUT: 'E-Wallet Cash In / Out',
  };
  return map[type] || type;
}

export function getTransactionStatusDetails(status: TransactionStatus): {
  label: string;
  textColor: string;
  dotColor: string;
} {
  switch (status) {
    case 'COMPLETED':
      return { label: 'Completed', textColor: 'text-emerald-700 dark:text-emerald-400', dotColor: 'bg-emerald-500' };
    case 'PENDING':
      return { label: 'Pending Approval', textColor: 'text-amber-700 dark:text-amber-400', dotColor: 'bg-amber-500' };
    case 'PROCESSING':
      return { label: 'Processing', textColor: 'text-blue-700 dark:text-blue-400', dotColor: 'bg-blue-500' };
    case 'REJECTED':
      return { label: 'Rejected', textColor: 'text-rose-700 dark:text-rose-400', dotColor: 'bg-rose-500' };
    case 'CANCELLED':
      return { label: 'Cancelled', textColor: 'text-slate-600 dark:text-slate-400', dotColor: 'bg-slate-400' };
    case 'REVERSED':
      return { label: 'Reversed', textColor: 'text-purple-700 dark:text-purple-400', dotColor: 'bg-purple-500' };
    case 'FAILED':
      return { label: 'Failed', textColor: 'text-red-700 dark:text-red-400', dotColor: 'bg-red-500' };
    default:
      return { label: status, textColor: 'text-slate-700', dotColor: 'bg-slate-400' };
  }
}

export function getApprovalStatusDetails(status: ApprovalStatus): {
  label: string;
  textColor: string;
  dotColor: string;
} {
  switch (status) {
    case 'APPROVED':
      return { label: 'Approved', textColor: 'text-emerald-700', dotColor: 'bg-emerald-500' };
    case 'PENDING':
      return { label: 'Pending Review', textColor: 'text-amber-700', dotColor: 'bg-amber-500' };
    case 'REJECTED':
      return { label: 'Rejected', textColor: 'text-rose-700', dotColor: 'bg-rose-500' };
    case 'EXPIRED':
      return { label: 'Expired', textColor: 'text-slate-500', dotColor: 'bg-slate-400' };
  }
}

export function getUserStatusDetails(status: UserStatus): {
  label: string;
  textColor: string;
  dotColor: string;
} {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Active', textColor: 'text-emerald-700', dotColor: 'bg-emerald-500' };
    case 'LOCKED':
      return { label: 'Locked Out', textColor: 'text-red-700', dotColor: 'bg-red-500' };
    case 'DISABLED':
      return { label: 'Disabled', textColor: 'text-slate-500', dotColor: 'bg-slate-400' };
    case 'SUSPENDED':
      return { label: 'Suspended', textColor: 'text-amber-700', dotColor: 'bg-amber-500' };
    case 'INACTIVE':
      return { label: 'Inactive', textColor: 'text-slate-500', dotColor: 'bg-slate-400' };
  }
}
