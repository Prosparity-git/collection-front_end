
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import UserRoleSelector from "./UserRoleSelector";

interface UserWithRole {
  id: string;
  email: string;
  full_name?: string;
  role?: 'admin' | 'user';
  role_created_at?: string;
}

interface UserRoleManagementTableProps {
  users: UserWithRole[];
  onRoleChange: (userId: string, newRole: 'admin' | 'user') => void;
  onRemoveRole: (userId: string) => void;
}

const UserRoleManagementTable = ({ users, onRoleChange, onRemoveRole }: UserRoleManagementTableProps) => {
  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No users found matching your search criteria
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Current Role</TableHead>
            <TableHead>Role Assigned</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="font-medium">
                  {user.full_name || 'No name set'}
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <UserRoleSelector
                  currentRole={user.role || 'user'}
                  onRoleChange={(newRole) => onRoleChange(user.id, newRole)}
                />
              </TableCell>
              <TableCell>
                {user.role_created_at ? (
                  <span className="text-sm text-gray-600">
                    {format(new Date(user.role_created_at), 'dd-MMM-yyyy')}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">Default</span>
                )}
              </TableCell>
              <TableCell>
                {user.role_created_at && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveRole(user.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserRoleManagementTable;
