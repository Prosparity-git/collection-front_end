import { API_BASE_URL, getAuthHeaders } from '../client';
import {
  PresignRequestForm,
  PresignResponse,
  FinalizeDocumentRequest,
  DocumentsByVisitResponse,
  DocumentsByLoanResponse,
  DocumentItem,
  ImageMimeType,
} from '@/types/documents';

// Add interface for presign response with fields for POST
interface PresignResponseWithFields extends PresignResponse {
  upload_url: string;
  s3_key: string;
  fields?: Record<string, string>;
}

export class DocumentService {
  static async presign(form: PresignRequestForm): Promise<PresignResponse> {
    const params = new URLSearchParams();
    if (form.loan_application_id !== undefined) params.append('loan_application_id', String(form.loan_application_id));
    params.append('filename', form.filename);
    params.append('content_type', form.content_type);
    if (form.visit_type) params.append('visit_type', form.visit_type);

    const response = await fetch(`${API_BASE_URL}/documents/presign`, {
      method: 'POST',
      headers: (() => {
        const token = localStorage.getItem('access_token');
        return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/x-www-form-urlencoded' } : { 'Content-Type': 'application/x-www-form-urlencoded' };
      })(),
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to presign: ${response.status}`);
    }
    return response.json();
  }

  static async uploadToS3(
    presignRes: PresignResponseWithFields, 
    file: Blob,
    contentType: ImageMimeType
  ): Promise<void> {
    // Build FormData with presigned fields (for POST-based S3)
    const fd = new FormData();
    if (presignRes.fields) {
      Object.entries(presignRes.fields).forEach(([k, v]) => {
        fd.append(k, v);
      });
    }
    fd.append('file', file, `selfie.${contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'}`);
    
    const res = await fetch(presignRes.upload_url, {
      method: 'POST',
      body: fd,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`S3 upload failed: ${res.status} ${text}`);
    }
  }

  static async finalize(payload: FinalizeDocumentRequest): Promise<DocumentItem> {
    const response = await fetch(`${API_BASE_URL}/documents/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to finalize document: ${response.status}`);
    }
    return response.json();
  }

  static async listByVisit(fieldVisitLocationId: number): Promise<DocumentItem[]> {
    const url = `${API_BASE_URL}/documents/by-visit?field_visit_location_id=${encodeURIComponent(fieldVisitLocationId)}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to list documents: ${response.status}`);
    }
    const data: DocumentsByVisitResponse | DocumentItem[] = await response.json();
    return Array.isArray(data) ? data : data.items;
  }

  static async listByLoan(loanApplicationId: number): Promise<DocumentItem[]> {
    const url = `${API_BASE_URL}/documents/by-loan?loan_application_id=${encodeURIComponent(loanApplicationId)}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to list documents by loan: ${response.status}`);
    }
    const data: DocumentsByLoanResponse | DocumentItem[] = await response.json();
    return Array.isArray(data) ? data : data.items;
  }
}

