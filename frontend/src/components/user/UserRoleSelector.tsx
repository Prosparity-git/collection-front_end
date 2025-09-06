
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface UserRoleSelectorProps {
  currentRole: 'admin' | 'user';
  onRoleChange: (newRole: 'admin' | 'user') => void;
  disabled?: boolean;
}

const UserRoleSelector = ({ currentRole, onRoleChange, disabled }: UserRoleSelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <Badge variant={currentRole === 'admin' ? 'default' : 'secondary'}>
        {currentRole}
      </Badge>
      <Select
        value={currentRole}
        onValueChange={(newRole: 'admin' | 'user') => onRoleChange(newRole)}
        disabled={disabled}
      >
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="user">User</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserRoleSelector;
