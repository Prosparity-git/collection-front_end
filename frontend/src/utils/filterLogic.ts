import { formatEmiMonth } from "@/utils/formatters";
import { categorizePtpDate, type PtpDateCategory, getPtpDateCategoryLabel } from "@/utils/ptpDateUtils";
import { formatRepayment, categorizeLastMonthBounce, isValidLastMonthBounceCategory, isValidPtpDateCategory } from "@/utils/filterUtils";
import type { FilterState, LastMonthBounceCategory, AvailableOptions } from "@/types/filters";
import { VEHICLE_STATUS_OPTIONS } from "@/constants/options";

// Get available filter options based on all applications and current filtered results
export const getAvailableOptions = (allApplications: any[], filteredApplications: any[], selectedEmiMonth?: string | null): AvailableOptions => {
  console.log('=== GETTING AVAILABLE OPTIONS ===');
  console.log('All applications:', allApplications.length);
  console.log('Filtered applications:', filteredApplications.length);
  console.log('Selected EMI Month:', selectedEmiMonth);

  // If a specific EMI month is selected, use only applications from that month for options
  // Otherwise, use all applications for generating options
  let appsForOptions = allApplications;
  
  if (selectedEmiMonth) {
    // Filter applications to only those from the selected EMI month
    appsForOptions = allApplications.filter(app => formatEmiMonth(app.demand_date) === selectedEmiMonth);
    console.log('Apps for selected month:', appsForOptions.length);
  }

  const branches = [...new Set(appsForOptions.map(app => app.branch_name).filter(Boolean))].sort();
  const teamLeads = [...new Set(appsForOptions.map(app => app.team_lead).filter(Boolean))].sort();
  const rms = [...new Set(appsForOptions.map(app => app.rm_name).filter(Boolean))].sort();
  const dealers = [...new Set(appsForOptions.map(app => app.dealer_name).filter(Boolean))].sort();
  const lenders = [...new Set(appsForOptions.map(app => app.lender_name).filter(Boolean))].sort();
  const statuses = [...new Set(appsForOptions.map(app => app.field_status || 'Unpaid').filter(Boolean))].sort();
  const emiMonthsSet = new Set(allApplications.map(app => formatEmiMonth(app.demand_date)).filter(Boolean));
  const emiMonths = Array.from(emiMonthsSet).sort((a, b) => {
    // Parse as date for correct sorting
    const parse = (str: string) => {
      // str is like 'Jan-24', 'Jul-25', etc.
      const [mon, yr] = str.split('-');
      const monthNum = [
        'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'
      ].indexOf(mon);
      const yearNum = parseInt(yr.length === 2 ? '20' + yr : yr, 10);
      return new Date(yearNum, monthNum, 1);
    };
    const dateA = parse(a);
    const dateB = parse(b);
    return dateA.getTime() - dateB.getTime();
  });
  const repayments = [...new Set(appsForOptions.map(app => formatRepayment(app.repayment)).filter(Boolean))].sort();

  const lastMonthBounce: LastMonthBounceCategory[] = [
    'Not paid',
    'Paid on time', 
    '1-5 days late',
    '6-15 days late',
    '15+ days late'
  ];

  const ptpDateOptions = [
    "Overdue PTP",
    "Today's PTP",
    "Tomorrow's PTP",
    "Future PTP",
    "No PTP"
  ];

  const vehicleStatusOptions = VEHICLE_STATUS_OPTIONS.map(opt => opt.value);

  return {
    branches,
    teamLeads,
    rms,
    dealers,
    lenders,
    statuses,
    emiMonths,
    repayments,
    lastMonthBounce,
    ptpDateOptions,
    vehicleStatusOptions
  };
};

// Filter applications based on current filter state
export const filterApplications = (applications: any[], filters: FilterState) => {
  console.log('=== FILTERING APPLICATIONS ===');
  console.log('Total applications:', applications.length);
  console.log('Active filters:', filters);
  
  const result = applications.filter(app => {
    const repaymentMatch = filters.repayment.length === 0 || 
      filters.repayment.includes(formatRepayment(app.repayment));
    
    const appLastMonthBounceCategory = categorizeLastMonthBounce(app.last_month_bounce);
    const lastMonthBounceMatch = filters.lastMonthBounce.length === 0 || 
      filters.lastMonthBounce.includes(appLastMonthBounceCategory);

    const emiMonthMatch = filters.emiMonth.length === 0 || 
      filters.emiMonth.includes(formatEmiMonth(app.demand_date));

    const statusMatch = filters.status.length === 0 || 
      filters.status.includes(app.field_status || 'Unpaid');

    // Fix PTP date filtering - handle both display labels and category codes
    let ptpDateMatch = true;
    if (filters.ptpDate.length > 0) {
      const appPtpDateCategory = categorizePtpDate(app.ptp_date);
      console.log('App PTP category:', appPtpDateCategory, 'for app:', app.applicant_name);
      console.log('Filter PTP values:', filters.ptpDate);
      
      // Check if any of the selected filter values match the app's PTP category
      ptpDateMatch = filters.ptpDate.some(filterValue => {
        // Direct category match
        if (filterValue === appPtpDateCategory) {
          return true;
        }
        
        // Convert display label to category and match
        const labelToCategoryMap: { [key: string]: PtpDateCategory } = {
          "Overdue PTP": 'overdue',
          "Today's PTP": 'today',
          "Tomorrow's PTP": 'tomorrow',
          "Future PTP": 'future',
          "No PTP": 'no_date'
        };
        
        const categoryFromLabel = labelToCategoryMap[filterValue];
        return categoryFromLabel === appPtpDateCategory;
      });
    }

    const branchMatch = filters.branch.length === 0 || filters.branch.includes(app.branch_name);
    const teamLeadMatch = filters.teamLead.length === 0 || filters.teamLead.includes(app.team_lead);
    const rmMatch = filters.rm.length === 0 || filters.rm.includes(app.rm_name);
    const dealerMatch = filters.dealer.length === 0 || filters.dealer.includes(app.dealer_name);
    const lenderMatch = filters.lender.length === 0 || filters.lender.includes(app.lender_name);

    const vehicleStatusMatch = filters.vehicleStatus.length === 0 || 
      (filters.vehicleStatus.includes('None') && !app.vehicle_status) ||
      filters.vehicleStatus.includes(app.vehicle_status || '');

    const matches = branchMatch && teamLeadMatch && rmMatch && dealerMatch && 
           lenderMatch && statusMatch && emiMonthMatch && repaymentMatch && 
           lastMonthBounceMatch && ptpDateMatch && vehicleStatusMatch;

    if (!matches && filters.ptpDate.length > 0) {
      console.log('PTP filter mismatch for:', app.applicant_name, 'Category:', categorizePtpDate(app.ptp_date), 'Filter:', filters.ptpDate);
    }

    return matches;
  });
  
  console.log('Filtered applications:', result.length);
  return result;
};

// Handle filter changes with type-safe processing
export const processFilterChange = (
  key: keyof FilterState, 
  values: string[], 
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>
) => {
  console.log('=== FILTER CHANGE ===');
  console.log(`Changing ${key} filter to:`, values);
  
  if (key === 'lastMonthBounce') {
    // Type-safe handling for lastMonthBounce filter
    const validValues = values.filter(isValidLastMonthBounceCategory);
    console.log('Valid lastMonthBounce values:', validValues);
    setFilters(prev => ({ ...prev, [key]: validValues }));
  } else if (key === 'ptpDate') {
    // For PTP date filter, store the display labels directly
    // The filtering logic will handle the conversion
    console.log('PTP Date - Storing display labels:', values);
    setFilters(prev => ({ 
      ...prev, 
      [key]: values as string[] // Store as strings for display labels
    }));
  } else {
    console.log(`Setting ${key} to:`, values);
    setFilters(prev => ({ ...prev, [key]: values }));
  }
};
