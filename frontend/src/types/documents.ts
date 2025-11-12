export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface PresignRequestForm {
  loan_application_id?: number;
  field_visit_location_id?: number; // not required for presign (sent at finalize)
  filename: string;
  content_type: ImageMimeType;
  visit_type?: string; // UI label, e.g. "Customer Visit - House"
}

export interface PresignResponse {
  upload_url: string;
  s3_key: string;
  method?: 'POST' | 'PUT';
  fields?: Record<string, string>;
}

export interface FinalizeDocumentRequest {
  applicant_id: string;
  loan_application_id: number;
  field_visit_location_id: number;
  doc_category_id: number;
  file_name: string;
  s3_key: string;
  repayment_id?: number;
  mime_type?: ImageMimeType;
  size_bytes?: number;
  notes?: string;
}

export interface DocumentItem {
  id: number;
  applicant_id: string;
  loan_application_id: number;
  field_visit_location_id?: number;
  doc_category_id: number;
  file_name: string;
  url: string;
  mime_type?: string;
  size_bytes?: number;
  created_at?: string;
}

export interface DocumentsByVisitResponse {
  items: DocumentItem[];
}

export interface DocumentsByLoanResponse {
  items: DocumentItem[];
}

