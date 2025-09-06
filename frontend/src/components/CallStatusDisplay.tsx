
import { X, ArrowRight } from "lucide-react";
import { Application } from "@/types/application";
import type { BatchContactStatus } from "@/hooks/useBatchContactCallingStatus";

interface CallStatusDisplayProps {
  application: Application;
  selectedMonth?: string;
  batchedContactStatus?: BatchContactStatus;
}

const CallStatusDisplay = ({ application, selectedMonth, batchedContactStatus }: CallStatusDisplayProps) => {
  // Use batched data if available, otherwise fallback to default
  const getStatusForContact = (contactType: string): string => {
    if (!batchedContactStatus) return 'Not Called';
    
    switch (contactType) {
      case 'applicant':
        return batchedContactStatus.applicant || 'Not Called';
      case 'co_applicant':
        return batchedContactStatus.co_applicant || 'Not Called';
      case 'guarantor':
        return batchedContactStatus.guarantor || 'Not Called';
      case 'reference':
        return batchedContactStatus.reference || 'Not Called';
      default:
        return 'Not Called';
    }
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    
    // Handle "Not Called" status
    if (statusLower === "not called" || statusLower === "not called") {
      return <div className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" />;
    }
    
    // Handle "Not answered" status
    if (statusLower === "not answered" || statusLower === "no response") {
      return <X className="w-3 h-3 text-red-500 flex-shrink-0" />;
    }
    
    // Handle "Called" or "answered" status
    if (statusLower === "called" || statusLower === "answered" || 
        statusLower === "customer funded the account" || 
        statusLower === "customer will fund the account on a future date" ||
        statusLower === "cash collected" ||
        statusLower === "cash will be collected on a future date" ||
        statusLower === "spoken – no commitment" ||
        statusLower === "refused / unable to fund") {
      return <ArrowRight className="w-3 h-3 text-green-500 flex-shrink-0" />;
    }
    
    // Default case - empty circle
    return <div className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" />;
  };

  const contacts = [
    {
      name: "Applicant",
      person: application.applicant_name,
      status: getStatusForContact('applicant')
    },
    ...(application.co_applicant_name ? [{
      name: "Co-Applicant", 
      person: application.co_applicant_name,
      status: getStatusForContact('co_applicant')
    }] : []),
    ...(application.guarantor_name ? [{
      name: "Guarantor",
      person: application.guarantor_name, 
      status: getStatusForContact('guarantor')
    }] : []),
    ...(application.reference_name ? [{
      name: "Reference",
      person: application.reference_name,
      status: getStatusForContact('reference')
    }] : [])
  ];

  return (
    <div className="space-y-1">
      {contacts.map((contact, index) => (
        <div key={index} className="flex items-center gap-1 text-xs">
          {getStatusIcon(contact.status)}
          <span className="text-gray-600 truncate max-w-[80px]" title={contact.person}>
            {contact.name}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CallStatusDisplay;
