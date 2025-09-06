import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthService } from '@/integrations/api/services/authService';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireRole?: string[];
}

const ProtectedRoute = ({ children, requireAdmin = false, requireRole }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check admin requirement
  if (requireAdmin && !AuthService.isAdmin()) {
    return <Navigate to="/" replace />;
  }

  // Check specific role requirement
  if (requireRole && requireRole.length > 0) {
    const userRole = AuthService.getCurrentUserRole();
    if (!userRole || !requireRole.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
