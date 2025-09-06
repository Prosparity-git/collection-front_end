
import { client } from '@/integrations/api/client';

export const createInitialFieldStatus = async (applicationId: string, initialStatus: string, user: any, demandDate: string = '45843') => {
  console.log(`Creating field status for new application: ${applicationId} with status: ${initialStatus}`);
  
  const { error: fieldStatusError } = await client
    .from('field_status')
    .upsert({
      application_id: applicationId,
      status: initialStatus,
      user_id: user?.id || '',
      user_email: user?.email || 'system@bulk-upload.local',
      demand_date: demandDate,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'application_id,demand_date'
    });

  if (fieldStatusError) {
    console.error('Error creating field status:', fieldStatusError);
    throw new Error(`Failed to create field status: ${fieldStatusError.message}`);
  }

  if (initialStatus !== 'Unpaid' && user) {
    await client
      .from('audit_logs')
      .insert({
        field: 'Status (Bulk Upload)',
        previous_value: 'Unpaid',
        new_value: initialStatus,
        application_id: applicationId,
        demand_date: demandDate,
        user_id: user.id,
        user_email: user.email
      });
  }
};
