import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type UploadType = 'applications' | 'repayment_history';

interface UploadTypeSelectorProps {
  uploadType: UploadType;
  onTypeChange: (type: UploadType) => void;
}

const UploadTypeSelector = ({ uploadType, onTypeChange }: UploadTypeSelectorProps) => {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Upload Type</Label>
      <RadioGroup value={uploadType} onValueChange={(value: UploadType) => onTypeChange(value)}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="applications" id="applications" />
          <Label htmlFor="applications" className="text-sm">
            <strong>Applications</strong> - Upload application data with all fields
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="repayment_history" id="repayment_history" />
          <Label htmlFor="repayment_history" className="text-sm">
            <strong>Repayment History</strong> - Upload repayment history data only
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default UploadTypeSelector; 