
import { useState, useCallback } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { PaymentDate } from '@/types/database';

export const usePaymentDates = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchPaymentDate = useCallback(async (applicationId: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const { data, error } = await client
        .from('payment_dates')
        .select('paid_date')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching payment date:', error);
        return null;
      }

      return data?.paid_date || null;
    } catch (error) {
      console.error('Error fetching payment date:', error);
      return null;
    }
  }, [user]);

  const fetchPaymentDates = useCallback(async (applicationIds: string[]): Promise<Record<string, string>> => {
    if (!user || applicationIds.length === 0) return {};
    
    try {
      const { data, error } = await client
        .from('payment_dates')
        .select('application_id, paid_date, created_at')
        .in('application_id', applicationIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment dates:', error);
        return {};
      }

      // Get the latest payment date for each application
      const paymentMap: Record<string, string> = {};
      data?.forEach(payment => {
        if (payment.paid_date && !paymentMap[payment.application_id]) {
          paymentMap[payment.application_id] = payment.paid_date;
        }
      });

      return paymentMap;
    } catch (error) {
      console.error('Error fetching payment dates:', error);
      return {};
    }
  }, [user]);

  const updatePaymentDate = useCallback(async (applicationId: string, paidDate: string | null) => {
    if (!user) return false;

    setLoading(true);
    try {
      const { error } = await client
        .from('payment_dates')
        .insert({
          application_id: applicationId,
          paid_date: paidDate,
          user_id: user.id
        });

      if (error) {
        console.error('Error updating payment date:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating payment date:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    fetchPaymentDate,
    fetchPaymentDates,
    updatePaymentDate,
    loading
  };
};
