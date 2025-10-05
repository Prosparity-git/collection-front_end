import { apiRequest, API_BASE_URL } from '../client';

// Types for Field Visit
export interface FieldVisitLocation {
  id: number;
  loan_application_id: number;
  payment_details_id: number;
  visit_type_id: number;
  latitude: string;
  longitude: string;
  agent_id: number;
  created_at: string;
  visit_type_name?: string;
}

export interface VisitType {
  id: number;
  type_name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateFieldVisitRequest {
  loan_application_id: number;
  payment_details_id: number;
  visit_type_id: number;
  latitude: number;
  longitude: number;
  agent_id?: number;
}

export interface FieldVisitFilterParams {
  loan_application_id?: number;
  payment_details_id?: number;
}

export class FieldVisitService {
  private static baseUrl = `${API_BASE_URL}/field-visit-location`;

  /**
   * Get all field visit locations
   */
  static async getAllVisits(): Promise<FieldVisitLocation[]> {
    const response = await apiRequest<FieldVisitLocation[]>(`${this.baseUrl}/`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch field visits');
    }
    
    return response.data || [];
  }

  /**
   * Create a new field visit location record
   */
  static async createFieldVisit(visitData: CreateFieldVisitRequest): Promise<FieldVisitLocation> {
    const response = await apiRequest<FieldVisitLocation>(`${this.baseUrl}/`, {
      method: 'POST',
      body: JSON.stringify(visitData),
    });
    
    if (!response.success) {
      // Preserve the original error message from the backend
      const errorMessage = response.error || 'Failed to create field visit';
      throw new Error(errorMessage);
    }
    
    return response.data!;
  }

  /**
   * Get field visits filtered by loan application ID and/or payment details ID
   */
  static async getVisitsByFilter(params: FieldVisitFilterParams): Promise<FieldVisitLocation[]> {
    const queryParams = new URLSearchParams();
    
    if (params.loan_application_id !== undefined) {
      queryParams.append('loan_application_id', params.loan_application_id.toString());
    }
    
    if (params.payment_details_id !== undefined) {
      queryParams.append('payment_details_id', params.payment_details_id.toString());
    }

    const url = `${this.baseUrl}/filter${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    console.log('FieldVisitService: Making request to:', url);
    console.log('FieldVisitService: Request params:', params);
    
    const response = await apiRequest<FieldVisitLocation[]>(url);
    
    if (!response.success) {
      console.error('FieldVisitService: API Error:', response.error);
      throw new Error(response.error || 'Failed to fetch filtered field visits');
    }
    
    return response.data || [];
  }

  /**
   * Get field visits by visit type
   */
  static async getVisitsByType(visitTypeId: number): Promise<FieldVisitLocation[]> {
    const response = await apiRequest<FieldVisitLocation[]>(`${this.baseUrl}/by-type/${visitTypeId}`);
    
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch field visits by type');
    }
    
    return response.data || [];
  }
}

// VisitType interface kept for backward compatibility but VisitTypeService removed
// Visit types are now hardcoded in the frontend components
