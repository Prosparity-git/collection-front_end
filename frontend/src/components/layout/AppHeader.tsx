import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthService } from "@/integrations/api/services/authService";
import CollectionExportDialog from "@/components/CollectionExportDialog";
import { BarChart3 } from "lucide-react";

interface AppHeaderProps {
  onLogout: () => void;
  user: any;
}

const AppHeader = ({ onLogout, user }: AppHeaderProps) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const userDisplayName = useMemo(() => {
    if (!user) return '';
    return user.user_name || user.name || 'User';
  }, [user]);

  const userRole = useMemo(() => {
    if (!user) return '';
    return user.role || AuthService.getCurrentUserRole() || 'User';
  }, [user]);

  const isAdmin = AuthService.isAdmin();

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <img 
            src="/uploads/logo.png" 
            alt="Prosparity Logo" 
            className="h-7 w-auto"
          />
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Collection Dashboard</h1>
          </div>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/analytics')}
              className="h-8 text-xs"
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Analytics
            </Button>
            <CollectionExportDialog />
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin-settings')}
                className="h-8 text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                Admin Settings
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <div className="text-right">
                <div className="font-medium truncate max-w-[120px]">{userDisplayName}</div>
                <div className="text-xs text-gray-500 capitalize">{userRole}</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="text-gray-600 hover:text-gray-900 h-8 text-xs"
            >
              <LogOut className="h-3 w-3 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Mobile User Info and Log Out */}
        <div className="sm:hidden flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <div className="font-medium truncate max-w-[150px]">{userDisplayName}</div>
              <div className="text-xs text-gray-500 capitalize">{userRole}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin-settings')}
                className="h-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="text-gray-600 hover:text-gray-900 h-8"
            >
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppHeader;
