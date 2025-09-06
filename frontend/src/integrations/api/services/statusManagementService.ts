import { API_BASE_URL, getAuthHeaders } from '../client';

// Types for status management data
export interface StatusManagementUpdate {
  loan_id: string; // Backend expects this in the body
  repayment_id: string; // Payment ID from application payload
  calling_type: number; // 1 for contact calling, 2 for demand calling
  demand_calling_status?: number; // Backend expects integers, not strings
  contact_calling_status?: number;
  repayment_status?: number;
  ptp_date?: string;
  amount_collected?: number;
  contact_type?: number; // Contact type (applicant, co_applicant, etc.)
}

export interface StatusManagementResponse {
  success: boolean;
  message: string;
  loan_id: number;
  updated_fields: string[];
  new_status: {
    demand_calling_status?: string;
    contact_calling_status?: string;
    repayment_status?: string;
    ptp_date?: string;
    amount_collected?: number;
  };
}

export interface ApplicationStatus {
  loan_id: number;
  demand_date: string;
  demand_calling_status: string | null;
  repayment_status: string | null;
  ptp_date: string | null;
  amount_collected: number | null;
  contact_calling_status: string | null;
}

// Mapping functions to convert string values to integer IDs
export const mapCallingStatusToId = (status: string): number => {
  const callingStatusMap: Record<string, number> = {
    "No response": 0,
    "Customer funded the account": 1,
    "Customer will fund the account on a future date": 2,
    "Cash collected": 3,
    "Cash will be collected on a future date": 4,
    "Spoken – no commitment": 5,
    "Refused / unable to fund": 6
  };
  return callingStatusMap[status] ?? 0;
};

// Mapping function for contact calling status (answered, not answered, not called)
export const mapContactCallingStatusToId = (status: string): number => {
  // If status is already a number, return it directly
  if (!isNaN(Number(status))) {
    return parseInt(status, 10);
  }
  
  // Map string descriptions to integer IDs
  const contactCallingStatusMap: Record<string, number> = {
    "answered": 1,
    "not answered": 2,
    "not called": 3
  };
  return contactCallingStatusMap[status.toLowerCase()] ?? 3; // Default to "not called"
};

// Mapping function for contact types (applicant, co_applicant, guarantor, reference)
export const mapContactTypeToId = (contactType: string): number => {
  // If contactType is already a number, return it directly
  if (!isNaN(Number(contactType))) {
    return parseInt(contactType, 10);
  }
  
  // Map string descriptions to integer IDs
  const contactTypeMap: Record<string, number> = {
    "applicant": 1,
    "co_applicant": 2,
    "guarantor": 3,
    "reference": 4
  };
  return contactTypeMap[contactType.toLowerCase()] ?? 1; // Default to applicant
};

export const mapRepaymentStatusToId = (status: string): number => {
  const repaymentStatusMap: Record<string, number> = {
    "Unpaid": 0,
    "Partially Paid": 1,
    "Cash Collected from Customer": 2,
    "Customer Deposited to Bank": 3,
    "Paid": 4,
    "Paid (Pending Approval)": 5
  };
  return repaymentStatusMap[status] ?? 0;
};

// Test function to verify payload structure (can be removed in production)
export const testContactCallingPayload = () => {
  console.log('🧪 Testing Contact Calling Payload Structure:');
  
  const testCases = [
    { contactType: 'applicant', status: 'answered', expectedContactType: 1, expectedStatus: 1 },
    { contactType: 'co_applicant', status: 'not answered', expectedContactType: 2, expectedStatus: 2 },
    { contactType: 'guarantor', status: 'not called', expectedContactType: 3, expectedStatus: 3 },
    { contactType: 'reference', status: 'answered', expectedContactType: 4, expectedStatus: 1 }
  ];

  testCases.forEach(testCase => {
    const actualContactType = mapContactTypeToId(testCase.contactType);
    const actualStatus = mapContactCallingStatusToId(testCase.status);
    
    console.log(`  ${testCase.contactType} (${testCase.status}):`, {
      contact_type: actualContactType,
      contact_calling_status: actualStatus,
      calling_type: 1,
      expected: {
        contact_type: testCase.expectedContactType,
        contact_calling_status: testCase.expectedStatus,
        calling_type: 1
      }
    });
  });
};

// Status Management Service
export class StatusManagementService {
  // PUT /api/v1/status-management/{loan_id} - Update application status
  static async updateApplicationStatus(
    loanId: string,
    statusUpdate: Omit<StatusManagementUpdate, 'loan_id'>
  ): Promise<StatusManagementResponse> {
    // Add loan_id to the request body as expected by backend
    const requestBody: StatusManagementUpdate = {
      loan_id: loanId,
      ...statusUpdate
    };

    console.log('🚀 Final API Request Body:', requestBody);
    console.log('🌐 API Endpoint:', `${API_BASE_URL}/status-management/${loanId}`);

    const response = await fetch(`${API_BASE_URL}/status-management/${loanId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Status update failed:', response.status, errorData);
      throw new Error(`Failed to update status: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const responseData = await response.json();
    console.log('📥 Backend response:', responseData);

    // Handle different response formats from backend
    // If the response is a string (success message), convert it to our expected format
    if (typeof responseData === 'string') {
      // This is a success message from the backend
      return {
        success: true,
        message: responseData,
        loan_id: parseInt(loanId, 10),
        updated_fields: [],
        new_status: {}
      };
    }

    // If the response has a success field, use it as is
    if (responseData && typeof responseData === 'object' && 'success' in responseData) {
      return responseData;
    }

    // If the response doesn't have a success field but the HTTP status is OK, treat it as success
    if (response.ok) {
      return {
        success: true,
        message: responseData?.message || 'Status updated successfully',
        loan_id: parseInt(loanId, 10),
        updated_fields: responseData?.updated_fields || [],
        new_status: responseData?.new_status || {}
      };
    }

    // Fallback: treat as success if we reach here (HTTP status was OK)
    return {
      success: true,
      message: 'Status updated successfully',
      loan_id: parseInt(loanId, 10),
      updated_fields: [],
      new_status: {}
    };
  }

  // GET /api/v1/status-management/{loan_id} - Get current application status
  static async getApplicationStatus(
    loanId: string,
    demandDate: string
  ): Promise<ApplicationStatus> {
    const queryParams = new URLSearchParams({
      demand_date: demandDate,
    });

    const response = await fetch(
      `${API_BASE_URL}/status-management/${loanId}?${queryParams.toString()}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to get application status: ${response.status}`);
    }

    return await response.json();
  }

  // Helper method to update only demand calling status
  static async updateDemandCallingStatus(
    loanId: string,
    status: string,
    repaymentId: string = ''
  ): Promise<StatusManagementResponse> {
    return await this.updateApplicationStatus(loanId, {
      repayment_id: repaymentId,
      calling_type: 2, // 2 for demand calling
      demand_calling_status: mapCallingStatusToId(status),
      contact_calling_status: 0,
      contact_type: 1
    });
  }

  // Helper method to update only contact calling status
  static async updateContactCallingStatus(
    loanId: string,
    contactType: string,
    status: string,
    demandDate?: string,
    repaymentId?: string
  ): Promise<StatusManagementResponse> {
    const payload: any = {
      calling_type: 1, // 1 for contact calling
      contact_calling_status: mapContactCallingStatusToId(status),
      contact_type: mapContactTypeToId(contactType)
    };

    // Add repayment_id if provided
    if (repaymentId) {
      payload.repayment_id = repaymentId;
    }

    // Add demand_date if provided
    if (demandDate) {
      payload.demand_date = demandDate;
    }

    console.log('📤 Contact Calling Status Update Payload:', {
      loan_id: loanId,
      ...payload
    });

    return await this.updateApplicationStatus(loanId, payload);
  }

  // Helper method to update only repayment status
  static async updateRepaymentStatus(
    loanId: string,
    status: string,
    repaymentId: string = ''
  ): Promise<StatusManagementResponse> {
    return await this.updateApplicationStatus(loanId, {
      repayment_id: repaymentId,
      calling_type: 2, // 2 for demand calling
      repayment_status: mapRepaymentStatusToId(status),
      contact_calling_status: 0,
      contact_type: 1
    });
  }

  // Helper method to update only PTP date
  static async updatePTPDate(
    loanId: string,
    ptpDate: string,
    repaymentId: string = ''
  ): Promise<StatusManagementResponse> {
    return await this.updateApplicationStatus(loanId, {
      repayment_id: repaymentId,
      calling_type: 2, // 2 for demand calling
      ptp_date: ptpDate,
      contact_calling_status: 0,
      contact_type: 1
    });
  }

  // Helper method to update only amount collected
  static async updateAmountCollected(
    loanId: string,
    amount: number,
    repaymentId: string = ''
  ): Promise<StatusManagementResponse> {
    return await this.updateApplicationStatus(loanId, {
      repayment_id: repaymentId,
      calling_type: 2, // 2 for demand calling
      amount_collected: amount,
      contact_calling_status: 0,
      contact_type: 1
    });
  }

  // Helper method to update multiple status fields at once
  static async updateMultipleStatusFields(
    loanId: string,
    updates: Omit<StatusManagementUpdate, 'loan_id' | 'repayment_id' | 'calling_type' | 'contact_calling_status' | 'contact_type'>,
    repaymentId: string = ''
  ): Promise<StatusManagementResponse> {
    const fullUpdates: Omit<StatusManagementUpdate, 'loan_id'> = {
      repayment_id: repaymentId,
      calling_type: 2, // 2 for demand calling
      contact_calling_status: 0,
      contact_type: 1,
      ...updates
    };
    return await this.updateApplicationStatus(loanId, fullUpdates);
  }
}
