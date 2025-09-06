import { X, ArrowRight } from "lucide-react";

interface CallingStatusColumnProps {
  callingStatuses: {
    applicant: string;
    co_applicant: string;
    guarantor: string;
    reference: string;
  };
}

const CallingStatusColumn = ({ callingStatuses }: CallingStatusColumnProps) => {
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

  const categories = [
    { key: "applicant", label: "Applicant", status: callingStatuses.applicant },
    { key: "co_applicant", label: "Co-Applicant", status: callingStatuses.co_applicant },
    { key: "guarantor", label: "Guarantor", status: callingStatuses.guarantor },
    { key: "reference", label: "Reference", status: callingStatuses.reference }
  ];

  return (
    <div className="space-y-2">
      {categories.map((category) => (
        <div key={category.key} className="flex items-center gap-2 text-xs">
          {getStatusIcon(category.status)}
          <span className="text-gray-700 font-medium">{category.label}</span>
        </div>
      ))}
    </div>
  );
};

export default CallingStatusColumn;
