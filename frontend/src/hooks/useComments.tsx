
import { useState, useEffect, useCallback, useRef } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { getMonthDateRange } from '@/utils/dateUtils';
import { CommentsService, COMMENT_TYPES } from '@/integrations/api/services/commentsService';

export interface Comment {
  id: number; // Changed from string to number to match API
  content: string; // Changed from content to match API
  commented_at: string; // Changed from created_at to match API
  user_id: number; // Changed from string to number to match API
  user_name: string; // This will be resolved from user profiles
  application_id?: string; // Optional for backward compatibility
  demand_date?: string; // Optional for backward compatibility
}

export const useComments = (selectedMonth?: string) => {
  const { user } = useAuth();
  const { getUserName, fetchProfiles } = useUserProfiles();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastFetchedApplicationId, setLastFetchedApplicationId] = useState<string | null>(null);
  const [lastFetchedMonth, setLastFetchedMonth] = useState<string | null>(null);
  const fetchInProgressRef = useRef<boolean>(false);

  // Clear comments when selectedMonth changes to prevent stale data
  useEffect(() => {
    if (selectedMonth !== lastFetchedMonth) {
      console.log('Comments: Clearing due to month change', { from: lastFetchedMonth, to: selectedMonth });
      setComments([]);
      setLastFetchedApplicationId(null);
      setLastFetchedMonth(null);
    }
  }, [selectedMonth, lastFetchedMonth]);

  const fetchComments = useCallback(async (applicationId: string): Promise<Comment[]> => {
    if (!user || !applicationId) return [];

    // Prevent duplicate fetches
    if (fetchInProgressRef.current) {
      console.log('Comments: Fetch already in progress, skipping');
      return comments;
    }

    fetchInProgressRef.current = true;
    setLoading(true);
    
    try {
      console.log('=== FETCHING COMMENTS ===');
      console.log('Application ID:', applicationId);
      console.log('Selected Month:', selectedMonth);

      // Use the comments API service to fetch comments
      const commentsResponse = await CommentsService.getCommentsByRepaymentAndType(
        applicationId,
        COMMENT_TYPES.APPLICATION_DETAILS,
        0, // skip
        100 // limit
      );

      if (!commentsResponse.results || commentsResponse.results.length === 0) {
        console.log('No comments found for application:', applicationId, 'month:', selectedMonth);
        setComments([]);
        setLastFetchedApplicationId(applicationId);
        setLastFetchedMonth(selectedMonth);
        return [];
      }

      console.log('Raw comments data from API:', commentsResponse.results);

      // Get unique user IDs for profile fetching
      const userIds = [...new Set(commentsResponse.results.map(comment => comment.user_id.toString()))];
      console.log('Fetching profiles for user IDs:', userIds);

      // Fetch user profiles first and wait for completion
      await fetchProfiles(userIds);

      // Map comments with resolved user names
      const mappedComments: Comment[] = commentsResponse.results.map(comment => {
        const userName = getUserName(comment.user_id.toString(), null); // API doesn't provide user_email
        console.log(`✓ Comment ${comment.id}: user_id=${comment.user_id} -> resolved_name="${userName}"`);
        
        return {
          ...comment,
          user_name: userName,
          content: comment.comment, // Map comment field to content for consistency
          application_id: applicationId // Add application_id for backward compatibility
        };
      });

      console.log('Final mapped comments with resolved names:', mappedComments);
      setComments(mappedComments);
      setLastFetchedApplicationId(applicationId);
      setLastFetchedMonth(selectedMonth);
      return mappedComments;
    } catch (error) {
      console.error('Exception in fetchComments:', error);
      return [];
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [user, fetchProfiles, getUserName, selectedMonth]);

  // Remove the bulk fetch function - we'll only fetch on demand now
  const fetchCommentsByApplications = useCallback(async (
    applicationIds: string[], 
    startDate?: Date, 
    endDate?: Date
  ): Promise<Record<string, Array<{content: string; user_name: string}>>> => {
    // This is now deprecated - comments should be fetched individually
    console.warn('fetchCommentsByApplications is deprecated. Use individual fetchComments instead.');
    return {};
  }, []);

  const addComment = useCallback(async (
    applicationId: string, 
    content: string, 
    demandDate?: string,
    loanId?: number,
    emiMonth?: string
  ): Promise<void> => {
    if (!user?.id || !applicationId || !content.trim()) {
      console.error('Cannot add comment: user not authenticated or missing application ID');
      return;
    }

    try {
      console.log('=== ADDING COMMENT ===');
      console.log('Application ID:', applicationId);
      console.log('Content:', content);
      console.log('User ID (frontend):', user.id);
      console.log('User ID (sending to API):', user.id); // Use actual user ID
      console.log('User email:', user.email);
      console.log('Demand Date:', demandDate);
      console.log('Loan ID:', loanId);
      console.log('EMI Month:', emiMonth);

      let repaymentId = applicationId; // Default fallback

      // If we have loan_id and emi_month, fetch the correct repayment_id
      if (loanId && emiMonth) {
        try {
          console.log('🔍 Fetching repayment_id for loan_id:', loanId, 'emi_month:', emiMonth);
          
          // Parse emi_month (e.g., "Aug-25" -> month: 8, year: 2025)
          const monthMap: { [key: string]: number } = {
            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
          };
          
          const [monthStr, yearStr] = emiMonth.split('-');
          const month = monthMap[monthStr];
          const year = parseInt(`20${yearStr}`);
          
          if (!month || !year) {
            throw new Error(`Invalid emi_month format: ${emiMonth}. Expected format: "Aug-25"`);
          }

          console.log('🔍 Parsed month/year:', { month, year });

          // Direct database query to find payment details
          // Based on DDL: payment_details table has loan_application_id, demand_month, demand_year
          console.log('🔍 Querying payment_details table for loan_id:', loanId, 'month:', month, 'year:', year);
          
          const { data: paymentDetails, error } = await client
            .from('payment_details')
            .select('id, loan_application_id, demand_month, demand_year')
            .eq('loan_application_id', loanId)
            .eq('demand_month', month)
            .eq('demand_year', year)
            .maybeSingle();

          if (error) {
            console.error('❌ Database query error:', error);
            
            // If there's an error, let's check what tables are available
            console.log('🔍 Checking available tables...');
            try {
              const { data: tables, error: tablesError } = await client
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public');
              
              if (tablesError) {
                console.log('⚠️ Could not check tables:', tablesError);
              } else {
                console.log('📋 Available tables:', tables?.map(t => t.table_name));
              }
            } catch (tableCheckError) {
              console.log('⚠️ Table check failed:', tableCheckError);
            }
            
            throw error;
          }

          if (paymentDetails) {
            repaymentId = paymentDetails.id.toString();
            console.log('✅ Found repayment_id:', repaymentId, 'for loan_id:', loanId, 'emi_month:', emiMonth);
            console.log('✅ Payment details:', paymentDetails);
          } else {
            console.log('⚠️ No payment details found in database for loan_id:', loanId, 'month:', month, 'year:', year);
            console.log('⚠️ Using applicationId as repayment_id:', applicationId);
            
            // Let's also check what's actually in the payment_details table for this loan_id
            const { data: allPaymentDetails, error: listError } = await client
              .from('payment_details')
              .select('id, loan_application_id, demand_month, demand_year')
              .eq('loan_application_id', loanId);
            
            if (listError) {
              console.error('❌ Error listing payment details:', listError);
            } else {
              console.log('🔍 All payment details for loan_id:', loanId, ':', allPaymentDetails);
            }
          }
        } catch (error) {
          console.error('❌ Error fetching payment details, using fallback:', error);
          console.log('⚠️ Using applicationId as repayment_id:', applicationId);
        }
      } else {
        console.log('⚠️ No loan_id or emi_month provided, using applicationId as repayment_id:', applicationId);
      }

      // Validate repayment_id
      console.log('🔍 Final repayment_id being used:', repaymentId);
      console.log('🔍 Is repayment_id different from applicationId?', repaymentId !== applicationId);

      // Use the comments API service to create a comment
      const commentData = {
        repayment_id: repaymentId, // Use the fetched repayment_id or fallback
        comment: content.trim(),
        user_id: user?.id, // Use current user's ID from auth context
        comment_type: COMMENT_TYPES.APPLICATION_DETAILS // Use application details comment type
      };

      console.log('🚀 Creating comment with data:', commentData);
      
      // Additional validation log
      if (repaymentId === applicationId) {
        console.warn('⚠️ WARNING: repayment_id is the same as applicationId. Payment details lookup may have failed.');
      } else {
        console.log('✅ SUCCESS: repayment_id is different from applicationId - payment details lookup worked!');
      }

      const newComment = await CommentsService.createComment(commentData);

      console.log('✓ Comment added successfully via API:', newComment);
      
      // Clear cache to force fresh fetch next time
      setLastFetchedApplicationId(null);
      setLastFetchedMonth(null);
      
    } catch (error) {
      console.error('Exception in addComment:', error);
      throw error;
    }
  }, [user]);

  // Add a function to clear comments (useful for resetting state)
  const clearComments = useCallback(() => {
    console.log('Comments: Clearing all cached data');
    setComments([]);
    setLastFetchedApplicationId(null);
    setLastFetchedMonth(null);
  }, []);

  return {
    comments,
    loading,
    fetchComments,
    fetchCommentsByApplications, // Kept for backward compatibility but deprecated
    addComment,
    clearComments
  };
};
