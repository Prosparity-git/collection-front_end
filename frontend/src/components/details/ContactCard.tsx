
import { Application } from "@/types/application";
import CallButton from "../CallButton";
import CallStatusSelector from "../CallStatusSelector";
import { Phone, Mail, User } from "lucide-react";

interface ContactCardProps {
  title: string;
  name: string;
  mobile?: string;
  email?: string;
  currentStatus?: string;
  onStatusChange: (status: string) => void;
  showCallingStatus?: boolean;
  contactTypeId?: number; // Add contact type ID
  relationship?: string | null; // Add relationship field
}

const ContactCard = ({ 
  title, 
  name, 
  mobile, 
  email, 
  currentStatus, 
  onStatusChange,
  showCallingStatus = false,
  relationship 
}: ContactCardProps) => {
  // Debug logging to track status changes
  console.log(`🔄 ContactCard (${title}): Rendering with currentStatus:`, currentStatus);
  
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-blue-600" />
            <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
          </div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <p className="text-sm font-medium text-gray-800 break-words">{name}</p>
            {relationship && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                {relationship}
              </span>
            )}
          </div>
          
          <div className="space-y-1">
            {mobile && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Phone className="h-3 w-3 text-gray-500" />
                <span className="break-all">{mobile}</span>
              </div>
            )}
            {email && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Mail className="h-3 w-3 text-gray-500" />
                <span className="break-all">{email}</span>
              </div>
            )}
          </div>
        </div>
        
        {mobile && (
          <CallButton 
            name="Call" 
            phone={mobile}
            variant="outline"
            size="sm"
            className="flex-shrink-0"
          />
        )}
      </div>
      
      {showCallingStatus && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500 font-medium">Calling Status:</span>
          <CallStatusSelector
            currentStatus={currentStatus}
            onStatusChange={onStatusChange}
          />
        </div>
      )}
    </div>
  );
};

export default ContactCard;
