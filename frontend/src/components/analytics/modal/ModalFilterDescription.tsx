
import { DrillDownFilter } from '@/pages/Analytics';

interface ModalFilterDescriptionProps {
  filter: DrillDownFilter | null;
}

const ModalFilterDescription = ({ filter }: ModalFilterDescriptionProps) => {
  const getFilterDescription = () => {
    if (!filter) return '';
    
    let description = `Applications in ${filter.branch_name}`;
    if (filter.rm_name) {
      description += ` (RM: ${filter.rm_name})`;
    }
    
    switch (filter.status_type) {
      case 'unpaid':
        return `${description} with Unpaid status`;
      case 'partially_paid':
        return `${description} with Partially Paid status`;
      case 'paid_pending_approval':
        return `${description} with Paid (Pending Approval) status`;
      case 'paid':
        return `${description} with Paid status`;
      case 'others':
        return `${description} with Other statuses`;
      case 'overdue':
        return `${description} with Overdue PTPs`;
      case 'today':
        return `${description} with Today's PTPs`;
      case 'tomorrow':
        return `${description} with Tomorrow's PTPs`;
      case 'future':
        return `${description} with Future PTPs`;
      case 'no_ptp_set':
        return `${description} with No PTP set`;
      default:
        return description;
    }
  };

  return getFilterDescription();
};

export default ModalFilterDescription;
