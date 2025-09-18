import { useState } from "react";
import { Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportService } from "@/integrations/api/services/exportService";
import { toast } from "sonner";

interface CollectionExportDialogProps {
  onExportComplete?: () => void;
}

const CollectionExportDialog = ({ onExportComplete }: CollectionExportDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);

  // Generate month options (1-12)
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: (i + 1).toString(),
    label: new Date(2024, i, 1).toLocaleString('default', { month: 'long' })
  }));

  // Generate year options (current year and previous 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString()
  }));

  const handleExport = async () => {
    if (!selectedMonth || !selectedYear) {
      toast.error("Please select both month and year");
      return;
    }

    setIsExporting(true);
    try {
      await ExportService.exportAndDownload({
        demand_month: parseInt(selectedMonth),
        demand_year: parseInt(selectedYear),
        format: 'excel'
      });
      
      toast.success("Export completed successfully!");
      setIsOpen(false);
      onExportComplete?.();
    } catch (error) {
      console.error('Export failed:', error);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const canExport = selectedMonth && selectedYear && !isExporting;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          <Download className="h-3 w-3 mr-1" />
          Export Collection Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Export Collection Data
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Collection Data Export</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-xs mb-4">
                Export collection data including applicant details, payment information, 
                collection status, and recent comments for the selected month and year.
              </CardDescription>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="month-select">Select Month</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger id="month-select">
                      <SelectValue placeholder="Choose month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year-select">Select Year</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger id="year-select">
                      <SelectValue placeholder="Choose year" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)} 
              size="sm"
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              size="sm" 
              disabled={!canExport}
              className="min-w-[100px]"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-3 w-3 mr-1" />
                  Export Excel
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CollectionExportDialog;
