
import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface CustomMultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  formatDisplay?: (value: string) => string;
}

const CustomMultiSelectFilter = ({ 
  label, 
  options = [], 
  selected = [], 
  onSelectionChange,
  placeholder = "Select options...",
  formatDisplay
}: CustomMultiSelectFilterProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debug logging for options
  useEffect(() => {
    console.log(`🔍 CustomMultiSelectFilter [${label}]: Received options:`, options);
    console.log(`🔍 CustomMultiSelectFilter [${label}]: Options length:`, options?.length);
    console.log(`🔍 CustomMultiSelectFilter [${label}]: Selected values:`, selected);
  }, [options, selected, label]);

  // Clean and filter options
  const safeOptions = options.filter(option => 
    option && typeof option === 'string' && option.trim().length > 0
  );

  const safeSelected = selected.filter(item => 
    item && typeof item === 'string' && item.trim().length > 0
  );

  // Filter options based on search term
  const filteredOptions = safeOptions.filter(option => {
    const displayValue = formatDisplay ? formatDisplay(option) : option;
    return displayValue.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const toggleOption = (option: string) => {
    if (!option) return;
    
    console.log('=== TOGGLE OPTION ===');
    console.log('Option:', option);
    console.log('Current selected:', safeSelected);
    
    const newSelected = safeSelected.includes(option)
      ? safeSelected.filter(item => item !== option)
      : [...safeSelected, option];
    
    console.log('New selected:', newSelected);
    onSelectionChange(newSelected);
  };

  const clearAll = () => {
    console.log('=== CLEAR ALL FILTERS ===');
    console.log('Label:', label);
    onSelectionChange([]);
  };

  const selectAll = () => {
    console.log('=== SELECT ALL FILTERS ===');
    console.log('Label:', label);
    console.log('All options:', filteredOptions);
    onSelectionChange(filteredOptions);
  };

  const removeItem = (item: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    console.log('=== REMOVE ITEM ===');
    console.log('Item:', item);
    console.log('Label:', label);
    console.log('Current selected prop:', selected);
    console.log('Current safeSelected:', safeSelected);
    
    // Use the original selected prop to ensure we're working with the latest data
    const newSelected = selected.filter(selectedItem => selectedItem !== item);
    console.log('New selected after removal:', newSelected);
    
    onSelectionChange(newSelected);
  };

  // Focus search input when opened
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  // Reset search when closed
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between h-auto min-h-[40px] text-left font-normal p-3 relative hover:bg-blue-50 transition-colors"
          >
            <div className="flex flex-wrap gap-1 items-center min-h-[20px] flex-1">
              {safeSelected.length === 0 ? (
                <span className="text-muted-foreground">{label}</span>
              ) : (
                <>
                  {safeSelected.slice(0, 2).map((item) => (
                    <Badge 
                      key={item} 
                      variant="secondary" 
                      className="text-xs h-6 px-2 bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                    >
                      {formatDisplay ? formatDisplay(item) : item}
                      <button
                        type="button"
                        className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500 transition-colors flex items-center justify-center"
                        onClick={(e) => {
                          console.log('X button clicked for item:', item);
                          removeItem(item, e);
                        }}
                        onMouseDown={(e) => {
                          console.log('X button mousedown for item:', item);
                          e.stopPropagation();
                        }}
                        aria-label={`Remove ${item}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {safeSelected.length > 2 && (
                    <Badge variant="secondary" className="text-xs h-6 px-2 bg-blue-100 text-blue-800">
                      +{safeSelected.length - 2} more
                    </Badge>
                  )}
                </>
              )}
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full min-w-[280px] p-0" align="start">
          <div className="p-3 border-b">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            <div className="p-2 border-b space-y-1 bg-gray-50">
              {filteredOptions.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 justify-start"
                >
                  Select All ({filteredOptions.length})
                </Button>
              )}
              {safeSelected.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 justify-start"
                >
                  Clear All ({safeSelected.length})
                </Button>
              )}
            </div>
            
            {filteredOptions.length > 0 ? (
              <div className="p-1">
                {filteredOptions.map((option) => {
                  const displayValue = formatDisplay ? formatDisplay(option) : option;
                  return (
                    <div
                      key={option}
                      onClick={() => toggleOption(option)}
                      className="flex items-center space-x-2 px-3 py-2 cursor-pointer hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${
                        safeSelected.includes(option) 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'border-gray-300 hover:border-blue-400'
                      }`}>
                        {safeSelected.includes(option) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <span className="flex-1 text-sm">{displayValue}</span>
                      {safeSelected.includes(option) && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          Selected
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">
                {searchTerm ? 'No matching options' : 'No options available'}
              </div>
            )}
          </div>
          
          {safeSelected.length > 0 && (
            <div className="p-2 border-t bg-blue-50">
              <div className="text-xs text-blue-700 text-center font-medium">
                {safeSelected.length} item{safeSelected.length !== 1 ? 's' : ''} selected
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CustomMultiSelectFilter;
