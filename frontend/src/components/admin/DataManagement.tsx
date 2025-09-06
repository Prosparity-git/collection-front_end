
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Upload, Users } from "lucide-react";
import UploadApplicationDialog from "@/components/UploadApplicationDialog";
import BulkUserUpload from "@/components/BulkUserUpload";
import UserManagementDialog from "@/components/UserManagementDialog";

interface DataManagementProps {
  onApplicationsAdded: () => void;
  onUsersAdded: () => void;
}

const DataManagement = ({ onApplicationsAdded, onUsersAdded }: DataManagementProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Application Data Management */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Upload className="h-4 w-4 text-blue-600" />
                <h3 className="font-medium">Application Data</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Bulk upload applications from Excel files
              </p>
              <UploadApplicationDialog onApplicationsAdded={onApplicationsAdded} />
            </div>

            {/* User Data Management */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-green-600" />
                <h3 className="font-medium">User Data</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Bulk upload users from Excel files
              </p>
              <BulkUserUpload onUsersAdded={onUsersAdded} />
            </div>

            {/* Single User Management */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-purple-600" />
                <h3 className="font-medium">User Creation</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Create individual user accounts
              </p>
              <UserManagementDialog />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataManagement;
