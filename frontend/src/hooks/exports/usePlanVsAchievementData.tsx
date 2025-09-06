import { useState, useCallback } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { PlanVsAchievementApplication } from '@/types/planVsAchievement';

export const usePlanVsAchievementData = () => {
  const { user } = useAuth();
  const { getUserName, fetchProfiles } = useUserProfiles();
  const [loading, setLoading] = useState(false);

  const fetchPlanVsAchievementData = useCallback(async (plannedDateTime: Date): Promise<PlanVsAchievementApplication[]> => {
    if (!user) return [];

    setLoading(true);
    try {
      console.log('=== PLAN VS ACHIEVEMENT DATA FETCH - INCLUDING ALL APPLICATIONS ===');
      console.log('Input planned date/time:', plannedDateTime.toISOString());

      // Get the planned date (just date part, no time) for PTP comparison
      // Fix: Use the date directly from the input without timezone manipulation
      const year = plannedDateTime.getFullYear();
      const month = String(plannedDateTime.getMonth() + 1).padStart(2, '0');
      const day = String(plannedDateTime.getDate()).padStart(2, '0');
      const plannedDateStr = `${year}-${month}-${day}`;
      
      console.log('Looking for applications that had PTP =', plannedDateStr, 'as of', plannedDateTime.toISOString());
      console.log('Including ALL applications regardless of their status at the planned timestamp');

      // Step 1: Get ALL PTP records created before or at the planned timestamp
      const { data: historicalPtpData, error: ptpError } = await client
        .from('ptp_dates')
        .select('application_id, ptp_date, created_at')
        .lte('created_at', plannedDateTime.toISOString())
        .order('application_id')
        .order('created_at', { ascending: false });

      if (ptpError) {
        console.error('Error fetching historical PTP data:', ptpError);
        return [];
      }

      console.log('Total historical PTP records retrieved:', historicalPtpData?.length || 0);

      // Step 2: Get the LATEST PTP for each application as of the planned timestamp
      const ptpAsOfTimestamp: Record<string, string | null> = {};
      const processedApps = new Set<string>();
      
      historicalPtpData?.forEach((record, index) => {
        if (!processedApps.has(record.application_id)) {
          const recordPtpDate = record.ptp_date ? new Date(record.ptp_date).toISOString().split('T')[0] : null;
          
          console.log(`Historical PTP Record ${index + 1}:`, {
            app_id: record.application_id,
            ptp_date: record.ptp_date,
            ptp_date_str: recordPtpDate,
            created_at: record.created_at,
            matches_planned_date: recordPtpDate === plannedDateStr
          });

          ptpAsOfTimestamp[record.application_id] = record.ptp_date;
          processedApps.add(record.application_id);
        }
      });

      // Step 3: Filter to only applications that had PTP = planned date as of the timestamp
      const applicationsWithMatchingPtp = Object.entries(ptpAsOfTimestamp).filter(([appId, ptpDate]) => {
        if (!ptpDate) return false;
        
        const ptpDateStr = new Date(ptpDate).toISOString().split('T')[0];
        const matches = ptpDateStr === plannedDateStr;
        
        console.log(`App ${appId}: PTP as of timestamp = ${ptpDateStr}, Planned date = ${plannedDateStr}, Matches = ${matches}`);
        
        return matches;
      });

      console.log('APPLICATIONS WITH MATCHING PTP:');
      applicationsWithMatchingPtp.forEach(([appId, ptpDate]) => {
        const ptpDateStr = new Date(ptpDate!).toISOString().split('T')[0];
        console.log(`✓ App ${appId}: PTP = ${ptpDateStr} (matches planned date ${plannedDateStr})`);
      });

      console.log('INITIAL FILTER RESULT:', applicationsWithMatchingPtp.length, 'applications had PTP matching planned date as of the timestamp');

      if (applicationsWithMatchingPtp.length === 0) {
        console.log('No applications found with matching PTP dates as of the planned timestamp');
        return [];
      }

      const applicationIds = applicationsWithMatchingPtp.map(([appId]) => appId);

      // Step 4: Get historical status from audit logs as of planned time (instead of field_status which gets overwritten)
      const { data: historicalAuditLogs, error: auditError } = await client
        .from('audit_logs')
        .select('application_id, field, previous_value, new_value, created_at')
        .in('application_id', applicationIds)
        .eq('field', 'Status')
        .lte('created_at', plannedDateTime.toISOString())
        .order('application_id')
        .order('created_at', { ascending: false });

      if (auditError) {
        console.error('Error fetching historical audit logs:', auditError);
      }

      // Create map of latest status as of planned timestamp from audit logs
      const historicalStatusMap: Record<string, string> = {};
      const processedHistoricalStatus = new Set<string>();
      
      // First, get the initial status from field_status (for applications with no audit logs)
      const { data: initialStatusData, error: initialStatusError } = await client
        .from('field_status')
        .select('application_id, status, created_at')
        .in('application_id', applicationIds)
        .lte('created_at', plannedDateTime.toISOString())
        .order('application_id')
        .order('created_at', { ascending: false });

      if (initialStatusError) {
        console.error('Error fetching initial status:', initialStatusError);
      }

      // Build historical status map from audit logs
      // For each application, find the latest audit log (field='Status') with created_at <= plannedDateTime
      const auditLogsByApp: Record<string, any[]> = {};
      historicalAuditLogs?.forEach(auditLog => {
        if (!auditLogsByApp[auditLog.application_id]) {
          auditLogsByApp[auditLog.application_id] = [];
        }
        auditLogsByApp[auditLog.application_id].push(auditLog);
      });

      applicationIds.forEach(appId => {
        // Sort logs for this app by created_at DESC (latest first)
        const logs = (auditLogsByApp[appId] || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        if (logs.length > 0) {
          // Use the new_value of the latest audit log before plannedDateTime
          historicalStatusMap[appId] = logs[0].new_value || 'Unpaid';
          processedHistoricalStatus.add(appId);
        }
      });

      // For applications without audit logs, set previous status to 'Unpaid'
      applicationIds.forEach(appId => {
        if (!processedHistoricalStatus.has(appId)) {
          historicalStatusMap[appId] = 'Unpaid';
          processedHistoricalStatus.add(appId);
        }
      });

      // Get application details to check LMS status fallback
      const { data: applications, error: appsError } = await client
        .from('applications')
        .select('*')
        .in('applicant_id', applicationIds);

      if (appsError) {
        console.error('Error fetching applications:', appsError);
        return [];
      }

      // Step 5: Include ALL applications with matching PTP dates (removed paid status filter)
      const allApplicationIds: string[] = [];
      const historicalPtpMap: Record<string, string> = {};

      applicationsWithMatchingPtp.forEach(([appId, ptpDate]) => {
        allApplicationIds.push(appId);
        if (ptpDate) {
          historicalPtpMap[appId] = ptpDate;
        }
      });

      console.log('INCLUDING ALL APPLICATIONS:', allApplicationIds.length, 'applications with matching PTP dates (including paid ones)');

      if (allApplicationIds.length === 0) {
        console.log('No applications found with matching PTP dates');
        return [];
      }

      // Use all applications (not filtered by paid status)
      const allApplications = applications?.filter(app => allApplicationIds.includes(app.applicant_id));

      console.log('Proceeding with application IDs:', allApplicationIds);

      // Get current status for all applications
      const { data: currentStatus, error: currentStatusError } = await client
        .from('field_status')
        .select('application_id, status, created_at')
        .in('application_id', allApplicationIds)
        .order('application_id')
        .order('created_at', { ascending: false });

      if (currentStatusError) {
        console.error('Error fetching current status:', currentStatusError);
      }

      // Get current PTP dates (for "updated PTP date")
      const { data: currentPtpData, error: currentPtpError } = await client
        .from('ptp_dates')
        .select('application_id, ptp_date, created_at')
        .in('application_id', allApplicationIds)
        .order('application_id')
        .order('created_at', { ascending: false });

      if (currentPtpError) {
        console.error('Error fetching current PTP data:', currentPtpError);
      }

      // Get comments between planned time and now for all applications
      const { data: comments, error: commentsError } = await client
        .from('comments')
        .select('application_id, content, user_id, user_email, created_at')
        .in('application_id', allApplicationIds)
        .gte('created_at', plannedDateTime.toISOString())
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
      }

      // Fetch user profiles for comments
      const userIds = [...new Set(comments?.map(c => c.user_id) || [])];
      if (userIds.length > 0) {
        await fetchProfiles(userIds);
      }

      // Create maps for efficient lookup
      const currentStatusMap: Record<string, string> = {};
      const processedCurrentStatus = new Set<string>();
      currentStatus?.forEach(status => {
        if (!processedCurrentStatus.has(status.application_id)) {
          currentStatusMap[status.application_id] = status.status;
          processedCurrentStatus.add(status.application_id);
        }
      });

      const currentPtpMap: Record<string, string | null> = {};
      const processedCurrentPtp = new Set<string>();
      currentPtpData?.forEach(ptp => {
        if (!processedCurrentPtp.has(ptp.application_id)) {
          currentPtpMap[ptp.application_id] = ptp.ptp_date;
          processedCurrentPtp.add(ptp.application_id);
        }
      });

      // Group comments by application
      const commentsByApp: Record<string, string> = {};
      comments?.forEach(comment => {
        const userName = getUserName(comment.user_id, comment.user_email);
        const commentText = `${userName}: ${comment.content}`;
        
        if (commentsByApp[comment.application_id]) {
          commentsByApp[comment.application_id] += ` | ${commentText}`;
        } else {
          commentsByApp[comment.application_id] = commentText;
        }
      });

      // Combine all data into the comprehensive interface
      const result: PlanVsAchievementApplication[] = allApplications?.map(app => {
        const previousStatus = historicalStatusMap[app.applicant_id] || app.lms_status;
        const updatedStatus = currentStatusMap[app.applicant_id] || app.lms_status;
        const historicalPtpDate = historicalPtpMap[app.applicant_id];
        const currentPtpDate = currentPtpMap[app.applicant_id];
        
        console.log(`FINAL RESULT - App ${app.applicant_id} (${app.applicant_name}):`);
        console.log(`  Previous PTP Date (as of ${plannedDateTime.toISOString()}): ${historicalPtpDate}`);
        console.log(`  Current PTP Date: ${currentPtpDate}`);
        console.log(`  Previous Status (as of ${plannedDateTime.toISOString()}): ${previousStatus}`);
        console.log(`  Current Status: ${updatedStatus}`);

        return {
          applicant_id: app.applicant_id,
          branch_name: app.branch_name,
          rm_name: app.rm_name,
          collection_rm: app.collection_rm || '',
          dealer_name: app.dealer_name,
          applicant_name: app.applicant_name,
          previous_ptp_date: historicalPtpDate,
          previous_status: previousStatus,
          updated_ptp_date: currentPtpDate,
          updated_status: updatedStatus,
          comment_trail: commentsByApp[app.applicant_id] || 'No comments',
          emi_amount: app.emi_amount,
          demand_date: app.demand_date,
          lender_name: app.lender_name,
          team_lead: app.team_lead,
          principle_due: app.principle_due,
          interest_due: app.interest_due,
          last_month_bounce: app.last_month_bounce,
          applicant_mobile: app.applicant_mobile,
          co_applicant_name: app.co_applicant_name,
          co_applicant_mobile: app.co_applicant_mobile,
          co_applicant_address: app.co_applicant_address,
          guarantor_name: app.guarantor_name,
          guarantor_mobile: app.guarantor_mobile,
          guarantor_address: app.guarantor_address,
          reference_name: app.reference_name,
          reference_mobile: app.reference_mobile,
          reference_address: app.reference_address,
          applicant_address: app.applicant_address,
          house_ownership: app.house_ownership,
          repayment: app.repayment,
          fi_location: app.fi_location
        };
      }) || [];

      console.log('=== FINAL SUMMARY ===');
      console.log('Total applications in result:', result.length);
      console.log('Logic: Applications that had PTP =', plannedDateStr, 'as of', plannedDateTime.toISOString(), '(including paid applications)');
      console.log('Expected: All previous_ptp_date values should be', plannedDateStr);
      
      // Validate the results (removed paid status validation)
      const invalidResults = result.filter(app => {
        const appPtpDateStr = app.previous_ptp_date ? new Date(app.previous_ptp_date).toISOString().split('T')[0] : null;
        return appPtpDateStr !== plannedDateStr;
      });
      
      if (invalidResults.length > 0) {
        console.error('❌ VALIDATION FAILED: Found applications with incorrect PTP dates:');
        invalidResults.forEach(app => {
          const appPtpDateStr = app.previous_ptp_date ? new Date(app.previous_ptp_date).toISOString().split('T')[0] : null;
          console.error(`- ${app.applicant_name}: previous_ptp_date = ${appPtpDateStr}, expected = ${plannedDateStr}`);
        });
      } else {
        console.log('✅ VALIDATION PASSED: All applications have correct previous_ptp_date');
      }
      
      return result;
    } catch (error) {
      console.error('Error in fetchPlanVsAchievementData:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, getUserName, fetchProfiles]);

  return {
    fetchPlanVsAchievementData,
    loading
  };
};
