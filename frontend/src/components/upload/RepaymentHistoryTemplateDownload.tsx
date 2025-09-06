import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

const RepaymentHistoryTemplateDownload = () => {
  const downloadTemplate = () => {
    const repaymentHistoryTemplateData = [
      {
        'Applicant ID': 'PROSAPP250101000001',
        'Repayment Number': 1,
        'Delay in Days': 4
      },
      {
        'Applicant ID': 'PROSAPP250101000001',
        'Repayment Number': 2,
        'Delay in Days': 0
      },
      {
        'Applicant ID': 'PROSAPP250101000001',
        'Repayment Number': 3,
        'Delay in Days': 20
      },
      {
        'Applicant ID': 'PROSAPP250101000002',
        'Repayment Number': 1,
        'Delay in Days': 15
      }
    ];

    const workbook = XLSX.utils.book_new();
    
    // Add Repayment History sheet
    const repaymentWorksheet = XLSX.utils.json_to_sheet(repaymentHistoryTemplateData);
    const repaymentColWidths = [
      { wch: 20 }, { wch: 15 }, { wch: 15 }
    ];
    repaymentWorksheet['!cols'] = repaymentColWidths;
    XLSX.utils.book_append_sheet(workbook, repaymentWorksheet, 'Repayment History');

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `repayment-history-upload-template-${timestamp}.xlsx`;
    XLSX.writeFile(workbook, filename);
    
    toast.success('Repayment history template downloaded successfully!');
  };

  return (
    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-green-900">Step 1: Download Repayment History Template</h4>
          <p className="text-sm text-green-700 mt-1">
            Download the Excel template for repayment history data
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={downloadTemplate}
          className="border-green-300 text-green-700 hover:bg-green-100"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>
    </div>
  );
};

export default RepaymentHistoryTemplateDownload; 