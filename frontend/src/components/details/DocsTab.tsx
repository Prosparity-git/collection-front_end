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
  const [fiDocuments, setFiDocuments] = useState<Document[]>([]);
  const [lrnDocuments, setLrnDocuments] = useState<Document[]>([]);
  const [fiLoading, setFiLoading] = useState(false);
  const [lrnLoading, setLrnLoading] = useState(false);
  const [fiError, setFiError] = useState<string | null>(null);
  const [lrnError, setLrnError] = useState<string | null>(null);
  const [fiPreviewDocumentId, setFiPreviewDocumentId] = useState<number | null>(null);
  const [lrnPreviewDocumentId, setLrnPreviewDocumentId] = useState<number | null>(null);

  // Fetch FI Location Documents (doc_category_id = 11)
  useEffect(() => {
    const fetchFiDocuments = async () => {
      if (!application?.loan_id) {
        setFiError("Loan application ID is not available");
        return;
      }

      setFiLoading(true);
      setFiError(null);
      setFiPreviewDocumentId(null);

      try {
        const params = new URLSearchParams({
          loan_application_id: application.loan_id.toString(),
          doc_category_id: "11", // FI Location Document
        });

        const response = await fetch(`${API_BASE_URL}/documents/by-category?${params.toString()}`, {
          method: "GET",
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Failed to fetch FI documents: ${response.statusText}`);
        }

        const data: Document[] = await response.json();
        setFiDocuments(data);
      } catch (err) {
        console.error("Error fetching FI documents:", err);
        setFiError(err instanceof Error ? err.message : "Failed to fetch FI documents");
      } finally {
        setFiLoading(false);
      }
    };

    fetchFiDocuments();
  }, [application?.loan_id]);

  // Fetch LRN Documents (doc_category_id = 12)
  useEffect(() => {
    const fetchLrnDocuments = async () => {
      if (!application?.loan_id) {
        setLrnError("Loan application ID is not available");
        return;
      }

      setLrnLoading(true);
      setLrnError(null);
      setLrnPreviewDocumentId(null);

      try {
        const params = new URLSearchParams({
          loan_application_id: application.loan_id.toString(),
          doc_category_id: "12", // LRN Document
        });

        const response = await fetch(`${API_BASE_URL}/documents/by-category?${params.toString()}`, {
          method: "GET",
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Failed to fetch LRN documents: ${response.statusText}`);
        }

        const data: Document[] = await response.json();
        setLrnDocuments(data);
      } catch (err) {
        console.error("Error fetching LRN documents:", err);
        setLrnError(err instanceof Error ? err.message : "Failed to fetch LRN documents");
      } finally {
        setLrnLoading(false);
      }
    };

    fetchLrnDocuments();
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

  const fiPreviewDocument = fiDocuments.find(doc => doc.id === fiPreviewDocumentId);
  const lrnPreviewDocument = lrnDocuments.find(doc => doc.id === lrnPreviewDocumentId);

  // Component for rendering a document card
  const DocumentCard = ({ 
    title, 
    documents, 
    loading, 
    error, 
    previewDocumentId, 
    setPreviewDocumentId,
    previewDocument 
  }: {
    title: string;
    documents: Document[];
    loading: boolean;
    error: string | null;
    previewDocumentId: number | null;
    setPreviewDocumentId: (id: number | null) => void;
    previewDocument: Document | undefined;
  }) => {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading documents...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!loading && !error && documents.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No documents found</p>
            </div>
          )}

          {/* Document Preview Section */}
          {previewDocument && (
            <Card className="mb-4 border-2 border-blue-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-end">
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
                    title="Document Preview"
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
          {!loading && !error && documents.length > 0 && (
            <div className="grid gap-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* FI Location Document Card */}
      <DocumentCard
        title="FI Location Document"
        documents={fiDocuments}
        loading={fiLoading}
        error={fiError}
        previewDocumentId={fiPreviewDocumentId}
        setPreviewDocumentId={setFiPreviewDocumentId}
        previewDocument={fiPreviewDocument}
      />

      {/* LRN Document Card */}
      <DocumentCard
        title="LRN"
        documents={lrnDocuments}
        loading={lrnLoading}
        error={lrnError}
        previewDocumentId={lrnPreviewDocumentId}
        setPreviewDocumentId={setLrnPreviewDocumentId}
        previewDocument={lrnPreviewDocument}
      />
    </div>
  );
};

export default DocsTab;

