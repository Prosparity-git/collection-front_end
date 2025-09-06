
import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
}

const MultiSelectFilter = ({ 
  label, 
  options = [], 
  selected = [], 
  onSelectionChange,
  placeholder = "Select options..."
}: MultiSelectFilterProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Ensure we have completely clean arrays with no undefined, null, or empty values
  const safeOptions = Array.isArray(options) 
    ? options.filter((item): item is string => 
        typeof item === 'string' && 
        item !== null && 
        item !== undefined && 
        item.trim().length > 0
      )
    : [];

  const safeSelected = Array.isArray(selected) 
    ? selected.filter((item): item is string => 
        typeof item === 'string' && 
        item !== null && 
        item !== undefined && 
        item.trim().length > 0
      )
    : [];

  // Filter options based on search term with extra safety
  const filteredOptions = safeOptions.filter((option) => {
    if (!searchTerm || searchTerm.trim() === '') return true;
    try {
      return option.toLowerCase().includes(searchTerm.toLowerCase());
    } catch (error) {
      console.error('Error filtering option:', option, error);
      return false;
    }
  });

  // Additional safety check - ensure filteredOptions is always a valid array
  const validFilteredOptions = Array.isArray(filteredOptions) ? filteredOptions : [];

  const toggleOption = (option: string) => {
    if (!option || typeof option !== 'string' || option.trim() === '') return;
    
    try {
      const newSelected = safeSelected.includes(option)
        ? safeSelected.filter(item => item !== option)
        : [...safeSelected, option];
      onSelectionChange(newSelected);
    } catch (error) {
      console.error('Error toggling option:', option, error);
    }
  };

  const clearAll = () => {
    try {
      onSelectionChange([]);
    } catch (error) {
      console.error('Error clearing all:', error);
    }
  };

  const handleSearchChange = (value: string) => {
    try {
      setSearchTerm(value || "");
    } catch (error) {
      console.error('Error setting search term:', error);
      setSearchTerm("");
    }
  };

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [open]);

  // Reset search when popover closes
  useEffect(() => {
    if (!open) {
      setSearchTerm("");
    }
  }, [open]);

  return (
    <div className="relative" ref={popoverRef}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full sm:w-auto justify-between min-w-[200px] text-left font-normal"
          >
            <span className="truncate">
              {safeSelected.length === 0 
                ? label 
                : safeSelected.length === 1
                ? safeSelected[0]
                : `${safeSelected.length} selected`
              }
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 z-50" align="start">
          {/* Only render Command if we have valid data */}
          {validFilteredOptions !== null && Array.isArray(validFilteredOptions) ? (
            <Command shouldFilter={false}>
              <CommandInput 
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchTerm || ""}
                onValueChange={handleSearchChange}
              />
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {safeSelected.length > 0 && (
                  <div className="p-2 border-b">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Clear All ({safeSelected.length})
                    </Button>
                  </div>
                )}
                {validFilteredOptions.length > 0 ? (
                  validFilteredOptions.map((option, index) => {
                    // Ensure option is valid before rendering
                    if (!option || typeof option !== 'string') {
                      return null;
                    }
                    
                    return (
                      <CommandItem
                        key={`${option}-${index}`}
                        onSelect={() => toggleOption(option)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center space-x-2 w-full">
                          <div className={`w-4 h-4 border rounded flex items-center justify-center ${
                            safeSelected.includes(option) 
                              ? 'bg-blue-600 border-blue-600' 
                              : 'border-gray-300'
                          }`}>
                            {safeSelected.includes(option) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className="flex-1 truncate">{option}</span>
                        </div>
                      </CommandItem>
                    );
                  })
                ) : (
                  <div className="p-2 text-sm text-gray-500 text-center">
                    {searchTerm ? 'No matching options' : 'No options available'}
                  </div>
                )}
              </CommandGroup>
            </Command>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Loading options...
            </div>
          )}
        </PopoverContent>
      </Popover>
      {safeSelected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {safeSelected.slice(0, 3).map((item, index) => {
            // Safety check for badge items too
            if (!item || typeof item !== 'string') {
              return null;
            }
            
            return (
              <Badge key={`badge-${item}-${index}`} variant="secondary" className="text-xs">
                {item}
              </Badge>
            );
          })}
          {safeSelected.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{safeSelected.length - 3} more
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectFilter;
