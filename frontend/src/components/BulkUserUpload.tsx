
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload } from 'lucide-react';
import UserUploadTemplate from './bulk/UserUploadTemplate';
import UserUploadProcessor from './bulk/UserUploadProcessor';

interface BulkUserUploadProps {
  onUsersAdded: () => void;
}

const BulkUserUpload = ({ onUsersAdded }: BulkUserUploadProps) => {
  const [open, setOpen] = useState(false);
  const [defaultRole, setDefaultRole] = useState<'admin' | 'user'>('user');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Bulk Upload Users
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Users</DialogTitle>
          <DialogDescription>
            Upload multiple users with role assignment using an Excel file. Download the template to get started.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <UserUploadTemplate />

          <div className="space-y-2">
            <Label htmlFor="default-role">Default Role (if not specified in Excel)</Label>
            <Select value={defaultRole} onValueChange={(value: 'admin' | 'user') => setDefaultRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select default role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              This role will be assigned to users where the Role column is empty
            </p>
          </div>

          <UserUploadProcessor
            defaultRole={defaultRole}
            onUsersAdded={onUsersAdded}
            onDialogClose={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUserUpload;
