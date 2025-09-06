
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, History, Settings, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import EnhancedUserManagement from "@/components/admin/EnhancedUserManagement";
import DataManagement from "@/components/admin/DataManagement";
import StatusRequestHistory from "@/components/admin/StatusRequestHistory";
import WorkflowSettings from "@/components/admin/WorkflowSettings";
import { toast } from "sonner";

const AdminSettings = () => {
  const { user } = useAuth();
  const { isAdmin, loading } = useUserRoles();
  const navigate = useNavigate();

  const handleApplicationsAdded = () => {
    toast.success("Applications data updated. Refreshing main dashboard...");
    // The main dashboard will automatically refresh due to react-query
  };

  const handleUsersAdded = () => {
    toast.success("Users added successfully!");
    // This will trigger a refresh of the user management table
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-600 mt-2">Manage users, data, view request history, and configure workflow settings</p>
        </div>

        {/* Main Content */}
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  User Management
                </TabsTrigger>
                <TabsTrigger value="data" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Data Management
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Request History
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Workflow Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-6">
                <EnhancedUserManagement />
              </TabsContent>

              <TabsContent value="data" className="mt-6">
                <DataManagement 
                  onApplicationsAdded={handleApplicationsAdded}
                  onUsersAdded={handleUsersAdded}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <StatusRequestHistory />
              </TabsContent>

              <TabsContent value="settings" className="mt-6">
                <WorkflowSettings />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
