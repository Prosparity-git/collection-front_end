import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Camera, Check, X } from 'lucide-react';
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
        try {
          await videoRef.current.play();
        } catch (playError) {
          // Ignore play() interruption errors - they're harmless
          // This can happen when the video element is reset or stream changes
        }
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
    // Immediately restart camera for retake
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="relative w-full aspect-square bg-gray-50 border rounded-lg flex items-center justify-center overflow-hidden">
          {previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="preview" className="object-cover w-full h-full" />
              {/* Red cross button on top right corner to retake */}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                onClick={reset}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          )}
        </div>

        {/* Actions */}
        {!isCameraOn ? (
          <Button onClick={startCamera} disabled={isUploading} className="w-full h-12">
            <Camera className="h-4 w-4 mr-2" /> Start Camera
          </Button>
        ) : !previewUrl ? (
          <Button onClick={capturePhoto} disabled={isUploading} className="w-full h-12">
            <Camera className="h-4 w-4 mr-2" /> Capture
          </Button>
        ) : (
          <Button onClick={doUpload} disabled={isUploading} className="w-full h-12 bg-green-600 hover:bg-green-700 text-white">
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" /> Done
              </>
            )}
          </Button>
        )}

        {error && <div className="text-xs text-red-600">{error}</div>}
      </CardContent>
    </Card>
  );
}

export default SelfieUploader;

