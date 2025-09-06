
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export const useUserRoles = () => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkIsAdmin = async (userId?: string) => {
    // Dev mode: always admin
    return !!userId;
  };

  const fetchUserRoles = async () => {
    // Dev mode: stub roles list with a single admin role for current user
    if (!user) return;
    setUserRoles([{ id: 'role-1', user_id: user.id, role: 'admin', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]);
  };

  const assignRole = async (userId: string, role: 'admin' | 'user') => {
    // Dev mode: no-op but update local state
    setUserRoles(prev => {
      const now = new Date().toISOString();
      const others = prev.filter(r => r.user_id !== userId);
      return [...others, { id: `role-${userId}`, user_id: userId, role, created_at: now, updated_at: now }];
    });
  };

  useEffect(() => {
    const initializeRoles = async () => {
      setLoading(true);
      
      if (user) {
        // Dev mode: always admin with a prefilled role list
        setIsAdmin(true);
        await fetchUserRoles();
      }
      
      setLoading(false);
    };

    initializeRoles();
  }, [user]);

  return {
    userRoles,
    isAdmin,
    loading,
    checkIsAdmin,
    assignRole,
    fetchUserRoles
  };
};
