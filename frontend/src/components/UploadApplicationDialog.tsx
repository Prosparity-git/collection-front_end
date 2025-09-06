import { useState } from 'react';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import UploadTypeSelector, { UploadType } from './upload/UploadTypeSelector';
import UploadModeSelector, { UploadMode } from './upload/UploadModeSelector';
import TemplateDownloadSection from './upload/TemplateDownloadSection';
import RepaymentHistoryTemplateDownload from './upload/RepaymentHistoryTemplateDownload';
import FileUploadProcessor from './upload/FileUploadProcessor';
import RepaymentHistoryUploadProcessor from './upload/RepaymentHistoryUploadProcessor';

interface UploadApplicationDialogProps {
  onApplicationsAdded: () => void;
}

const UploadApplicationDialog = ({ onApplicationsAdded }: UploadApplicationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<UploadType>('applications');
  const [uploadMode, setUploadMode] = useState<UploadMode>('mixed');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Upload Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload Data
          </DialogTitle>
          <DialogDescription>
            Upload Excel/CSV files containing application data or repayment history. Choose your upload type and mode, then download the appropriate template.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <UploadTypeSelector 
            uploadType={uploadType}
            onTypeChange={setUploadType}
          />

          <UploadModeSelector 
            uploadMode={uploadMode}
            onModeChange={setUploadMode}
          />

          {uploadType === 'applications' ? (
            <TemplateDownloadSection />
          ) : (
            <RepaymentHistoryTemplateDownload />
          )}

          {uploadType === 'applications' ? (
            <FileUploadProcessor
              uploadMode={uploadMode}
              uploading={uploading}
              onUploadingChange={setUploading}
              onApplicationsAdded={onApplicationsAdded}
              onDialogClose={() => setOpen(false)}
            />
          ) : (
            <RepaymentHistoryUploadProcessor
              uploadMode={uploadMode}
              uploading={uploading}
              onUploadingChange={setUploading}
              onApplicationsAdded={onApplicationsAdded}
              onDialogClose={() => setOpen(false)}
            />
          )}
          
          <div className="text-xs text-gray-500">
            <p>Supported formats: Excel (.xlsx, .xls) and CSV (.csv)</p>
            {uploadType === 'applications' ? (
              <>
                <p><strong>Applications:</strong> Upload application data with all fields</p>
                <p><strong>Status Values:</strong> Unpaid, Partially Paid, Cash Collected from Customer, Customer Deposited to Bank, Paid</p>
                <p><strong>Note:</strong> Invalid status values will default to 'Unpaid'</p>
              </>
            ) : (
              <>
                <p><strong>Repayment History:</strong> Upload repayment history data only</p>
                <p><strong>Required Fields:</strong> Applicant ID, Repayment Number, Delay in Days</p>
                <p><strong>Note:</strong> All fields are required for valid records</p>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadApplicationDialog;
