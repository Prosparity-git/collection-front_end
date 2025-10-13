import { API_BASE_URL, getAuthHeaders } from '../client';

export interface ExportCollectionDataParams {
  demand_month: number;
  demand_year: number;
  format?: string;
}

export class ExportService {
  /**
   * Export collection data to Excel format
   * @param params - Export parameters including demand_month and demand_year
   * @returns Promise that resolves to the Excel file blob
   */
  static async exportCollectionData(params: ExportCollectionDataParams): Promise<Blob> {
    const { demand_month, demand_year, format = 'excel' } = params;
    
    const queryParams = new URLSearchParams({
      demand_month: demand_month.toString(),
      demand_year: demand_year.toString(),
      format
    });

    const response = await authenticatedFetch(`${API_BASE_URL}/export/collection-data?${queryParams}`, {
      method: 'GET',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Export failed: ${response.status} ${errorText}`);
    }

    return await response.blob();
  }

  /**
   * Download the exported file
   * @param blob - The file blob
   * @param filename - The filename for the download
   */
  static downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Export collection data and trigger download
   * @param params - Export parameters
   * @param filename - Optional custom filename
   */
  static async exportAndDownload(params: ExportCollectionDataParams, filename?: string): Promise<void> {
    try {
      const blob = await this.exportCollectionData(params);
      const defaultFilename = `collection_data_${params.demand_month}_${params.demand_year}.xlsx`;
      this.downloadFile(blob, filename || defaultFilename);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }
}
