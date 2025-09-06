import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
import { processBulkApplications } from '@/utils/bulkOperations';
import { useAuth } from '@/hooks/useAuth';
import { UploadMode } from './UploadModeSelector';
import { client } from '@/integrations/api/client';

interface FileUploadProcessorProps {
  uploadMode: UploadMode;
  uploading: boolean;
  onUploadingChange: (uploading: boolean) => void;
  onApplicationsAdded: () => void;
  onDialogClose: () => void;
}

const FileUploadProcessor = ({ 
  uploadMode, 
  uploading, 
  onUploadingChange, 
  onApplicationsAdded,
  onDialogClose 
}: FileUploadProcessorProps) => {
  const { user } = useAuth();

  const parseNumericValue = (value: any): number | null => {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    onUploadingChange(true);
    toast.loading('Processing file...', { id: 'upload' });

    try {
      console.log('Starting file upload process with mode:', uploadMode);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Process Applications sheet
      const applicationsWorksheet = workbook.Sheets[workbook.SheetNames[0]];
      const applicationsData = XLSX.utils.sheet_to_json(applicationsWorksheet);

      console.log('Parsed applications data from file:', applicationsData.length, 'rows');

      if (applicationsData.length === 0) {
        toast.error('No application data found in the file', { id: 'upload' });
        return;
      }

      const applications = applicationsData.map((row: any, index: number) => {
        console.log(`Transforming application row ${index + 1}:`, row);
        return {
          applicant_id: row['Applicant ID'] || row['applicant_id'],
          applicant_name: row['Applicant Name'] || row['applicant_name'],
          branch_name: row['Branch Name'] || row['branch_name'],
          team_lead: row['Team Lead'] || row['team_lead'],
          rm_name: row['RM Name'] || row['rm_name'],
          dealer_name: row['Dealer Name'] || row['dealer_name'],
          lender_name: row['Lender Name'] || row['lender_name'],
          lms_status: row['LMS Status'] || row['lms_status'] || 'Unpaid',
          emi_amount: parseNumericValue(row['EMI'] || row['EMI Amount'] || row['emi_amount']),
          principle_due: parseNumericValue(row['Principle Due'] || row['principle_due']),
          interest_due: parseNumericValue(row['Interest Due'] || row['interest_due']),
          demand_date: row['Demand Date'] || row['demand_date'],
          disbursement_date: row['Disbursement Date'] || row['disbursement_date'],
          loan_amount: parseNumericValue(row['Loan Amount'] || row['loan_amount']),
          vehicle_status: row['Vehicle Status'] || row['vehicle_status'],
          user_id: user.id,
          applicant_mobile: row['Applicant Mobile Number'] || row['applicant_mobile'],
          applicant_address: row['Applicant Current Address'] || row['applicant_address'],
          house_ownership: row['House Ownership'] || row['house_ownership'],
          co_applicant_name: row['Co-Applicant Name'] || row['co_applicant_name'],
          co_applicant_mobile: row['Coapplicant Mobile Number'] || row['co_applicant_mobile'],
          co_applicant_address: row['Coapplicant Current Address'] || row['co_applicant_address'],
          guarantor_name: row['Guarantor Name'] || row['guarantor_name'],
          guarantor_mobile: row['Guarantor Mobile Number'] || row['guarantor_mobile'],
          guarantor_address: row['Guarantor Current Address'] || row['guarantor_address'],
          reference_name: row['Reference Name'] || row['reference_name'],
          reference_mobile: row['Reference Mobile Number'] || row['reference_mobile'],
          reference_address: row['Reference Address'] || row['reference_address'],
          fi_location: row['FI Submission Location'] || row['fi_location'],
          repayment: row['Repayment'] || row['repayment'],
          last_month_bounce: parseNumericValue(row['Last Month Bounce'] || row['last_month_bounce']),
          collection_rm: row['Collection RM'] || row['collection_rm'],
          status: row['Status'] || row['status'],
          uploadMode
        };
      });

      console.log('Transformed applications ready for processing:', applications.length);

      const results = await processBulkApplications(applications, user);
      console.log('Bulk processing results:', results);

      if (results.errors.length > 0) {
        console.error('Upload errors:', results.errors);
        
        let errorMessage = `Upload completed with some issues:\n`;
        errorMessage += `✅ ${results.successful} new applications added\n`;
        errorMessage += `✅ ${results.updated} applications updated\n`;
        if (results.statusUpdated > 0) {
          errorMessage += `✅ ${results.statusUpdated} statuses updated\n`;
        }
        errorMessage += `❌ ${results.failed} applications failed\n`;
        errorMessage += `\nFirst few errors:\n${results.errors.slice(0, 3).join('\n')}`;
        
        toast.error(errorMessage, { 
          id: 'upload',
          duration: 10000
        });
      } else {
        let message = `🎉 Upload successful!\n`;
        message += `✅ ${results.successful} new applications added\n`;
        message += `✅ ${results.updated} applications updated`;
        if (results.statusUpdated > 0) {
          message += `\n✅ ${results.statusUpdated} statuses updated`;
        }
        
        toast.success(message, { 
          id: 'upload',
          duration: 5000
        });
      }

      onApplicationsAdded();
      onDialogClose();
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error(`Failed to process file: ${error}`, { id: 'upload' });
    } finally {
      onUploadingChange(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="p-2 mb-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
        <b>Upload Instructions:</b><br />
        <ul className="list-disc ml-4">
          <li><b>First-time upload:</b> Fills both <code>applications</code> and <code>collection</code> tables. <b>All columns</b> required (static + monthly).</li>
          <li><b>Monthly update:</b> Fills only <code>collection</code> table. <b>Only monthly columns</b> required (team_lead, rm_name, demand_date, repayment, emi_amount, last_month_bounce, lms_status, collection_rm).</li>
        </ul>
        <div className="mt-1"><b>Note:</b> <code>demand_date</code> is required and must be a text value (e.g., <code>2024-05-01</code>).</div>
      </div>
      <Label htmlFor="file-upload" className="text-sm font-medium">
        Step 2: Select File (Excel/CSV)
      </Label>
      <Input
        id="file-upload"
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileUpload}
        disabled={uploading}
      />
    </div>
  );
};

export default FileUploadProcessor;
