import { Customer } from '../_types/customer.types';
import { generateCustomerExportData } from './customerHelpers';

/**
 * Export customers to CSV format
 */
export function exportCustomersToCSV(customers: Customer[], filename?: string): void {
  if (customers.length === 0) {
    alert('No customers to export');
    return;
  }

  const exportData = generateCustomerExportData(customers);
  const headers = Object.keys(exportData[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...exportData.map(row => 
      headers.map(header => {
        const value = (row as Record<string, string>)[header];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
    link.setAttribute('download', filename ?? `customers-export-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export customers to Excel format (using SheetJS)
 */
export async function exportCustomersToExcel(customers: Customer[], filename?: string): Promise<void> {
  try {
    // Dynamic import to avoid bundling SheetJS in the main bundle
    const XLSX = await import('xlsx');
    
    if (customers.length === 0) {
      alert('No customers to export');
      return;
    }

    const exportData = generateCustomerExportData(customers);
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData as Record<string, string>[]);
    
    // Set column widths
    const columnWidths = [
      { wch: 25 }, // Customer Name
      { wch: 20 }, // Designation
      { wch: 15 }, // Phone Number
      { wch: 30 }, // Email ID
      { wch: 12 }, // Created Date
      { wch: 12 }, // Is New Customer
      { wch: 30 }, // Office Locations
      { wch: 30 }, // Plant Locations
    ];
    worksheet['!cols'] = columnWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');
    
    // Generate and download file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename ?? `customers-export-${new Date().toISOString().split('T')[0]}.xlsx`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Error exporting to Excel. Please try CSV export instead.');
  }
}

/**
 * Export customers to JSON format
 */
export function exportCustomersToJSON(customers: Customer[], filename?: string): void {
  if (customers.length === 0) {
    alert('No customers to export');
    return;
  }

  const exportData = {
    exportDate: new Date().toISOString(),
    totalCount: customers.length,
    customers: customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      designation: customer.designation,
      phoneNumber: customer.phoneNumber,
      emailId: customer.emailId,
      isNew: customer.isNew,
      createdAt: customer.createdAt,
      locations: customer.locations,
      contacts: customer.contacts,
    })),
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
    link.setAttribute('download', filename ?? `customers-export-${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Get export options for the export dropdown
 */
export function getExportOptions() {
  return [
    {
      label: 'Export as CSV',
      value: 'csv',
      description: 'Comma-separated values file',
      action: exportCustomersToCSV,
    },
    {
      label: 'Export as Excel',
      value: 'excel',
      description: 'Microsoft Excel file (.xlsx)',
      action: exportCustomersToExcel,
    },
    {
      label: 'Export as JSON',
      value: 'json',
      description: 'JSON data file',
      action: exportCustomersToJSON,
    },
  ];
}
