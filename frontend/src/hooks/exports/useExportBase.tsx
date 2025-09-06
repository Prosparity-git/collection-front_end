
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export interface ExportData {
  applications: any[];
}

export const useExportBase = () => {
  const formatCommentTrail = useCallback((comments: Array<{content: string; user_name: string}>) => {
    if (!comments || comments.length === 0) {
      return 'No comments';
    }
    
    return comments
      .map(comment => `${comment.user_name}: ${comment.content}`)
      .join(' | ');
  }, []);

  const createWorkbook = useCallback((data: any[], sheetName: string, fileName: string, colWidths?: Array<{wch: number}>) => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    if (colWidths) {
      worksheet['!cols'] = colWidths;
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    XLSX.writeFile(workbook, `${fileName}-${timestamp}.xlsx`);
  }, []);

  return {
    formatCommentTrail,
    createWorkbook
  };
};
