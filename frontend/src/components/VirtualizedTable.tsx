
import { memo, useCallback, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Application } from '@/types/application';
import { TableHeader } from '@/components/ui/table';
import ApplicationRow from './tables/ApplicationRow';

interface VirtualizedTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  selectedApplicationId?: string;
  selectedEmiMonth?: string | null;
  height?: number;
}

const ITEM_HEIGHT = 80; // Height of each row in pixels

const VirtualizedTable = memo(({
  applications,
  onRowClick,
  selectedApplicationId,
  selectedEmiMonth,
  height = 600
}: VirtualizedTableProps) => {
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const application = applications[index];
    if (!application) return null;

    return (
      <div style={style}>
        <ApplicationRow
          application={application}
          selectedApplicationId={selectedApplicationId}
          onRowClick={onRowClick}
          selectedEmiMonth={selectedEmiMonth}
        />
      </div>
    );
  }, [applications, selectedApplicationId, onRowClick, selectedEmiMonth]);

  const memoizedList = useMemo(() => (
    <List
      height={height}
      itemCount={applications.length}
      itemSize={ITEM_HEIGHT}
      overscanCount={5}
      width="100%"
    >
      {Row}
    </List>
  ), [applications.length, height, Row]);

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHeader />
        </table>
        {applications.length > 0 ? (
          memoizedList
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg font-medium text-gray-500">No applications found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
});

VirtualizedTable.displayName = "VirtualizedTable";

export default VirtualizedTable;
