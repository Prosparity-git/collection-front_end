
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PlanVsAchievementDatePicker from "@/components/exports/PlanVsAchievementDatePicker";

interface ExportDialogProps {
  onExportFull: () => void;
  onExportPtpComments: () => void;
  onExportPlanVsAchievement: (plannedDateTime: Date) => void;
}

type ExportType = 'full' | 'ptp-comments' | 'plan-vs-achievement';

const ExportDialog = ({ onExportFull, onExportPtpComments, onExportPlanVsAchievement }: ExportDialogProps) => {
  const [selectedType, setSelectedType] = useState<ExportType>('ptp-comments');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);

  const handleExport = () => {
    if (selectedType === 'full') {
      onExportFull();
      setIsOpen(false);
    } else if (selectedType === 'ptp-comments') {
      onExportPtpComments();
      setIsOpen(false);
    } else if (selectedType === 'plan-vs-achievement') {
      if (selectedDateTime) {
        onExportPlanVsAchievement(selectedDateTime);
        setIsOpen(false);
      }
    }
  };

  const canExport = selectedType !== 'plan-vs-achievement' || selectedDateTime !== null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          <Download className="h-3 w-3 mr-1" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={selectedType} onValueChange={(value) => setSelectedType(value as ExportType)}>
            <Card className={`cursor-pointer transition-colors ${selectedType === 'ptp-comments' ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ptp-comments" id="ptp-comments" />
                  <Label htmlFor="ptp-comments" className="cursor-pointer">
                    <CardTitle className="text-sm">PTP + Comments Report</CardTitle>
                  </Label>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  Simplified report with: Applicant ID, Branch Name, RM Name, Dealer Name, Applicant Name, PTP Date, and Comment Trail
                </CardDescription>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-colors ${selectedType === 'plan-vs-achievement' ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="plan-vs-achievement" id="plan-vs-achievement" />
                  <Label htmlFor="plan-vs-achievement" className="cursor-pointer">
                    <CardTitle className="text-sm">Plan vs Achievement Report</CardTitle>
                  </Label>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  Compare planned follow-ups (PTP dates set for a specific date/time) vs actual achievements including status and comment changes
                </CardDescription>
              </CardContent>
            </Card>

            <Card className={`cursor-pointer transition-colors ${selectedType === 'full' ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="cursor-pointer">
                    <CardTitle className="text-sm">Full Report</CardTitle>
                  </Label>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-xs">
                  Complete report with all available fields including contact details, financial information, and status
                </CardDescription>
              </CardContent>
            </Card>
          </RadioGroup>

          {selectedType === 'plan-vs-achievement' && (
            <PlanVsAchievementDatePicker
              selectedDateTime={selectedDateTime}
              onDateTimeChange={setSelectedDateTime}
            />
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)} size="sm">
              Cancel
            </Button>
            <Button onClick={handleExport} size="sm" disabled={!canExport}>
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
