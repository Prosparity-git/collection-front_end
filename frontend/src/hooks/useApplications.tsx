import { useState, useEffect, useCallback, useMemo } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { Application } from '@/types/application';
import { DatabaseApplication } from '@/types/database';
import { useFieldStatus } from '@/hooks/useFieldStatus';
import { usePtpDates } from '@/hooks/usePtpDates';
import { usePaymentDates } from '@/hooks/usePaymentDates';
import { useComments } from '@/hooks/useComments';

interface UseApplicationsProps {
  page?: number;
  pageSize?: number;
}

export const useApplications = ({ page = 1, pageSize = 50 }: UseApplicationsProps = {}) => {
  const { user } = useAuth();
  const { fetchFieldStatus } = useFieldStatus();
  const { fetchPtpDates } = usePtpDates();
  const { fetchPaymentDates } = usePaymentDates();
  const { fetchCommentsByApplications } = useComments();
  
  const [applications, setApplications] = useState<Application[]>([]);
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Helper function to fetch contact statuses for multiple applications
  const fetchContactStatusesForApps = useCallback(async (appIds: string[]): Promise<Record<string, any>> => {
    try {
      const { data, error } = await client
        .from('contact_calling_status')
        .select('application_id, contact_type, status, created_at')
        .in('application_id', appIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contact statuses:', error);
        return {};
      }

      // Group by application_id and contact_type, keeping latest status
      const statusMap: Record<string, any> = {};
      
      data?.forEach(status => {
        if (!statusMap[status.application_id]) {
          statusMap[status.application_id] = {};
        }
        
        const contactType = status.contact_type.toLowerCase() as string;
        // Only set if we don't already have a status for this contact type (keeps latest due to ordering)
        if (!statusMap[status.application_id][contactType]) {
          statusMap[status.application_id][contactType] = status.status;
        }
      });

      return statusMap;
    } catch (error) {
      console.error('Error in fetchContactStatusesForApps:', error);
      return {};
    }
  }, []);

  // Memoized enhancement function to avoid recreating on every render
  const enhanceApplications = useCallback((
    apps: DatabaseApplication[],
    fieldStatusMap: Record<string, string>,
    ptpDatesMap: Record<string, string>,
    paymentDatesMap: Record<string, string>,
    contactStatusesMap: Record<string, any>,
    commentsByApp: Record<string, any[]>
  ): Application[] => {
    return apps.map(app => {
      const contactStatuses = contactStatusesMap[app.applicant_id] || {};
      
      return {
        ...app,
        field_status: fieldStatusMap[app.applicant_id] || 'Unpaid',
        ptp_date: ptpDatesMap[app.applicant_id],
        paid_date: paymentDatesMap[app.applicant_id],
        applicant_calling_status: contactStatuses.applicant || 'Not Called',
        co_applicant_calling_status: contactStatuses.co_applicant || 'Not Called',
        guarantor_calling_status: contactStatuses.guarantor || 'Not Called',
        reference_calling_status: contactStatuses.reference || 'Not Called',
        latest_calling_status: contactStatuses.latest || 'No Calls',
        recent_comments: commentsByApp[app.applicant_id] || []
      } as Application;
    });
  }, []);

  const fetchApplications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log(`Fetching applications page ${page} (${pageSize} per page)`);
      
      // Get total count efficiently
      const { count } = await client
        .from('applications')
        .select('*', { count: 'exact', head: true });

      setTotalCount(count || 0);

      // Batch fetch applications for better performance
      const [allAppsResult, paginatedAppsResult] = await Promise.all([
        // Fetch ALL applications for filters (limited fields for memory efficiency)
        client
          .from('applications')
          .select('*')
          .order('applicant_name', { ascending: true }),
        
        // Get paginated applications for current view
        client
          .from('applications')
          .select('*')
          .order('applicant_name', { ascending: true })
          .range((page - 1) * pageSize, page * pageSize - 1)
      ]);

      if (allAppsResult.error) {
        console.error('Error fetching all applications:', allAppsResult.error);
        return;
      }

      if (paginatedAppsResult.error) {
        console.error('Error fetching paginated applications:', paginatedAppsResult.error);
        return;
      }

      const allAppsData = allAppsResult.data;
      const appsData = paginatedAppsResult.data;

      // Fetch related data for ALL applications in parallel
      const allAppIds = allAppsData?.map(app => app.applicant_id) || [];
      
      const [fieldStatusMap, ptpDatesMap, paymentDatesMap, contactStatusesMap, commentsByApp] = await Promise.all([
        fetchFieldStatus(allAppIds),
        fetchPtpDates(allAppIds),
        fetchPaymentDates(allAppIds),
        fetchContactStatusesForApps(allAppIds),
        fetchCommentsByApplications(allAppIds)
      ]);

      // Enhance applications with related data
      const applicationsWithData = enhanceApplications(
        appsData as DatabaseApplication[], 
        fieldStatusMap, 
        ptpDatesMap, 
        paymentDatesMap, 
        contactStatusesMap, 
        commentsByApp
      );
      
      const allApplicationsWithData = enhanceApplications(
        allAppsData as DatabaseApplication[], 
        fieldStatusMap, 
        ptpDatesMap, 
        paymentDatesMap, 
        contactStatusesMap, 
        commentsByApp
      );

      console.log('Enhanced applications with all related data');
      
      setApplications(applicationsWithData);
      setAllApplications(allApplicationsWithData);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, page, pageSize, fetchFieldStatus, fetchPtpDates, fetchPaymentDates, fetchContactStatusesForApps, fetchCommentsByApplications, enhanceApplications]);

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user, fetchApplications]);

  const memoizedReturn = useMemo(() => ({
    applications,
    allApplications,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
    currentPage: page,
    loading,
    refetch: fetchApplications
  }), [applications, allApplications, totalCount, pageSize, page, loading, fetchApplications]);

  return memoizedReturn;
};
