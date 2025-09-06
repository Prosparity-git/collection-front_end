
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { client } from "@/integrations/api/client";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import UserSearchFilter from "@/components/user/UserSearchFilter";
import UserRoleManagementTable from "@/components/user/UserRoleManagementTable";

interface UserWithRole {
  id: string;
  email: string;
  full_name?: string;
  role?: 'admin' | 'user';
  role_created_at?: string;
}

const UserRoleManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await client
        .from('profiles')
        .select('id, email, full_name')
        .order('email');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        toast.error('Failed to fetch users');
        return;
      }

      if (!profiles) {
        setUsers([]);
        return;
      }

      const { data: userRoles, error: rolesError } = await client
        .from('user_roles')
        .select('user_id, role, created_at');

      if (rolesError) {
        console.error('Error fetching user roles:', rolesError);
        toast.error('Failed to fetch user roles');
        return;
      }

      const usersWithRoles = profiles.map(profile => {
        const userRole = userRoles?.find(role => role.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email || '',
          full_name: profile.full_name,
          role: userRole?.role || 'user',
          role_created_at: userRole?.created_at
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const { error } = await client
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole
        });

      if (error) {
        console.error('Error updating role:', error);
        toast.error('Failed to update user role');
        return;
      }

      toast.success(`User role updated to ${newRole}`);
      await fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleRemoveRole = async (userId: string) => {
    try {
      const { error } = await client
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing role:', error);
        toast.error('Failed to remove user role');
        return;
      }

      toast.success('User role removed');
      await fetchUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Failed to remove user role');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchEmail.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            User Role Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <UserSearchFilter 
              searchTerm={searchEmail}
              onSearchChange={setSearchEmail}
            />
          </div>

          <UserRoleManagementTable 
            users={filteredUsers}
            onRoleChange={handleRoleChange}
            onRemoveRole={handleRemoveRole}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default UserRoleManagement;
