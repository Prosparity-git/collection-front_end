
import { Application } from "@/types/application";
import OptimizedApplicationsTable from "./tables/OptimizedApplicationsTable";

interface ApplicationsTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  onApplicationDeleted?: () => void;
  selectedApplicationId?: string;
  selectedEmiMonth?: string | null;
}

const ApplicationsTable = (props: ApplicationsTableProps) => {
  return <OptimizedApplicationsTable {...props} />;
};

export default ApplicationsTable;
