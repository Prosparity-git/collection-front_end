import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMonthDropdown } from '@/hooks/useMonthDropdown';
import { cn } from '@/lib/utils';

interface MonthSelectorProps {
  availableMonths: string[];
  availableMonthsFormatted?: string[];
  selectedMonth: string;
  onMonthChange: (month: string, application?: any) => void;
  loading?: boolean;
  loanId?: number; // Add loanId prop for month dropdown API
  currentApplicationPaymentId?: number; // Add current application's payment ID
}

const MonthSelector = ({ 
  availableMonths, 
  availableMonthsFormatted,
  selectedMonth, 
  onMonthChange, 
  loading = false,
  loanId,
  currentApplicationPaymentId
}: MonthSelectorProps) => {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // Use the month dropdown hook when there are no available months
  const { 
    months: dropdownMonths, 
    selectedMonth: dropdownSelectedMonth, 
    handleMonthChange: handleDropdownMonthChange,
    loading: dropdownLoading,
    error: dropdownError,
    currentApplication
  } = useMonthDropdown(availableMonths.length === 0 ? loanId : undefined, currentApplicationPaymentId);

  // Use formatted months for display if available, otherwise use raw months
  const displayMonths = availableMonthsFormatted || availableMonths;

  // Update current month index when selectedMonth or availableMonths change
  useEffect(() => {
    console.log('MonthSelector: Updating current month index');
    console.log('Available months:', availableMonths);
    console.log('Selected month:', selectedMonth);
    
    const index = availableMonths.findIndex(month => month === selectedMonth);
    console.log('Found index:', index);
    
    if (index >= 0) {
      setCurrentMonthIndex(index);
    } else if (availableMonths.length > 0) {
      // If selectedMonth is not found, default to the last month
      const defaultIndex = availableMonths.length - 1;
      console.log('Setting default index:', defaultIndex);
      setCurrentMonthIndex(defaultIndex);
      onMonthChange(availableMonths[defaultIndex]);
    }
  }, [selectedMonth, availableMonths, onMonthChange]);

  const handlePreviousMonth = async () => {
    if (currentMonthIndex > 0 && !isNavigating) {
      setIsNavigating(true);
      const newIndex = currentMonthIndex - 1;
      console.log('Previous month: index', newIndex, 'month', availableMonths[newIndex]);
      setCurrentMonthIndex(newIndex);
      await onMonthChange(availableMonths[newIndex]);
      setIsNavigating(false);
    }
  };

  const handleNextMonth = async () => {
    if (currentMonthIndex < availableMonths.length - 1 && !isNavigating) {
      setIsNavigating(true);
      const newIndex = currentMonthIndex + 1;
      console.log('Next month: index', newIndex, 'month', availableMonths[newIndex]);
      setCurrentMonthIndex(newIndex);
      await onMonthChange(availableMonths[newIndex]);
      setIsNavigating(false);
    }
  };

  const handleSelectChange = async (value: string) => {
    console.log('Select change: value', value);
    // Find the index of the formatted value in displayMonths
    const displayIndex = displayMonths.findIndex(month => month === value);
    console.log('Display index:', displayIndex);
    
    if (displayIndex >= 0) {
      // Use the corresponding raw month value
      const rawMonth = availableMonths[displayIndex];
      console.log('Setting raw month:', rawMonth);
      setCurrentMonthIndex(displayIndex);
      await onMonthChange(rawMonth);
    }
  };

  // Handle dropdown month change
  const handleDropdownMonthChangeWrapper = async (month: string) => {
    console.log('MonthSelector: Month changed to:', month);
    const result = await handleDropdownMonthChange(month);
    // Call the parent's onMonthChange with the new month and application data
    await onMonthChange(month, result);
  };

  // Keyboard navigation support
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft' && currentMonthIndex > 0) {
      event.preventDefault();
      handlePreviousMonth();
    } else if (event.key === 'ArrowRight' && currentMonthIndex < availableMonths.length - 1) {
      event.preventDefault();
      handleNextMonth();
    }
  };

  if (availableMonths.length === 0) {
    // Show month dropdown when no available months
    return (
      <div 
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100 space-y-3 sm:space-y-0"
        role="region"
        aria-label="Demand month selector"
      >
        {/* Left side: Calendar icon and "Demand Month:" label */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-sm font-semibold text-gray-700">Demand Month:</span>
        </div>
        
        {/* Center: Month dropdown */}
        <div className="flex items-center space-x-3 w-full sm:w-auto justify-center">
          {dropdownLoading ? (
            <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-500">Loading months...</span>
            </div>
          ) : dropdownError ? (
            <div className="flex items-center space-x-2 px-4 py-2 bg-red-50 rounded-lg border border-red-200 shadow-sm">
              <span className="text-sm text-red-500">Error: {dropdownError}</span>
            </div>
          ) : dropdownMonths.length > 0 ? (
            <Select
              value={dropdownSelectedMonth || dropdownMonths[0]?.month || ''}
              onValueChange={handleDropdownMonthChangeWrapper}
              disabled={dropdownLoading}
            >
              <SelectTrigger className="w-28 sm:w-36 h-8 sm:h-9 rounded-lg border-gray-300 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200">
                <SelectValue placeholder="Select month" className="text-sm font-semibold text-gray-900" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-xl max-h-60">
                {dropdownMonths.map((monthOption) => (
                  <SelectItem 
                    key={monthOption.month} 
                    value={monthOption.month}
                    className="text-sm hover:bg-blue-50 focus:bg-blue-50 cursor-pointer data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-900"
                  >
                    {monthOption.month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
              <span className="text-sm text-gray-500">No months available</span>
            </div>
          )}
        </div>
        
        {/* Right side: Empty space to maintain layout consistency */}
        <div className="w-full sm:w-20"></div>
      </div>
    );
  }

  // Get the formatted value for the currently selected month
  const selectedMonthDisplay = displayMonths[currentMonthIndex] || selectedMonth;

  console.log('MonthSelector render:', {
    availableMonths,
    selectedMonth,
    currentMonthIndex,
    selectedMonthDisplay,
    displayMonths
  });

  return (
    <div 
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border-b bg-gradient-to-r from-gray-50 to-gray-100 space-y-3 sm:space-y-0"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Month selector"
    >
      {/* Left side: Calendar icon and "Month:" label */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <Calendar className="h-5 w-5 text-blue-600" />
        </div>
        <span className="text-sm font-semibold text-gray-700">Month:</span>
      </div>
      
      {/* Center: Month selector with navigation arrows and dropdown */}
      <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-center">
        {/* Previous month button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousMonth}
          disabled={currentMonthIndex === 0 || loading || isNavigating}
          className={cn(
            "h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-lg border-gray-300 hover:bg-white hover:border-blue-400 hover:shadow-md transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          )}
          aria-label="Previous month"
        >
          {isNavigating ? (
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 animate-spin" />
          ) : (
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
          )}
        </Button>
        
        {/* Month dropdown field */}
        <Select
          value={selectedMonthDisplay}
          onValueChange={handleSelectChange}
          disabled={loading || isNavigating}
        >
          <SelectTrigger className="w-28 sm:w-36 h-8 sm:h-9 rounded-lg border-gray-300 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200">
            <SelectValue className="text-sm font-semibold text-gray-900">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span className="hidden sm:inline">Loading...</span>
                </div>
              ) : (
                selectedMonthDisplay
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 rounded-lg shadow-xl max-h-60">
            {displayMonths.map((month, index) => (
              <SelectItem 
                key={month} 
                value={month}
                className="text-sm hover:bg-blue-50 focus:bg-blue-50 cursor-pointer data-[state=checked]:bg-blue-100 data-[state=checked]:text-blue-900"
              >
                {month}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Next month button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNextMonth}
          disabled={currentMonthIndex === availableMonths.length - 1 || loading || isNavigating}
          className={cn(
            "h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-lg border-gray-300 hover:bg-white hover:border-blue-400 hover:shadow-md transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          )}
          aria-label="Next month"
        >
          {isNavigating ? (
            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 animate-spin" />
          ) : (
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
          )}
        </Button>
      </div>
      
      {/* Right side: Page indicator */}
      <div className="flex items-center space-x-2 w-full sm:w-auto justify-center sm:justify-end">
        <div className="px-3 py-1 bg-white rounded-lg border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-600">
            {currentMonthIndex + 1} of {availableMonths.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MonthSelector; 