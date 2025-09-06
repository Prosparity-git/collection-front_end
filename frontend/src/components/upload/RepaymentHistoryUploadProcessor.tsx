import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { useAuth } from '@/hooks/useAuth';
import { UploadMode } from './UploadModeSelector';
import { client } from '@/integrations/api/client';

interface RepaymentHistoryUploadProcessorProps {
  uploadMode: UploadMode;
  uploading: boolean;
  onUploadingChange: (uploading: boolean) => void;
  onApplicationsAdded: () => void;
  onDialogClose: () => void;
}

const RepaymentHistoryUploadProcessor = ({ 
  uploadMode, 
  uploading, 
  onUploadingChange, 
  onApplicationsAdded,
  onDialogClose 
}: RepaymentHistoryUploadProcessorProps) => {
  const { user } = useAuth();

  const parseNumericValue = (value: any): number | null => {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : parsed;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    onUploadingChange(true);
    toast.loading('Processing repayment history file...', { id: 'repayment-upload' });

    try {
      console.log('Starting repayment history upload process with mode:', uploadMode);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Process Repayment History sheet
      const repaymentWorksheet = workbook.Sheets[workbook.SheetNames[0]];
      const repaymentData = XLSX.utils.sheet_to_json(repaymentWorksheet);

      console.log('Parsed repayment history data from file:', repaymentData.length, 'rows');

      if (repaymentData.length === 0) {
        toast.error('No repayment history data found in the file', { id: 'repayment-upload' });
        return;
      }

      // --- Wide-to-Long Transformation ---
      let normalizedRows = [];
      for (const row of repaymentData) {
        const applicantId = row['Applicant ID'] || row['application_id'];
        // Find all keys that match 'Repayment Number_X'
        Object.keys(row).forEach(key => {
          const match = key.match(/^Repayment Number[_ ](\d+)$/);
          if (match) {
            const repaymentNumber = parseNumericValue(match[1]);
            const delayInDays = parseNumericValue(row[key]);
            if (applicantId && repaymentNumber !== null && delayInDays !== null) {
              normalizedRows.push({
                application_id: applicantId,
                repayment_number: repaymentNumber,
                delay_in_days: delayInDays
              });
            }
          }
        });
      }
      // If no wide-format columns found, fallback to old row-wise logic
      if (normalizedRows.length === 0) {
        normalizedRows = repaymentData.map((row, index) => {
          return {
            application_id: row['Applicant ID'] || row['application_id'],
            repayment_number: parseNumericValue(row['Repayment Number'] || row['repayment_number']),
            delay_in_days: parseNumericValue(row['Delay in Days'] || row['delay_in_days'])
          };
        });
      }

      console.log('Transformed repayment history ready for processing:', normalizedRows.length);

      // Filter out records with null values
      const validRepaymentHistory = normalizedRows.filter(record => 
        record.application_id && 
        record.repayment_number !== null && 
        record.delay_in_days !== null
      );

      if (validRepaymentHistory.length === 0) {
        toast.error('No valid repayment history records found. Please check your data.', { id: 'repayment-upload' });
        return;
      }

      let results = { successful: 0, failed: 0, errors: [] as string[] };

      if (uploadMode === 'add') {
        // Add only mode - insert new records
        const { data: insertData, error: insertError } = await client
          .from('repayment_history')
          .insert(validRepaymentHistory);

        if (insertError) {
          console.error('Error inserting repayment history:', insertError);
          results.failed = validRepaymentHistory.length;
          results.errors.push(`Failed to insert repayment history: ${insertError.message}`);
        } else {
          console.log('Successfully inserted repayment history:', validRepaymentHistory.length, 'records');
          results.successful = validRepaymentHistory.length;
        }
      } else if (uploadMode === 'update') {
        // Update only mode - update existing records
        for (const record of validRepaymentHistory) {
          try {
            const { error: updateError } = await client
              .from('repayment_history')
              .update({
                repayment_number: record.repayment_number,
                delay_in_days: record.delay_in_days
              })
              .eq('application_id', record.application_id)
              .eq('repayment_number', record.repayment_number);

            if (updateError) {
              console.error('Error updating repayment history:', updateError);
              results.failed++;
              results.errors.push(`Failed to update repayment history for ${record.application_id}: ${updateError.message}`);
            } else {
              results.successful++;
            }
          } catch (error) {
            console.error('Error updating repayment history record:', error);
            results.failed++;
            results.errors.push(`Failed to update repayment history for ${record.application_id}: ${error}`);
          }
        }
      } else {
        // Mixed mode - check if record exists and insert/update accordingly
        for (const record of validRepaymentHistory) {
          try {
            // First check if the record exists
            const { data: existingRecord, error: checkError } = await client
              .from('repayment_history')
              .select('id')
              .eq('application_id', record.application_id)
              .eq('repayment_number', record.repayment_number)
              .maybeSingle();

            if (checkError) {
              console.error('Error checking existing record:', checkError);
              results.failed++;
              results.errors.push(`Failed to check existing record for ${record.application_id}: ${checkError.message}`);
              continue;
            }

            if (existingRecord) {
              // Record exists, update it
              const { error: updateError } = await client
                .from('repayment_history')
                .update({
                  delay_in_days: record.delay_in_days
                })
                .eq('id', existingRecord.id);

              if (updateError) {
                console.error('Error updating existing repayment history:', updateError);
                results.failed++;
                results.errors.push(`Failed to update repayment history for ${record.application_id}: ${updateError.message}`);
              } else {
                results.successful++;
                console.log(`Updated existing repayment history for ${record.application_id}`);
              }
            } else {
              // Record doesn't exist, insert it
              const { error: insertError } = await client
                .from('repayment_history')
                .insert(record);

              if (insertError) {
                console.error('Error inserting new repayment history:', insertError);
                results.failed++;
                results.errors.push(`Failed to insert repayment history for ${record.application_id}: ${insertError.message}`);
              } else {
                results.successful++;
                console.log(`Inserted new repayment history for ${record.application_id}`);
              }
            }
          } catch (error) {
            console.error('Error processing repayment history record:', error);
            results.failed++;
            results.errors.push(`Failed to process repayment history for ${record.application_id}: ${error}`);
          }
        }
      }

      if (results.errors.length > 0) {
        console.error('Repayment history upload errors:', results.errors);
        
        let errorMessage = `Repayment history upload completed with some issues:\n`;
        errorMessage += `✅ ${results.successful} records processed successfully\n`;
        errorMessage += `❌ ${results.failed} records failed\n`;
        errorMessage += `\nFirst few errors:\n${results.errors.slice(0, 3).join('\n')}`;
        
        toast.error(errorMessage, { 
          id: 'repayment-upload',
          duration: 10000
        });
      } else {
        let message = `🎉 Repayment history upload successful!\n`;
        message += `✅ ${results.successful} records processed`;
        
        toast.success(message, { 
          id: 'repayment-upload',
          duration: 5000
        });
      }

      onApplicationsAdded();
      onDialogClose();
    } catch (error) {
      console.error('Error processing repayment history file:', error);
      toast.error(`Failed to process repayment history file: ${error}`, { id: 'repayment-upload' });
    } finally {
      onUploadingChange(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="repayment-file-upload" className="text-sm font-medium">
        Step 2: Select Repayment History File (Excel/CSV)
      </Label>
      <Input
        id="repayment-file-upload"
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      <p className="text-xs text-gray-500">
        File should contain: Applicant ID, Repayment Number, Delay in Days
      </p>
    </div>
  );
};

export default RepaymentHistoryUploadProcessor; 