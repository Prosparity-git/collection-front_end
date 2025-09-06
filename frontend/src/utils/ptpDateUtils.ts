import { format, isToday, isTomorrow, isBefore, isAfter, startOfDay } from 'date-fns';

export type PtpDateCategory = 'overdue' | 'today' | 'tomorrow' | 'future' | 'no_date';

export const categorizePtpDate = (ptpDateStr?: string | null): PtpDateCategory => {
  if (!ptpDateStr) return 'no_date';
  
  // Handle special status values
  if (typeof ptpDateStr === 'string' && (ptpDateStr.toLowerCase() === 'cleared' || ptpDateStr === 'Cleared')) {
    return 'no_date';
  }
  
  try {
    const ptpDate = new Date(ptpDateStr);
    
    // Check if date is valid
    if (isNaN(ptpDate.getTime())) {
      return 'no_date';
    }
    
    const today = startOfDay(new Date());
    
    if (isToday(ptpDate)) return 'today';
    if (isTomorrow(ptpDate)) return 'tomorrow';
    if (isBefore(ptpDate, today)) return 'overdue';
    if (isAfter(ptpDate, today)) return 'future';
    return 'no_date';
  } catch (error) {
    console.error('Error categorizing PTP date:', error);
    return 'no_date';
  }
};

export const getPtpDateCategoryLabel = (category: PtpDateCategory): string => {
  const labels = {
    'overdue': 'Overdue PTP',
    'today': "Today's PTP",
    'tomorrow': "Tomorrow's PTP", 
    'future': 'Future PTP',
    'no_date': 'No PTP'
  };
  return labels[category];
};

export const getPtpDateCategoryColor = (category: PtpDateCategory): string => {
  const colors = {
    'overdue': 'text-red-600',
    'today': 'text-blue-600',
    'tomorrow': 'text-orange-600',
    'future': 'text-green-600',
    'no_date': 'text-gray-500'
  };
  return colors[category];
};

export const getAllPtpDateCategories = (): PtpDateCategory[] => {
  return ['overdue', 'today', 'tomorrow', 'future', 'no_date'];
};

export const formatPtpDateForDisplay = (ptpDateStr?: string | null): string => {
  if (!ptpDateStr) return 'Not Set';
  
  // Handle special status values
  if (typeof ptpDateStr === 'string' && (ptpDateStr.toLowerCase() === 'cleared' || ptpDateStr === 'Cleared')) {
    return 'Not Set';
  }
  
  try {
    const ptpDate = new Date(ptpDateStr);
    if (isNaN(ptpDate.getTime())) {
      return 'Not Set';
    }
    
    return format(ptpDate, 'MMM dd, yyyy');
  } catch (error) {
    console.error('Error formatting PTP date:', error);
    return 'Not Set';
  }
};

export const resolvePTPDateFilter = (filterValues: string[]): { startDate?: string; endDate?: string; includeNoDate: boolean } => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  let startDate: string | undefined;
  let endDate: string | undefined;
  let includeNoDate = false;
  
  // Convert display labels to categories
  const labelToCategoryMap: { [key: string]: PtpDateCategory } = {
    "Overdue PTP": 'overdue',
    "Today's PTP": 'today',
    "Tomorrow's PTP": 'tomorrow',
    "Future PTP": 'future',
    "No PTP": 'no_date'
  };
  
  const categories = filterValues.map(value => labelToCategoryMap[value] || value);
  
  if (categories.includes('no_date')) {
    includeNoDate = true;
  }
  
  if (categories.includes('today')) {
    const todayStr = today.toISOString().split('T')[0];
    if (!startDate || todayStr < startDate) startDate = todayStr;
    if (!endDate || todayStr > endDate) endDate = todayStr;
  }
  
  if (categories.includes('tomorrow')) {
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    if (!startDate || tomorrowStr < startDate) startDate = tomorrowStr;
    if (!endDate || tomorrowStr > endDate) endDate = tomorrowStr;
  }
  
  if (categories.includes('overdue')) {
    // For overdue, we want all dates before today
    if (!startDate) startDate = '1900-01-01'; // Far past date
    const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    if (!endDate || yesterdayStr > endDate) endDate = yesterdayStr;
  }
  
  if (categories.includes('future')) {
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];
    if (!startDate || dayAfterTomorrowStr < startDate) startDate = dayAfterTomorrowStr;
    // For future, we want all dates after tomorrow
    if (!endDate) endDate = '2099-12-31'; // Far future date
  }
  
  return { startDate, endDate, includeNoDate };
};
