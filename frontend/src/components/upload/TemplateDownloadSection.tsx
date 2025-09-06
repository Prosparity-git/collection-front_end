import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

const TemplateDownloadSection = () => {
  const downloadFirstTimeTemplate = () => {
    const firstTimeTemplateData = [
      {
        'Applicant ID': 'PROSAPP250101000001',
        'Applicant Name': 'John Doe',
        'Branch Name': 'Mumbai Branch',
        'Team Lead': 'Team Lead Name',
        'RM Name': 'RM Name',
        'Dealer Name': 'Dealer Name',
        'Lender Name': 'Lender Name',
        'Applicant Mobile Number': '9876543210',
        'Applicant Current Address': 'Sample Address',
        'House Ownership': 'Own',
        'Co-Applicant Name': 'Co-Applicant Name',
        'Coapplicant Mobile Number': '9876543211',
        'Coapplicant Current Address': 'Co-Applicant Address',
        'Guarantor Name': 'Guarantor Name',
        'Guarantor Mobile Number': '9876543212',
        'Guarantor Current Address': 'Guarantor Address',
        'Reference Name': 'Reference Name',
        'Reference Mobile Number': '9876543213',
        'Reference Address': 'Reference Address',
        'FI Submission Location': 'Field Investigation Location',
        'Demand Date': '2024-05-01',
        'Disbursement Date': '2024-01-10',
        'Loan Amount': 500000,
        'Vehicle Status': 'Risky',
        'Repayment': 'Monthly',
        'Principle Due': 45000,
        'Interest Due': 2500,
        'EMI': 5000,
        'Last Month Bounce': 0,
        'Collection RM': 'Collection RM Name',
        'LMS Status': 'Unpaid',
        'Status': 'Unpaid'
      }
    ];

    const workbook = XLSX.utils.book_new();
    
    // Add Applications sheet
    const applicationsWorksheet = XLSX.utils.json_to_sheet(firstTimeTemplateData);
    const applicationColWidths = [
      { wch: 20 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 25 },
      { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 25 },
      { wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 12 },
      { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 20 },
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];
    applicationsWorksheet['!cols'] = applicationColWidths;
    XLSX.utils.book_append_sheet(workbook, applicationsWorksheet, 'Applications');

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `first-time-upload-template-${timestamp}.xlsx`;
    XLSX.writeFile(workbook, filename);
    
    toast.success('First-time upload template downloaded!');
  };

  const downloadMonthlyTemplate = () => {
    const monthlyTemplateData = [
      {
        'Applicant ID': 'PROSAPP250101000001',
        'Demand Date': '2024-05-01',
        'Team Lead': 'Team Lead Name',
        'RM Name': 'RM Name',
        'Repayment': 'Monthly',
        'EMI': 5000,
        'Last Month Bounce': 0,
        'LMS Status': 'Unpaid',
        'Collection RM': 'Collection RM Name'
      }
    ];

    const workbook = XLSX.utils.book_new();
    
    // Add Collection sheet
    const collectionWorksheet = XLSX.utils.json_to_sheet(monthlyTemplateData);
    const collectionColWidths = [
      { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
    ];
    collectionWorksheet['!cols'] = collectionColWidths;
    XLSX.utils.book_append_sheet(workbook, collectionWorksheet, 'Collection');

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `monthly-update-template-${timestamp}.xlsx`;
    XLSX.writeFile(workbook, filename);
    
    toast.success('Monthly update template downloaded!');
  };

  return (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="mb-4">
        <h4 className="font-medium text-blue-900">Step 1: Download Template</h4>
        <p className="text-sm text-blue-700 mt-1">
          Choose the appropriate template based on your upload type
        </p>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-white rounded border">
          <div>
            <h5 className="font-medium text-gray-900">First-time Upload Template</h5>
            <p className="text-xs text-gray-600 mt-1">
              For new applications. Includes all columns (static + monthly data).
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={downloadFirstTimeTemplate}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>

        <div className="flex items-center justify-between p-3 bg-white rounded border">
          <div>
            <h5 className="font-medium text-gray-900">Monthly Update Template</h5>
            <p className="text-xs text-gray-600 mt-1">
              For existing applications. Only monthly columns required.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={downloadMonthlyTemplate}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TemplateDownloadSection;
