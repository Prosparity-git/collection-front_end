
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface UserSearchFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

const UserSearchFilter = ({ searchTerm, onSearchChange }: UserSearchFilterProps) => {
  return (
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        placeholder="Search by email or name..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10"
      />
    </div>
  );
};

export default UserSearchFilter;
