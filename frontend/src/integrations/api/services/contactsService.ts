import { API_BASE_URL, getAuthHeaders } from '../client';

// Types for contacts data
export interface ContactInfo {
  id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  type: string;
  relationship?: string | null;
}

export interface ApplicationContactsResponse {
  loan_id: number;
  applicant: ContactInfo;
  co_applicants: ContactInfo[];
  guarantors: ContactInfo[];
  references: ContactInfo[];
}

// Contacts Service
export class ContactsService {
  // GET /api/v1/contacts/{loan_id} - Get all contacts for an application
  static async getApplicationContacts(loanId: string): Promise<ApplicationContactsResponse> {
    const response = await fetch(`${API_BASE_URL}/contacts/${loanId}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch contacts: ${response.status}`);
    }

    return await response.json();
  }

  // Helper method to get applicant contact only
  static async getApplicantContact(loanId: string): Promise<ContactInfo> {
    const contacts = await this.getApplicationContacts(loanId);
    return contacts.applicant;
  }

  // Helper method to get co-applicants only
  static async getCoApplicants(loanId: string): Promise<ContactInfo[]> {
    const contacts = await this.getApplicationContacts(loanId);
    return contacts.co_applicants;
  }

  // Helper method to get guarantors only
  static async getGuarantors(loanId: string): Promise<ContactInfo[]> {
    const contacts = await this.getApplicationContacts(loanId);
    return contacts.guarantors;
  }

  // Helper method to get references only
  static async getReferences(loanId: string): Promise<ContactInfo[]> {
    const contacts = await this.getApplicationContacts(loanId);
    return contacts.references;
  }

  // Helper method to get all contacts by type
  static async getContactsByType(loanId: string, contactType: string): Promise<ContactInfo[]> {
    const contacts = await this.getApplicationContacts(loanId);
    
    switch (contactType.toLowerCase()) {
      case 'applicant':
        return [contacts.applicant];
      case 'co_applicant':
      case 'co-applicant':
        return contacts.co_applicants;
      case 'guarantor':
        return contacts.guarantors;
      case 'reference':
        return contacts.references;
      default:
        throw new Error(`Invalid contact type: ${contactType}`);
    }
  }
}
