
import { useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Application } from '@/types/application';
import { format } from 'date-fns';
import { formatPtpDate, formatCurrency } from '@/utils/formatters';

interface ExportData {
  applications: Application[];
}

export const useExport = () => {
  const exportToExcel = useCallback((data: ExportData, fileName: string = 'applications-report') => {
    const workbook = XLSX.utils.book_new();

    // Create export data with the specified columns in exact order
    const exportData = data.applications.map(app => ({
      'Applicant ID': app.applicant_id,
      'Branch Name': app.branch_name,
      'RM Name': app.rm_name,
      'Dealer Name': app.dealer_name,
      'Applicant Name': app.applicant_name,
      'Applicant Mobile Number': app.applicant_mobile || '',
      'Applicant Current Address': app.applicant_address || '',
      'House Ownership': app.house_ownership || '',
      'Co-Applicant Name': app.co_applicant_name || '',
      'Coapplicant Mobile Number': app.co_applicant_mobile || '',
      'Coapplicant Current Address': app.co_applicant_address || '',
      'Guarantor Name': app.guarantor_name || '',
      'Guarantor Mobile Number': app.guarantor_mobile || '',
      'Guarantor Current Address': app.guarantor_address || '',
      'Reference Name': app.reference_name || '',
      'Reference Mobile Number': app.reference_mobile || '',
      'Reference Address': app.reference_address || '',
      'FI Submission Location': app.fi_location || '',
      'Demand Date': app.demand_date || '',
      'Repayment': app.repayment || '',
      'Principle Due': app.principle_due || 0,
      'Interest Due': app.interest_due || 0,
      'EMI': app.emi_amount,
      'Last Month Bounce': app.last_month_bounce || 0,
      'Lender Name': app.lender_name,
      'Status': app.field_status || 'Unpaid', // Renamed from LMS Status to Status
      'Team Lead': app.team_lead
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    
    // Set column widths for better readability
    const colWidths = [
      { wch: 20 }, // Applicant ID
      { wch: 20 }, // Branch Name
      { wch: 20 }, // RM Name
      { wch: 25 }, // Dealer Name
      { wch: 25 }, // Applicant Name
      { wch: 15 }, // Applicant Mobile Number
      { wch: 30 }, // Applicant Current Address
      { wch: 15 }, // House Ownership
      { wch: 25 }, // Co-Applicant Name
      { wch: 15 }, // Coapplicant Mobile Number
      { wch: 30 }, // Coapplicant Current Address
      { wch: 25 }, // Guarantor Name
      { wch: 15 }, // Guarantor Mobile Number
      { wch: 30 }, // Guarantor Current Address
      { wch: 25 }, // Reference Name
      { wch: 15 }, // Reference Mobile Number
      { wch: 30 }, // Reference Address
      { wch: 20 }, // FI Submission Location
      { wch: 12 }, // Demand Date
      { wch: 15 }, // Repayment
      { wch: 12 }, // Principle Due
      { wch: 12 }, // Interest Due
      { wch: 12 }, // EMI
      { wch: 15 }, // Last Month Bounce
      { wch: 25 }, // Lender Name
      { wch: 12 }, // Status
      { wch: 20 }  // Team Lead
    ];
    
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');

    // Export the file
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    XLSX.writeFile(workbook, `${fileName}-${timestamp}.xlsx`);
  }, []);

  const exportToCSV = useCallback((data: ExportData, fileName: string = 'applications-report') => {
    // Create export data with the specified columns in exact order
    const csvData = data.applications.map(app => ({
      'Applicant ID': app.applicant_id,
      'Branch Name': app.branch_name,
      'RM Name': app.rm_name,
      'Dealer Name': app.dealer_name,
      'Applicant Name': app.applicant_name,
      'Applicant Mobile Number': app.applicant_mobile || '',
      'Applicant Current Address': app.applicant_address || '',
      'House Ownership': app.house_ownership || '',
      'Co-Applicant Name': app.co_applicant_name || '',
      'Coapplicant Mobile Number': app.co_applicant_mobile || '',
      'Coapplicant Current Address': app.co_applicant_address || '',
      'Guarantor Name': app.guarantor_name || '',
      'Guarantor Mobile Number': app.guarantor_mobile || '',
      'Guarantor Current Address': app.guarantor_address || '',
      'Reference Name': app.reference_name || '',
      'Reference Mobile Number': app.reference_mobile || '',
      'Reference Address': app.reference_address || '',
      'FI Submission Location': app.fi_location || '',
      'Demand Date': app.demand_date || '',
      'Repayment': app.repayment || '',
      'Principle Due': app.principle_due || 0,
      'Interest Due': app.interest_due || 0,
      'EMI': app.emi_amount,
      'Last Month Bounce': app.last_month_bounce || 0,
      'Lender Name': app.lender_name,
      'Status': app.field_status || 'Unpaid', // Renamed from LMS Status to Status
      'Team Lead': app.team_lead
    }));

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Applications');
    
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    XLSX.writeFile(workbook, `${fileName}-${timestamp}.csv`);
  }, []);

  return {
    exportToExcel,
    exportToCSV
  };
};
