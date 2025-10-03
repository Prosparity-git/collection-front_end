
import { format } from "date-fns";

export const formatEmiMonth = (dateStr?: string) => {
  if (!dateStr) return '';
  // If already in 'Mon-YY' format, return as is
  if (/^[A-Za-z]{3}-\d{2}$/.test(dateStr)) return dateStr;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${month}-${year}`;
  } catch {
    return dateStr;
  }
};

export const formatPhoneLink = (phone?: string) => {
  if (!phone) return null;
  // Remove any non-digit characters except +
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  return `tel:${cleanPhone}`;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Optimized PTP date formatter with consistent output
export const formatPtpDate = (ptpDateStr?: string | null) => {
  if (!ptpDateStr) return "Not Set";
  // If already in DD-MMM-YY format, return as is
  if (/^\d{2}-[A-Za-z]{3}-\d{2}$/.test(ptpDateStr)) return ptpDateStr;
  try {
    // Try parsing as YY-MM-DD
    if (/^\d{2}-\d{2}-\d{2}$/.test(ptpDateStr)) {
      const [yy, mm, dd] = ptpDateStr.split('-');
      const date = new Date(`20${yy}-${mm}-${dd}`);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
      }
    }
    // Fallback: try Date constructor
    const date = new Date(ptpDateStr);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');
    }
    return ptpDateStr;
  } catch {
    return ptpDateStr;
  }
};

export const formatMapLocation = (fiLocation?: string) => {
  if (!fiLocation) return null;
  
  // Remove "FI_PENDING " prefix if it exists
  const cleanLocation = fiLocation.replace(/^FI_PENDING\s+/i, '').trim();
  
  if (!cleanLocation) return null;
  
  // Create Google Maps URL
  const encodedLocation = encodeURIComponent(cleanLocation);
  return `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
};

export const getCurrentEmiMonth = (): string => {
  // Compute current month in Indian Standard Time
  const month = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    timeZone: 'Asia/Kolkata'
  }).format(new Date());

  const yearFull = new Intl.DateTimeFormat('en-US', {
    year: '2-digit',
    timeZone: 'Asia/Kolkata'
  }).format(new Date());

  return `${month}-${yearFull}`;
};

// Function to get the next month in Mon-YY format
export const getNextMonth = (currentMonth: string): string => {
  try {
    // Parse current month (e.g., "Aug-25")
    const [monthStr, yearStr] = currentMonth.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = monthNames.indexOf(monthStr);
    
    if (currentMonthIndex === -1) return currentMonth;
    
    let nextMonthIndex = currentMonthIndex + 1;
    let nextYear = parseInt(yearStr);
    
    if (nextMonthIndex >= 12) {
      nextMonthIndex = 0;
      nextYear += 1;
    }
    
    const nextMonth = monthNames[nextMonthIndex];
    const nextYearStr = nextYear.toString().slice(-2);
    
    return `${nextMonth}-${nextYearStr}`;
  } catch {
    return currentMonth;
  }
};

// Function to get the previous month in Mon-YY format
export const getPreviousMonth = (currentMonth: string): string => {
  try {
    // Parse current month (e.g., "Aug-25")
    const [monthStr, yearStr] = currentMonth.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = monthNames.indexOf(monthStr);
    
    if (currentMonthIndex === -1) return currentMonth;
    
    let prevMonthIndex = currentMonthIndex - 1;
    let prevYear = parseInt(yearStr);
    
    if (prevMonthIndex < 0) {
      prevMonthIndex = 11;
      prevYear -= 1;
    }
    
    const prevMonth = monthNames[prevMonthIndex];
    const prevYearStr = prevYear.toString().slice(-2);
    
    return `${prevMonth}-${prevYearStr}`;
  } catch {
    return currentMonth;
  }
};

// Function to generate month options from Jan-25 to current month
export const generateMonthOptions = (): string[] => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = getCurrentEmiMonth();
  // Ensure we include one month ahead of the current month (e.g., show Oct-25 when current is Sep-25)
  const endMonth = getNextMonth(currentMonth);
  const [currentMonthStr, currentYearStr] = currentMonth.split('-');
  const currentYear = parseInt(currentYearStr);
  
  const options: string[] = [];
  
  // Start from Jan-25
  let year = 25;
  let monthIndex = 0; // January
  
  while (true) {
    const month = monthNames[monthIndex];
    const monthOption = `${month}-${year.toString().padStart(2, '0')}`;
    
    options.push(monthOption);
    
    // Check if we've reached the end month (next month after current)
    if (monthOption === endMonth) {
      break;
    }
    
    // Move to next month
    monthIndex++;
    if (monthIndex >= 12) {
      monthIndex = 0;
      year++;
    }
    
    // Safety check to prevent infinite loop
    if (year > currentYear + 1) {
      break;
    }
  }
  
  return options;
};
