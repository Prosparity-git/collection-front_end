
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Settings, Save } from "lucide-react";

interface WorkflowConfig {
  requireApprovalForPaid: boolean;
  requireApprovalForOtherStatuses: boolean;
  allowedApprovers: 'admins_only' | 'admins_and_managers';
  autoRejectAfterDays: number;
  requireApprovalComments: boolean;
  emailNotifications: boolean;
  approvalNotificationTemplate: string;
  rejectionNotificationTemplate: string;
}

const WorkflowSettings = () => {
  const [config, setConfig] = useState<WorkflowConfig>({
    requireApprovalForPaid: true,
    requireApprovalForOtherStatuses: false,
    allowedApprovers: 'admins_only',
    autoRejectAfterDays: 7,
    requireApprovalComments: false,
    emailNotifications: false,
    approvalNotificationTemplate: 'Your status change request for application {application_id} has been approved.',
    rejectionNotificationTemplate: 'Your status change request for application {application_id} has been rejected. Reason: {comments}'
  });

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // In a real implementation, you would save this to a database
      // For now, we'll just simulate a save operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Workflow settings saved successfully');
    } catch (error) {
      console.error('Error saving workflow settings:', error);
      toast.error('Failed to save workflow settings');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: keyof WorkflowConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Approval Workflow Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Approval Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Approval Requirements</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="require-paid-approval">Require approval for "Paid" status</Label>
                <p className="text-sm text-gray-600">When enabled, changing status to "Paid" requires admin approval</p>
              </div>
              <Switch
                id="require-paid-approval"
                checked={config.requireApprovalForPaid}
                onCheckedChange={(checked) => handleConfigChange('requireApprovalForPaid', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="require-other-approval">Require approval for other status changes</Label>
                <p className="text-sm text-gray-600">When enabled, all status changes require admin approval</p>
              </div>
              <Switch
                id="require-other-approval"
                checked={config.requireApprovalForOtherStatuses}
                onCheckedChange={(checked) => handleConfigChange('requireApprovalForOtherStatuses', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="require-comments">Require comments for approval/rejection</Label>
                <p className="text-sm text-gray-600">When enabled, approvers must provide comments</p>
              </div>
              <Switch
                id="require-comments"
                checked={config.requireApprovalComments}
                onCheckedChange={(checked) => handleConfigChange('requireApprovalComments', checked)}
              />
            </div>
          </div>

          {/* Approver Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Approver Configuration</h3>
            
            <div className="space-y-2">
              <Label htmlFor="allowed-approvers">Who can approve requests?</Label>
              <Select
                value={config.allowedApprovers}
                onValueChange={(value: 'admins_only' | 'admins_and_managers') => 
                  handleConfigChange('allowedApprovers', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admins_only">Admins Only</SelectItem>
                  <SelectItem value="admins_and_managers">Admins and Managers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto-reject-days">Auto-reject requests after (days)</Label>
              <Select
                value={config.autoRejectAfterDays.toString()}
                onValueChange={(value) => handleConfigChange('autoRejectAfterDays', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="0">Never auto-reject</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Notification Settings</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="email-notifications">Send email notifications</Label>
                <p className="text-sm text-gray-600">Send emails when requests are approved or rejected</p>
              </div>
              <Switch
                id="email-notifications"
                checked={config.emailNotifications}
                onCheckedChange={(checked) => handleConfigChange('emailNotifications', checked)}
              />
            </div>

            {config.emailNotifications && (
              <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                <div className="space-y-2">
                  <Label htmlFor="approval-template">Approval notification template</Label>
                  <Textarea
                    id="approval-template"
                    value={config.approvalNotificationTemplate}
                    onChange={(e) => handleConfigChange('approvalNotificationTemplate', e.target.value)}
                    placeholder="Template for approval notifications..."
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    Available variables: {'{application_id}'}, {'{requested_status}'}, {'{approver_name}'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rejection-template">Rejection notification template</Label>
                  <Textarea
                    id="rejection-template"
                    value={config.rejectionNotificationTemplate}
                    onChange={(e) => handleConfigChange('rejectionNotificationTemplate', e.target.value)}
                    placeholder="Template for rejection notifications..."
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    Available variables: {'{application_id}'}, {'{requested_status}'}, {'{approver_name}'}, {'{comments}'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkflowSettings;
