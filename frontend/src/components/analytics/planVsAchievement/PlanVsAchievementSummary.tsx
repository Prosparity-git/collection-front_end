import { Card, CardContent } from '@/components/ui/card';
import { CalendarIcon, FileText, TrendingUp, Users } from 'lucide-react';

interface SummaryStats {
  total: number;
  statusChanged: number;
  ptpUpdated: number;
  statusAndPtpUpdated: number;
  noChange: number;
}

interface PlanVsAchievementSummaryProps {
  stats: SummaryStats;
  loading: boolean;
  hasData: boolean;
}

const PlanVsAchievementSummary = ({ stats, loading, hasData }: PlanVsAchievementSummaryProps) => {
  if (loading || !hasData) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm font-medium text-gray-600">Total Applications</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.statusChanged}</p>
              <p className="text-sm font-medium text-gray-600">Status Updated</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CalendarIcon className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.ptpUpdated}</p>
              <p className="text-sm font-medium text-gray-600">PTP Updated</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.statusAndPtpUpdated}</p>
              <p className="text-sm font-medium text-gray-600">Status & PTP Updated</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.noChange}</p>
              <p className="text-sm font-medium text-gray-600">No Changes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanVsAchievementSummary;
