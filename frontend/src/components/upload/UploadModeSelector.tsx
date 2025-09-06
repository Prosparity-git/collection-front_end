
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export type UploadMode = 'add' | 'update' | 'mixed';

interface UploadModeSelectorProps {
  uploadMode: UploadMode;
  onModeChange: (mode: UploadMode) => void;
}

const UploadModeSelector = ({ uploadMode, onModeChange }: UploadModeSelectorProps) => {
  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Upload Mode</Label>
      <RadioGroup value={uploadMode} onValueChange={(value: UploadMode) => onModeChange(value)}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="mixed" id="mixed" />
          <Label htmlFor="mixed" className="text-sm">
            <strong>Smart Mode</strong> - Automatically add new or update existing (Recommended)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="add" id="add" />
          <Label htmlFor="add" className="text-sm">
            <strong>Add Only</strong> - Only create new applications
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="update" id="update" />
          <Label htmlFor="update" className="text-sm">
            <strong>Update Only</strong> - Only update existing applications
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default UploadModeSelector;
