# Field Visit Selfie Upload Implementation Guide

## Overview
This implementation provides live camera capture during field visits, uploads to S3 via presigned POST, and displays images under each visit in history. Camera auto-opens ONLY after a successful visit creation.

## Flow
1. User marks location → Records field visit → Camera auto-opens
2. User captures photo → Preview shown → Upload to S3
3. Images display under corresponding field visit in history
4. Camera hides after upload (no auto-start on refresh)

---

## Step 1: Types (`src/types/documents.ts`)

```typescript
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
```

---

## Step 2: Document Service (`src/integrations/api/services/documentService.ts`)

```typescript
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
```

**Export from `src/integrations/api/services/index.ts`:**
```typescript
export * from './documentService';
```

---

## Step 3: SelfieUploader Component (`src/components/details/SelfieUploader.tsx`)

```typescript
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Camera, Upload, RefreshCw } from 'lucide-react';
import { DocumentService } from '@/integrations/api/services';
import type { ImageMimeType } from '@/types/documents';

type Props = {
  applicantId: string;
  loanApplicationId: number;
  fieldVisitLocationId: number;
  selfieDocCategoryId: number; // cache and pass from parent
  repaymentId?: number;
  onUploaded?: (finalUrl: string) => void;
  autoStart?: boolean;
  visitTypeLabel?: string; // e.g. "Customer Visit - House"
};

const ACCEPTED_TYPES: ImageMimeType[] = ['image/jpeg', 'image/png', 'image/webp'];

export function SelfieUploader({
  applicantId,
  loanApplicationId,
  fieldVisitLocationId,
  selfieDocCategoryId,
  repaymentId,
  onUploaded,
  autoStart,
  visitTypeLabel,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Auto start camera ONLY when explicitly requested (after successful visit)
  // This ensures camera doesn't auto-start on page load or refresh
  useEffect(() => {
    if (autoStart && !isCameraOn && !capturedBlob && !previewUrl) {
      console.log('Auto-starting camera after visit creation');
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraOn(true);
    } catch (e: any) {
      setError(e?.message || 'Unable to access camera');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
      if (!blob) throw new Error('Failed to capture image');
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setCapturedBlob(blob);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to capture photo');
    }
  };

  const compressIfNeeded = async (original: Blob): Promise<Blob> => {
    // Basic compression via canvas for JPEG/WEBP; PNG left as-is to avoid quality loss
    const maxBytes = 700_000; // ~0.7MB target
    // Treat incoming blob as jpeg by default
    if (original.size <= maxBytes) return original;
    const bitmap = await createImageBitmap(original);
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, Math.sqrt(maxBytes / original.size));
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return original;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const quality = 0.85;
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
    return blob || original;
  };

  const doUpload = async () => {
    if (!capturedBlob) return;
    setIsUploading(true);
    setError(null);
    try {
      const compressed = await compressIfNeeded(capturedBlob);
      const contentType = 'image/jpeg' as ImageMimeType;
      const filename = `selfie-${Date.now()}.${contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg'}`;

      const presignRes = await DocumentService.presign({
        loan_application_id: loanApplicationId,
        field_visit_location_id: fieldVisitLocationId,
        filename,
        content_type: contentType,
        visit_type: visitTypeLabel,
      });

      await DocumentService.uploadToS3(presignRes as any, compressed, contentType);

      const finalized = await DocumentService.finalize({
        applicant_id: applicantId,
        loan_application_id: loanApplicationId,
        field_visit_location_id: fieldVisitLocationId,
        doc_category_id: selfieDocCategoryId,
        file_name: filename,
        s3_key: presignRes.s3_key,
        repayment_id: repaymentId,
        mime_type: contentType,
        size_bytes: compressed.size,
      });

      if (onUploaded) onUploaded(finalized.url);
      // Replace local preview with server URL
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(finalized.url);
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setError(null);
    setCapturedBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (isCameraOn) stopCamera();
  };

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Selfie Capture</Label>
          {previewUrl && (
            <Button variant="outline" size="sm" onClick={reset} disabled={isUploading}>
              <RefreshCw className="h-4 w-4 mr-1" /> Reset
            </Button>
          )}
        </div>

        {/* Live camera or captured preview */}
        <div className="w-full aspect-square bg-gray-50 border rounded-lg flex items-center justify-center overflow-hidden">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="preview" className="object-cover w-full h-full" />
          ) : (
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!isCameraOn ? (
            <Button onClick={startCamera} disabled={isUploading} className="flex-1">
              <Camera className="h-4 w-4 mr-2" /> Start Camera
            </Button>
          ) : (
            <Button onClick={capturePhoto} disabled={isUploading} className="flex-1">
              <Camera className="h-4 w-4 mr-2" /> Capture Photo
            </Button>
          )}
          <Button onClick={doUpload} disabled={!capturedBlob || isUploading} className="flex-1">
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" /> Upload
              </>
            )}
          </Button>
        </div>

        {error && <div className="text-xs text-red-600">{error}</div>}
        <div className="text-[11px] text-gray-500">Live capture only. Image may be compressed on device.</div>
      </CardContent>
    </Card>
  );
}

export default SelfieUploader;
```

---

## Step 4: Integration in FieldVisitTab (`src/components/details/FieldVisitTab.tsx`)

**Add these imports at the top:**
```typescript
import SelfieUploader from "./SelfieUploader";
import { DocumentService } from "@/integrations/api/services";
```

**Update visit types:**
```typescript
const VISIT_TYPES = [
  { id: 1, type_name: "Customer Visit - House", description: "Visit to customer's house" },
  { id: 2, type_name: "Customer Visit - Outside Location", description: "Visit at outside location" }
];
```

**Add state variables:**
```typescript
const [selfieUrlsByVisit, setSelfieUrlsByVisit] = useState<Record<number, string[]>>({});
const [autoStartCaptureVisitId, setAutoStartCaptureVisitId] = useState<number | null>(null);
const [allowCapture, setAllowCapture] = useState<boolean>(false);
const [selfieDocCategoryId, setSelfieDocCategoryId] = useState<number | null>(null);
```

**Add useEffect to load selfies (grouped by visit):**
```typescript
// Load all docs by loan and group by field_visit_location_id to show under each visit
useEffect(() => {
  const run = async () => {
    if (!applicationId) return;
    try {
      const docs = await DocumentService.listByLoan(applicationId);
      const map: Record<number, string[]> = {};
      for (const d of docs) {
        const visitId = (d as any).field_visit_location_id as number | undefined;
        if (!visitId) continue;
        if (!map[visitId]) map[visitId] = [];
        map[visitId].push(d.url);
      }
      setSelfieUrlsByVisit(map);
    } catch (err) {
      console.error('Failed to load documents by loan:', err);
    }
  };
  void run();
}, [applicationId, fieldVisits.length]);
```

**Update `recordFieldVisit` function:**
```typescript
const newVisit = await FieldVisitService.createFieldVisit(visitData);

// Add to local state and auto-start camera for this visit
setFieldVisits(prev => [newVisit, ...prev]);
setAutoStartCaptureVisitId(newVisit.id);
setAllowCapture(true); // show camera/uploader only right after a successful visit
```

**Add SelfieUploader section (after Record Visit button):**
```typescript
{/* Selfie Uploader shown ONLY immediately after a successful visit */}
{selfieDocCategoryId !== null && fieldVisits.length > 0 && allowCapture && (
  <div className="space-y-3 pt-2">
    <Label className="text-sm font-medium">Upload Selfie for Latest Visit</Label>
    <SelfieUploader
      applicantId={application?.applicant_id || ''}
      loanApplicationId={applicationId!}
      fieldVisitLocationId={fieldVisits[0].id}
      selfieDocCategoryId={selfieDocCategoryId}
      repaymentId={paymentId}
      autoStart={autoStartCaptureVisitId === fieldVisits[0].id && autoStartCaptureVisitId !== null}
      visitTypeLabel={VISIT_TYPES.find(v => v.id === selectedVisitType)?.type_name}
      onUploaded={(url) => {
        setSelfieUrlsByVisit(prev => ({
          ...prev,
          [fieldVisits[0].id]: [url, ...(prev[fieldVisits[0].id] || [])]
        }));
        // Reset auto-start immediately after upload - prevents auto-start on refresh
        setAutoStartCaptureVisitId(null);
        setAllowCapture(false); // hide camera until the next visit is created
        toast.success('Selfie uploaded');
      }}
    />
  </div>
)}
```

**Update Field Visits History section to show images:**
```typescript
{/* Selfies for this visit - clickable to open */}
{selfieUrlsByVisit[visit.id] && selfieUrlsByVisit[visit.id].length > 0 && (
  <div className="grid grid-cols-3 gap-2 pt-1">
    {selfieUrlsByVisit[visit.id].map((u, idx) => (
      // eslint-disable-next-line @next/next/no-img-element
      <img 
        key={idx} 
        src={u} 
        alt={`selfie-${idx + 1}`} 
        className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity" 
        onClick={() => window.open(u, '_blank')}
        onError={(e) => {
          console.error('Failed to load selfie image:', u);
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    ))}
  </div>
)}
```

---

## Step 5: Backend API Requirements

**POST `/api/v1/documents/presign`**
- Content-Type: `application/x-www-form-urlencoded`
- Body params:
  - `loan_application_id` (integer, optional)
  - `filename` (string, required)
  - `content_type` (string, required: "image/jpeg" | "image/png" | "image/webp")
  - `visit_type` (string, optional: "Customer Visit - House" | "Customer Visit - Outside Location")
- Response: `{ upload_url, s3_key, method, fields }`

**POST `/api/v1/documents/`**
- Content-Type: `application/json`
- Body: `FinalizeDocumentRequest` (includes `field_visit_location_id`)
- Response: `DocumentItem` (includes `url`)

**GET `/api/v1/documents/by-loan?loan_application_id=<id>`**
- Response: `DocumentItem[]` (each includes `field_visit_location_id`)

---

## Key Features
✅ Camera auto-opens ONLY after successful visit creation  
✅ Camera hides after upload (no auto-start on refresh)  
✅ Images grouped by `field_visit_location_id` under each visit  
✅ Images clickable to open in new tab  
✅ Automatic image compression (~0.7MB target)  
✅ Live camera capture only (no file upload)  
✅ Visit type included in presign for S3 path organization

---

## Notes
- Ensure `doc_category_id` for SELFIE is fetched/cached and passed as `selfieDocCategoryId`
- Backend must return signed/public URLs in finalize response for images to display
- S3 bucket CORS must allow POST from your origin

