'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, FileSpreadsheet, X } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (_data: ImportedCustomer[]) => void;
}

interface ImportedCustomer {
  name: string;
  designation?: string;
  phoneNumber?: string;
  emailId?: string;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const { success, error: showError } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [importedData, setImportedData] = useState<ImportedCustomer[]>([]);
  const [previewData, setPreviewData] = useState<ImportedCustomer[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportedData([]);
    setPreviewData([]);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let data: ImportedCustomer[] = [];

      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        data = await parseExcelFile(file);
      } else if (fileExtension === 'docx' || fileExtension === 'doc') {
        data = await parseWordFile(file);
      } else {
        throw new Error('Unsupported file format. Please upload Excel (.xlsx, .xls) or Word (.docx, .doc) files.');
      }

      setImportedData(data);
      setPreviewData(data.slice(0, 5)); // Show first 5 rows as preview
      success('File Imported', `Successfully imported ${data.length} customer records`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import file';
      showError('Import Failed', errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseExcelFile = async (file: File): Promise<ImportedCustomer[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Skip header row and convert to our format
          const customers: ImportedCustomer[] = jsonData.slice(1).map((row: unknown) => {
            const rowArray = row as unknown[];
            return {
              name: (rowArray[0] as string) ?? '',
              designation: (rowArray[1] as string) ?? '',
              phoneNumber: (rowArray[2] as string) ?? '',
              emailId: (rowArray[3] as string) ?? '',
            };
          }).filter(customer => customer.name); // Only include rows with names

          resolve(customers);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const parseWordFile = async (file: File): Promise<ImportedCustomer[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });
          const text = result.value;

          // Parse the text to extract customer data
          // This is a simple parser - you might need to adjust based on your Word document format
          const lines = text.split('\n').filter(line => line.trim());
          const customers: ImportedCustomer[] = [];

          for (let i = 0; i < lines.length; i += 4) {
            const name = lines[i]?.trim();
            const designation = lines[i + 1]?.trim();
            const phoneNumber = lines[i + 2]?.trim();
            const emailId = lines[i + 3]?.trim();

            if (name) {
              customers.push({
                name,
                designation: designation ?? '',
                phoneNumber: phoneNumber ?? '',
                emailId: emailId ?? '',
              });
            }
          }

          resolve(customers);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleImport = () => {
    if (importedData.length > 0) {
      onImport(importedData);
      onClose();
      setImportedData([]);
      setPreviewData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClose = () => {
    onClose();
    setImportedData([]);
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Import Customer Details</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* File Upload Section */}
          <div className="mb-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.docx,.doc"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Excel (.xlsx, .xls) or Word (.docx, .doc) files
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <FileSpreadsheet className="w-4 h-4 mr-1" />
                    Excel
                  </div>
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-1" />
                    Word
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Processing file...</span>
            </div>
          )}

          {/* Preview Section */}
          {previewData.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-4">
                Preview ({importedData.length} records found)
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Designation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.map((customer, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.designation ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.phoneNumber ?? '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {customer.emailId ?? '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importedData.length > 5 && (
                <p className="text-sm text-gray-500 mt-2">
                  Showing first 5 records. {importedData.length - 5} more records will be imported.
                </p>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">File Format Instructions</h4>
            <div className="text-sm text-blue-800">
              <p className="mb-2">For Excel files, ensure your data is in the following format:</p>
              <div className="bg-white p-3 rounded border text-xs font-mono">
                Row 1: Name | Designation | Phone Number | Email ID<br />
                Row 2: John Doe | Manager | +91 9876543210 | john@company.com<br />
                Row 3: Jane Smith | Director | +91 9876543211 | jane@company.com
              </div>
              <p className="mt-2">For Word files, ensure each customer&apos;s details are on separate lines in the same order.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importedData.length === 0}
              className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import {importedData.length} Records
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
