
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  resultCount?: number;
}

const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = "Search by application name or ID...", 
  loading = false,
  resultCount
}: SearchBarProps) => {
  const [inputValue, setInputValue] = useState(value);

  // Sync internal state if external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleSearch = () => {
    onChange(inputValue);
  };

  const handleClear = () => {
    setInputValue('');
    onChange(''); // Immediately clear the search
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex w-full items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10 h-10 text-sm w-full"
            disabled={loading}
          />
          {inputValue && !loading && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 text-gray-500 hover:text-gray-900"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
        <Button onClick={handleSearch} className="h-10" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Search
        </Button>
      </div>
      
      {/* Search results info */}
      {value && resultCount !== undefined && !loading && (
        <div className="text-xs text-gray-500 px-1">
          {resultCount === 0 
            ? `No results found for "${value}"` 
            : resultCount === 1 
              ? `1 result found for "${value}"`
              : `${resultCount.toLocaleString()} results found for "${value}"`
          }
        </div>
      )}
    </div>
  );
};

export default SearchBar;
