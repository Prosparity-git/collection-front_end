
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { client } from '@/integrations/api/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ExcelUserData {
  'Email (User ID)': string;
  'Full Name': string;
  'Password': string;
  'Role'?: string;
}

interface UserUploadProcessorProps {
  defaultRole: 'admin' | 'user';
  onUsersAdded: () => void;
  onDialogClose: () => void;
}

const UserUploadProcessor = ({ defaultRole, onUsersAdded, onDialogClose }: UserUploadProcessorProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        setSelectedFile(file);
      } else {
        toast.error('Please select an Excel file (.xlsx or .xls)');
        e.target.value = '';
      }
    }
  };

  const handleExcelUpload = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    try {
      const fileBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelUserData[];

      console.log('Parsed Excel data:', jsonData);

      if (jsonData.length === 0) {
        toast.error('No data found in Excel file');
        return;
      }

      const requiredColumns = ['Email (User ID)', 'Full Name', 'Password'];
      const firstRow = jsonData[0];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        toast.error(`Missing required columns: ${missingColumns.join(', ')}`);
        return;
      }

      const users = jsonData.map(row => ({
        email: String(row['Email (User ID)']).trim(),
        fullName: String(row['Full Name']).trim(),
        password: String(row['Password']).trim(),
        role: row['Role'] ? String(row['Role']).toLowerCase() : defaultRole
      }));

      console.log('Calling Edge Function with users:', users.length);

      const { data, error } = await client.functions.invoke('create-bulk-users', {
        body: { users }
      });

      if (error) {
        console.error('Edge Function error:', error);
        toast.error('Failed to process users. Please try again.');
        return;
      }

      const results = data as {
        successful: number;
        failed: number;
        errors: string[];
      };

      if (results.successful > 0) {
        toast.success(`Successfully created/updated ${results.successful} users with roles!`);
      }
      
      if (results.failed > 0) {
        toast.error(`Failed to process ${results.failed} users. Check console for details.`);
        console.log('Failed user processing details:', results.errors);
      }

      if (results.successful > 0) {
        onUsersAdded();
      }

      setSelectedFile(null);
      onDialogClose();
    } catch (error) {
      console.error('Excel processing error:', error);
      toast.error('Failed to process Excel file. Please check the format.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Step 2: Upload Your File</h4>
        <Label htmlFor="excel-file">Select Excel File</Label>
        <Input
          id="excel-file"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="mt-1"
        />
        <p className="text-sm text-gray-500 mt-2">
          Supported formats: .xlsx, .xls
        </p>
      </div>
      
      {selectedFile && (
        <div className="p-3 bg-green-50 rounded-md border border-green-200">
          <p className="text-sm font-medium text-green-800">Selected file: {selectedFile.name}</p>
          <p className="text-xs text-green-600">Size: {(selectedFile.size / 1024).toFixed(1)} KB</p>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button 
          variant="outline"
          onClick={onDialogClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleExcelUpload}
          disabled={!selectedFile || loading}
        >
          {loading ? 'Processing...' : 'Upload Users'}
        </Button>
      </div>
    </div>
  );
};

export default UserUploadProcessor;
