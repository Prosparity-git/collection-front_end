import { client } from '@/integrations/api/client';

// Utility to update missing PTP dates based on audit log analysis
export const updateMissingPtpDates = async () => {
  console.log('=== UPDATING MISSING PTP DATES ===');
  
  const updates = [
    {
      applicant_id: 'PROSAPP250425000016', // Jitendra Kumar
      ptp_date: '2025-05-03T00:00:00.000Z',
      demand_date: '2025-01-01', // Add appropriate demand date
      applicant_name: 'Jitendra Kumar'
    },
    {
      applicant_id: 'PROSAPP250502000104', // Mahesh
      ptp_date: '2025-05-03T00:00:00.000Z', 
      demand_date: '2025-01-01', // Add appropriate demand date
      applicant_name: 'Mahesh'
    }
  ];

  for (const update of updates) {
    try {
      // Insert into ptp_dates table with demand_date
      const { data, error } = await client
        .from('ptp_dates')
        .insert({
          application_id: update.applicant_id,
          ptp_date: update.ptp_date,
          demand_date: update.demand_date,
          user_id: 'system' // Use a system user ID or get from auth
        })
        .select();

      if (error) {
        console.error(`Error updating PTP date for ${update.applicant_name}:`, error);
      } else {
        console.log(`✓ Updated PTP date for ${update.applicant_name} (${update.applicant_id})`);
      }
    } catch (error) {
      console.error(`Exception updating PTP date for ${update.applicant_name}:`, error);
    }
  }
};

// Call this function to apply the missing updates
// updateMissingPtpDates();
