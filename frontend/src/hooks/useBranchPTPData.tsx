
import { useState, useEffect } from 'react';
import { Application } from '@/types/application';
import { isToday, isTomorrow, isBefore, isAfter, startOfDay } from 'date-fns';
import { useFieldStatusManager } from '@/hooks/useFieldStatusManager';
import { usePtpDates } from '@/hooks/usePtpDates';
import { client } from '@/integrations/api/client';
import { getMonthDateRange, convertEmiMonthToDatabase } from '@/utils/dateUtils';

export interface PTPStatusRow {
  rm_name: string;
  branch_name: string;
  overdue: number;
  today: number;
  tomorrow: number;
  future: number;
  no_ptp_set: number;
  total: number;
}

export interface BranchPTPStatus {
  branch_name: string;
  total_stats: PTPStatusRow;
  rm_stats: PTPStatusRow[];
}

export const useBranchPTPData = (applications: Application[], selectedEmiMonth?: string) => {
  const { fetchFieldStatus } = useFieldStatusManager();
  const { fetchPtpDates } = usePtpDates();
  const [data, setData] = useState<BranchPTPStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPTPData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        console.log('📊 Fetching PTP data for month:', selectedEmiMonth);
        
        let collectionData, error;
        let enrichedApplications: Application[] = [];

        if (!selectedEmiMonth || selectedEmiMonth === 'All') {
          // For "All" option, use all applications directly
          console.log('📊 Using all applications for PTP data (All months)');
          enrichedApplications = applications;
        } else {
          // For specific month, get applications with collection records for that month
          const dbFormatMonth = convertEmiMonthToDatabase(selectedEmiMonth);
          console.log('📊 Converting EMI month format for PTP:', selectedEmiMonth, '->', dbFormatMonth);
          
          if (!dbFormatMonth || !dbFormatMonth.match(/^\d{4}-\d{2}$/)) {
            console.error('Invalid month format after conversion:', dbFormatMonth);
            throw new Error(`Invalid month format: ${selectedEmiMonth}`);
          }
          
          const { start, end } = getMonthDateRange(dbFormatMonth);
          console.log('📊 Date range for PTP data:', { start, end });
          
          const { data, error: monthError } = await client
            .from('collection')
            .select(`
              application_id,
              applications!inner(*)
            `)
            .gte('demand_date', start)
            .lte('demand_date', end);
          collectionData = data;
          error = monthError;

          if (error) {
            console.error('Error fetching collection data for branch PTP analysis:', error);
            throw new Error(`Failed to fetch collection data: ${error.message}`);
          }

          if (!collectionData || collectionData.length === 0) {
            console.log('No collection data found for month:', selectedEmiMonth);
            setData([]);
            return;
          }

          // Extract applications from collection records
          enrichedApplications = collectionData
            .map(record => record.applications)
            .filter(app => app != null) as Application[];
        }

        if (enrichedApplications.length === 0) {
          console.log('No applications found for processing');
          setData([]);
          return;
        }

        console.log(`📊 Processing ${enrichedApplications.length} applications for PTP analysis`);
        
        // Get application IDs
        const applicationIds = enrichedApplications.map(app => app.applicant_id);
        
        // Convert selectedEmiMonth to database format for field status query
        const dbFormatMonth = selectedEmiMonth && selectedEmiMonth !== 'All' ? convertEmiMonthToDatabase(selectedEmiMonth) : undefined;
        
        // Fetch month-specific field status
        const statusMap = await fetchFieldStatus(
          applicationIds, 
          dbFormatMonth,
          selectedEmiMonth === 'All' || !selectedEmiMonth // includeAllMonths = true for "All"
        );
        
        console.log('🔍 Field status map loaded for PTP:', Object.keys(statusMap).length, 'applications');
        
        // Fetch PTP dates for these applications (without demand month filtering for accurate categorization)
        const ptpDatesMap = await fetchPtpDates(applicationIds);
        console.log('📅 PTP dates map loaded:', Object.keys(ptpDatesMap).length, 'applications');

        // Enrich applications with PTP dates and field status to match Analytics filtering expectations
        const enrichedApplicationsWithPTP = enrichedApplications.map(app => ({
          ...app,
          ptp_date: ptpDatesMap[app.applicant_id] || null,
          field_status: statusMap[app.applicant_id] || app.lms_status || 'Unpaid'
        }));

        // Filter applications that are not "Paid" for the selected month
        const unpaidApplications = enrichedApplicationsWithPTP.filter(app => {
          const fieldStatus = app.field_status;
          return fieldStatus !== 'Paid';
        });
        
        console.log('📊 PTP Data - Total applications:', enrichedApplications.length);
        console.log('📊 PTP Data - Unpaid applications (excluding Paid):', unpaidApplications.length);
        
        const branchMap = new Map<string, BranchPTPStatus>();
        const today = startOfDay(new Date());
        
        unpaidApplications.forEach(app => {
          const branchName = app?.branch_name || 'Unknown Branch';
          const rmName = app?.collection_rm || app?.rm_name || 'Unknown RM';
          
          if (!branchMap.has(branchName)) {
            branchMap.set(branchName, {
              branch_name: branchName,
              total_stats: {
                rm_name: branchName,
                branch_name: branchName,
                overdue: 0,
                today: 0,
                tomorrow: 0,
                future: 0,
                no_ptp_set: 0,
                total: 0
              },
              rm_stats: []
            });
          }
          
          const branch = branchMap.get(branchName)!;
          
          let rmStats = branch.rm_stats.find(rm => rm.rm_name === rmName);
          if (!rmStats) {
            rmStats = {
              rm_name: rmName,
              branch_name: branchName,
              overdue: 0,
              today: 0,
              tomorrow: 0,
              future: 0,
              no_ptp_set: 0,
              total: 0
            };
            branch.rm_stats.push(rmStats);
          }
          
          rmStats.total++;
          branch.total_stats.total++;
          
          const ptpDateStr = app.ptp_date;
          if (!ptpDateStr) {
            rmStats.no_ptp_set++;
            branch.total_stats.no_ptp_set++;
          } else {
            try {
              const ptpDate = new Date(ptpDateStr);
              
              if (isToday(ptpDate)) {
                rmStats.today++;
                branch.total_stats.today++;
              } else if (isTomorrow(ptpDate)) {
                rmStats.tomorrow++;
                branch.total_stats.tomorrow++;
              } else if (isBefore(ptpDate, today)) {
                rmStats.overdue++;
                branch.total_stats.overdue++;
              } else if (isAfter(ptpDate, today) && !isTomorrow(ptpDate)) {
                rmStats.future++;
                branch.total_stats.future++;
              } else {
                rmStats.no_ptp_set++;
                branch.total_stats.no_ptp_set++;
              }
            } catch (dateError) {
              console.warn('Invalid PTP date format:', ptpDateStr, 'for application:', app.applicant_id);
              rmStats.no_ptp_set++;
              branch.total_stats.no_ptp_set++;
            }
          }
        });
        
        const result = Array.from(branchMap.values())
          .map(branch => ({
            ...branch,
            rm_stats: branch.rm_stats.sort((a, b) => b.total - a.total)
          }))
          .sort((a, b) => b.total_stats.total - a.total_stats.total);
          
        console.log('📈 PTP data processing complete. Branches:', result.length);
        setData(result);
      } catch (err) {
        console.error('Error in fetchPTPData:', err);
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (applications && applications.length > 0) {
      fetchPTPData();
    } else {
      console.log('No applications provided to useBranchPTPData');
      setData([]);
    }
  }, [applications, selectedEmiMonth, fetchFieldStatus, fetchPtpDates]);

  return { data, loading, error };
};
