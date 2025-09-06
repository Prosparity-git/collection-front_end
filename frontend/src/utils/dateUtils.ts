
// Simplified utility functions for handling standardized DATE columns

export const normalizeEmiMonth = (emiMonth: string | Date): string => {
  if (!emiMonth) return '';
  
  // If it's already a Date object, format it
  if (emiMonth instanceof Date) {
    return emiMonth.toISOString().split('T')[0].substring(0, 7); // YYYY-MM format
  }
  
  // If it's a string in YYYY-MM format, return as is
  if (typeof emiMonth === 'string' && emiMonth.match(/^\d{4}-\d{2}$/)) {
    return emiMonth;
  }
  
  // If it's a date string, extract YYYY-MM
  if (typeof emiMonth === 'string' && emiMonth.match(/^\d{4}-\d{2}-\d{2}/)) {
    return emiMonth.substring(0, 7);
  }
  
  return emiMonth.toString();
};

// Convert EMI month display format (Jul-25) to database format (2025-07)
export const convertEmiMonthToDatabase = (emiMonth: string): string => {
  if (!emiMonth) {
    console.warn('Empty emiMonth provided to convertEmiMonthToDatabase');
    return '';
  }
  
  // If already in YYYY-MM format, return as is
  if (emiMonth.match(/^\d{4}-\d{2}$/)) {
    return emiMonth;
  }
  
  // Handle MMM-yy format (Jul-25)
  if (emiMonth.match(/^[A-Za-z]{3}-\d{2}$/)) {
    const [monthStr, yearStr] = emiMonth.split('-');
    
    if (!monthStr || !yearStr) {
      console.warn('Invalid emiMonth format:', emiMonth);
      return emiMonth;
    }
    
    // Convert short year to full year (25 -> 2025)
    const yearNum = parseInt(yearStr);
    if (isNaN(yearNum)) {
      console.warn('Invalid year in emiMonth:', yearStr);
      return emiMonth;
    }
    
    const fullYear = yearNum < 50 ? `20${yearStr}` : `19${yearStr}`;
    
    // Convert month name to number
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthStr.toLowerCase());
    
    if (monthIndex === -1) {
      console.warn('Invalid month name:', monthStr);
      return emiMonth;
    }
    
    const monthNumber = (monthIndex + 1).toString().padStart(2, '0');
    const result = `${fullYear}-${monthNumber}`;
    console.log('Converted EMI month:', emiMonth, '->', result);
    return result;
  }
  
  console.warn('Unrecognized emiMonth format:', emiMonth);
  return emiMonth;
};

// Convert YYYY-MM to the 5th day of that month (EMI date)
export const monthToEmiDate = (yearMonth: string): string => {
  if (!yearMonth || !yearMonth.match(/^\d{4}-\d{2}$/)) {
    return yearMonth;
  }
  return `${yearMonth}-05`;
};

// Get the first and last day of a month for date range queries
export const getMonthDateRange = (yearMonth: string): { start: string; end: string } => {
  if (!yearMonth || !yearMonth.match(/^\d{4}-\d{2}$/)) {
    console.warn('Invalid yearMonth format for getMonthDateRange:', yearMonth);
    return { start: yearMonth, end: yearMonth };
  }
  
  try {
    const [year, month] = yearMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month
    
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    
    console.log('Month date range for', yearMonth, ':', { start, end });
    return { start, end };
  } catch (error) {
    console.error('Error calculating month date range for:', yearMonth, error);
    return { start: yearMonth, end: yearMonth };
  }
};

// Group database dates by normalized month
export const groupDatesByMonth = (dates: string[]): Record<string, string[]> => {
  const groups: Record<string, string[]> = {};
  
  dates.forEach(date => {
    const normalized = normalizeEmiMonth(date);
    if (!groups[normalized]) {
      groups[normalized] = [];
    }
    groups[normalized].push(date);
  });
  
  return groups;
};
