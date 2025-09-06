
import { client } from '@/integrations/api/client';

export const updateFieldStatusFromBulk = async (applicationId: string, newStatus: string, user: any, demandDate: string = '45843') => {
  try {
    console.log(`Updating field status for ${applicationId} to ${newStatus}`);
    
    const { data: currentStatus } = await client
      .from('field_status')
      .select('status')
      .eq('application_id', applicationId)
      .eq('demand_date', demandDate)
      .maybeSingle();

    const previousStatus = currentStatus?.status || 'Unpaid';

    if (previousStatus === newStatus) {
      console.log(`Status for ${applicationId} is already ${newStatus}, skipping update`);
      return;
    }

    const { error } = await client
      .from('field_status')
      .upsert({
        application_id: applicationId,
        status: newStatus,
        user_id: user.id,
        user_email: user.email,
        demand_date: demandDate,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'application_id,demand_date'
      });

    if (error) {
      console.error('Error updating field status:', error);
      throw error;
    }

    await client
      .from('audit_logs')
      .insert({
        field: 'Status (Bulk Upload)',
        previous_value: previousStatus,
        new_value: newStatus,
        application_id: applicationId,
        demand_date: demandDate,
        user_id: user.id,
        user_email: user.email
      });

    console.log(`Successfully updated status for ${applicationId}: ${previousStatus} -> ${newStatus}`);
  } catch (error) {
    console.error('Error in updateFieldStatusFromBulk:', error);
    throw error;
  }
};
