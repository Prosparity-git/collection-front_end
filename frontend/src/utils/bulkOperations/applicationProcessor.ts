import { client } from '@/integrations/api/client';

export interface ProcessingResults {
  successful: number;
  failed: number;
  updated: number;
  statusUpdated: number;
  errors: string[];
}

export const processApplicationBatch = async (applications: any[], user?: any): Promise<ProcessingResults> => {
  console.log('Processing bulk applications:', applications.length);
  
  const results: ProcessingResults = {
    successful: 0,
    failed: 0,
    updated: 0,
    statusUpdated: 0,
    errors: []
  };

  const validStatuses = ['Unpaid', 'Partially Paid', 'Cash Collected from Customer', 'Customer Deposited to Bank', 'Paid'];

  for (const app of applications) {
    try {
      const { status: statusFromTemplate, uploadMode, ...applicationData } = app;
      // Prepare collection data
      const collectionData = {
        application_id: app.applicant_id,
        demand_date: app.demand_date,
        team_lead: app.team_lead,
        rm_name: app.rm_name,
        repayment: app.repayment,
        emi_amount: app.emi_amount,
        last_month_bounce: app.last_month_bounce,
        lms_status: app.lms_status,
        collection_rm: app.collection_rm,
        amount_collected: app.amount_collected || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Check if application exists
      const { data: existingApp, error: selectError } = await client
        .from('applications')
        .select('applicant_id')
        .eq('applicant_id', app.applicant_id)
        .maybeSingle();
      const appExists = !!existingApp;

      // Only insert into applications if it does not exist
      if (!appExists) {
        const { error: insertError } = await client
          .from('applications')
          .insert([{ ...applicationData, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
        if (insertError) {
          results.failed++;
          results.errors.push(`Failed to insert application ${app.applicant_id}: ${insertError.message}`);
          continue; // Don't insert into collection if application insert fails
        } else {
          results.successful++;
        }
      } else {
        results.updated++; // Count as monthly update
      }

      // Now insert into collection table
      const { error: collectionError } = await client
        .from('collection')
        .insert([collectionData]);
      if (collectionError) {
        results.failed++;
        results.errors.push(`Failed to insert into collection for ${app.applicant_id}: ${collectionError.message}`);
        continue;
      }
    } catch (error) {
      results.failed++;
      results.errors.push(`Unexpected error for ${app.applicant_id}: ${error}`);
    }
  }
  return results;
};

const updateExistingApplication = async (
  app: any, 
  applicationData: any, 
  statusFromTemplate: string,
  validStatuses: string[],
  user: any,
  results: ProcessingResults
) => {
  console.log(`Updating existing application: ${app.applicant_id}`);
  
  // Filter out null/undefined/empty-string values to preserve existing data
  const updateData = Object.fromEntries(
    Object.entries(applicationData).filter(([_, value]) => 
      value !== null && value !== undefined && value !== ''
    )
  );
  // Add updated_at timestamp
  updateData.updated_at = new Date().toISOString();
  
  console.log('Update data (filtered):', updateData);
  
  const { error: updateError } = await client
    .from('applications')
    .update(updateData)
    .eq('applicant_id', app.applicant_id);

  if (updateError) {
    console.error('Error updating application:', updateError);
    results.failed++;
    results.errors.push(`Failed to update ${app.applicant_id}: ${updateError.message}`);
  } else {
    console.log('Updated application:', app.applicant_id);
    results.updated++;

    if (statusFromTemplate && validStatuses.includes(statusFromTemplate) && user) {
      try {
        const { updateFieldStatusFromBulk } = await import('./statusUpdater');
        await updateFieldStatusFromBulk(app.applicant_id, statusFromTemplate, user);
        results.statusUpdated++;
        console.log(`Status updated for existing application: ${app.applicant_id}`);
      } catch (statusError) {
        console.error('Error updating status for existing application:', statusError);
        results.errors.push(`Failed to update status for ${app.applicant_id}: ${statusError}`);
      }
    }
  }
};

const createNewApplication = async (
  app: any,
  applicationData: any,
  statusFromTemplate: string,
  validStatuses: string[],
  user: any,
  results: ProcessingResults
) => {
  console.log(`Creating new application: ${app.applicant_id}`);
  
  const { error: insertError } = await client
    .from('applications')
    .insert([{
      ...applicationData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }]);

  if (insertError) {
    console.error('Error inserting application:', insertError);
    results.failed++;
    results.errors.push(`Failed to insert ${app.applicant_id}: ${insertError.message}`);
  } else {
    console.log('Inserted application:', app.applicant_id);
    results.successful++;

    try {
      const initialStatus = (statusFromTemplate && validStatuses.includes(statusFromTemplate)) 
        ? statusFromTemplate 
        : 'Unpaid';
      
      const { createInitialFieldStatus } = await import('./statusCreator');
      await createInitialFieldStatus(app.applicant_id, initialStatus, user);
      
      if (statusFromTemplate && validStatuses.includes(statusFromTemplate)) {
        results.statusUpdated++;
      }
    } catch (fieldStatusError) {
      console.error('Error creating field status:', fieldStatusError);
      results.errors.push(`Failed to create field status for ${app.applicant_id}: ${fieldStatusError}`);
    }
  }
};
