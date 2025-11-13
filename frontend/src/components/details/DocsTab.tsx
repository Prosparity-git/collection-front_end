import { useState, useEffect } from "react";
import { Application } from "@/types/application";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, FileText, Loader2, AlertCircle, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { API_BASE_URL, getAuthHeaders } from "@/integrations/api/client";
import { format } from "date-fns";

interface Document {
  id: number;
  applicant_id: string;
  loan_application_id: number;
  repayment_id: number;
  field_visit_location_id: number;
  doc_category_id: number;
  file_name: string;
  s3_key: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface DocsTabProps {
  application: Application | null;
}

const DocsTab = ({ application }: DocsTabProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewDocumentId, setPreviewDocumentId] = useState<number | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!application?.loan_id) {
        setError("Loan application ID is not available");
        return;
      }

      setLoading(true);
      setError(null);
      setPreviewDocumentId(null); // Clear preview when fetching new documents

      try {
        const params = new URLSearchParams({
          loan_application_id: application.loan_id.toString(),
          doc_category_id: "11", // Static category ID for FI PDFs
        });

        const response = await fetch(`${API_BASE_URL}/documents/by-category?${params.toString()}`, {
          method: "GET",
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Failed to fetch documents: ${response.statusText}`);
        }

        const data: Document[] = await response.json();
        setDocuments(data);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [application?.loan_id]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString;
    }
  };

  if (!application) {
    return <div className="text-gray-500">No application selected</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No documents found for this application</p>
      </div>
    );
  }

  const previewDocument = documents.find(doc => doc.id === previewDocumentId);

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">FI Documents</h3>
      </div>

      {/* Document Preview Section */}
      {previewDocument && (
        <Card className="mb-4 border-2 border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base font-semibold text-gray-900">
                  {previewDocument.file_name || "Untitled Document"}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewDocumentId(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="w-full border rounded-lg overflow-hidden bg-gray-50" style={{ height: '600px' }}>
              <iframe
                src={previewDocument.url}
                className="w-full h-full border-0"
                title={previewDocument.file_name || "Document Preview"}
                style={{ minHeight: '600px' }}
              />
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => window.open(previewDocument.url, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document List */}
      <div className="grid gap-4">
        {documents.map((doc) => (
          <Card key={doc.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-semibold text-gray-900 truncate">
                      {doc.file_name || "Untitled Document"}
                    </CardTitle>
                    {doc.notes && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{doc.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  {doc.mime_type && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Type:</span>
                      <span>{doc.mime_type}</span>
                    </span>
                  )}
                  {doc.size_bytes && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Size:</span>
                      <span>{formatFileSize(doc.size_bytes)}</span>
                    </span>
                  )}
                  {doc.created_at && (
                    <span className="flex items-center gap-1">
                      <span className="font-medium">Created:</span>
                      <span>{formatDate(doc.created_at)}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                    onClick={() => setPreviewDocumentId(doc.id)}
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => window.open(doc.url, "_blank")}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DocsTab;

