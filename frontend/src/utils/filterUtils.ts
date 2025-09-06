
import type { LastMonthBounceCategory } from "@/types/filters";
import type { PtpDateCategory } from "@/utils/ptpDateUtils";

// Calculate total active filters with proper typing
export const calculateActiveFilterCount = (filters: Record<string, unknown>): number => {
  return Object.values(filters).reduce<number>((total: number, filterArray: unknown): number => {
    if (Array.isArray(filterArray)) {
      return total + filterArray.length;
    }
    return total;
  }, 0);
};

// Format repayment values for display
export const formatRepayment = (repayment: string | null | undefined): string => {
  if (!repayment) return 'Unknown';
  return repayment;
};

// Categorize last month bounce based on numeric value
export const categorizeLastMonthBounce = (bounce: number | null | undefined): LastMonthBounceCategory => {
  if (bounce === null || bounce === undefined || bounce === 0) {
    return 'Not paid';
  }
  
  if (bounce <= 0) {
    return 'Paid on time';
  } else if (bounce <= 5) {
    return '1-5 days late';
  } else if (bounce <= 15) {
    return '6-15 days late';
  } else {
    return '15+ days late';
  }
};

// Type guard for LastMonthBounceCategory
export const isValidLastMonthBounceCategory = (value: string): value is LastMonthBounceCategory => {
  const validCategories: LastMonthBounceCategory[] = [
    'Not paid',
    'Paid on time',
    '1-5 days late',
    '6-15 days late',
    '15+ days late'
  ];
  return validCategories.includes(value as LastMonthBounceCategory);
};

// Type guard for PtpDateCategory
export const isValidPtpDateCategory = (value: string): value is PtpDateCategory => {
  const validCategories: PtpDateCategory[] = [
    'overdue',
    'today',
    'tomorrow',
    'future',
    'no_date'
  ];
  return validCategories.includes(value as PtpDateCategory);
};
