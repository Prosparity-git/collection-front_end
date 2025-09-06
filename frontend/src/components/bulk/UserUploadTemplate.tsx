
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

const UserUploadTemplate = () => {
  const downloadTemplate = () => {
    const templateData = [
      {
        'Email (User ID)': 'user@example.com',
        'Full Name': 'John Doe',
        'Password': 'SecurePassword123',
        'Role': 'user'
      }
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    const colWidths = [
      { wch: 25 },
      { wch: 20 },
      { wch: 15 },
      { wch: 10 }
    ];
    
    worksheet['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(workbook, worksheet, 'User Template');

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `user-bulk-upload-template-${timestamp}.xlsx`;
    XLSX.writeFile(workbook, filename);
    
    toast.success('Template downloaded successfully!');
  };

  return (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-blue-900">Step 1: Download Template</h4>
          <p className="text-sm text-blue-700 mt-1">
            Download the Excel template with Role column for user management
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={downloadTemplate}
          className="border-blue-300 text-blue-700 hover:bg-blue-100"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>
    </div>
  );
};

export default UserUploadTemplate;
