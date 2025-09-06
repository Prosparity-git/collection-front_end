
import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PlanVsAchievementDatePickerProps {
  selectedDateTime: Date | null;
  onDateTimeChange: (dateTime: Date | null) => void;
}

const PlanVsAchievementDatePicker = ({ selectedDateTime, onDateTimeChange }: PlanVsAchievementDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(selectedDateTime || undefined);
  const [selectedTime, setSelectedTime] = useState<string>(
    selectedDateTime ? format(selectedDateTime, 'HH:mm') : '10:30'
  );

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const dateTime = new Date(date);
      dateTime.setHours(hours, minutes, 0, 0);
      onDateTimeChange(dateTime);
    } else {
      onDateTimeChange(null);
    }
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      const [hours, minutes] = time.split(':').map(Number);
      const dateTime = new Date(selectedDate);
      dateTime.setHours(hours, minutes, 0, 0);
      onDateTimeChange(dateTime);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        <p className="font-medium mb-2">Plan vs Achievement Report</p>
        <p>Select the planned date and time to compare against current data. This will show applications that had PTP dates set for the selected date as of the planned time, and compare their status and PTP changes until now.</p>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Planned Date
          </label>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">
            Planned Time
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {selectedDateTime && (
          <div className="p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Selected:</strong> {format(selectedDateTime, "PPP 'at' HH:mm")}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              This will compare data as of this time vs current state
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanVsAchievementDatePicker;
