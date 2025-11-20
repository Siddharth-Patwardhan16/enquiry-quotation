'use client';

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/trpc/client';
import { ArrowLeft, Download, Upload, AlertTriangle, Edit, DollarSign, Calendar, Shield, HelpCircle, X } from 'lucide-react';
import { useState } from 'react';
import type { AppRouter } from '@/server/api/root';
import type { inferRouterOutputs } from '@trpc/server';
import jsPDF from 'jspdf';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Use the same type as other quotation components
type Quotation = NonNullable<inferRouterOutputs<AppRouter>['quotation']['getById']>;
type QuotationItem = NonNullable<Quotation['items']>[0];

// Extended quotation type with new fields
type ExtendedQuotation = Quotation & {
  gst?: number;
  packingForwardingPercentage?: number;
  incoterms?: string;
};

export default function QuotationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quotationId = params.id as string;
  
  const [updating, setUpdating] = useState(false);
  const [showLostReasonModal, setShowLostReasonModal] = useState(false);
  const [lostReason, setLostReason] = useState('');
  const [showPOUpload, setShowPOUpload] = useState(false);

  const { data: quotation, isLoading, error } = api.quotation.getById.useQuery({ id: quotationId });

  const updateStatusMutation = api.quotation.updateStatus.useMutation({
    onSuccess: () => {
      // Refetch the quotation data
      window.location.reload();
    },
    onError: (error) => {
      alert(`Failed to update status: ${error.message}`);
    },
  });

  if (error) return <div>Error: {error.message}</div>;
  if (isLoading || !quotation) return <div>Loading...</div>;

  const extendedQuotation = quotation as ExtendedQuotation;

  const handleStatusUpdate = async (newStatus: string) => {
    if (newStatus === 'LOST') {
      setShowLostReasonModal(true);
      return;
    }

    if (newStatus === 'RECEIVED') {
      setShowPOUpload(true);
      return;
    }

    await updateQuotationStatus(newStatus);
  };

  const updateQuotationStatus = async (newStatus: string, reason?: string) => {
    setUpdating(true);
    try {
      await updateStatusMutation.mutateAsync({
        quotationId: quotationId,
        status: newStatus as 'LIVE' | 'WON' | 'LOST' | 'BUDGETARY' | 'RECEIVED' | 'DEAD',
        ...(reason && { lostReason: reason as 'PRICE' | 'DELIVERY_SCHEDULE' | 'LACK_OF_CONFIDENCE' | 'OTHER' }),
      });
    } finally {
      setUpdating(false);
      setShowLostReasonModal(false);
      setShowPOUpload(false);
      setLostReason('');
    }
  };

  const handleLostReasonSubmit = async () => {
    if (!lostReason) return;
    await updateQuotationStatus('LOST', lostReason);
  };

  const handleExportPDF = () => {
    if (!quotation) return;

    try {
      // Create a new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = 210;
      const pageHeight = 295;
      let yPosition = 20;

      // Helper function to add text with word wrapping
      const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth) as string[];
        pdf.text(lines, x, y);
        return y + (lines.length * fontSize * 0.4);
      };

      // Helper function to check if we need a new page
      const checkNewPage = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
          return true;
        }
        return false;
      };

      // Company Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('QUOTATION', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Quotation Details
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      
      // Left column
      const leftX = 20;
      const rightX = 120;
      
      yPosition = addText(`Quotation Number: ${quotation.quotationNumber}`, leftX, yPosition, 80);
      yPosition = addText(`Date: ${new Date(quotation.quotationDate || quotation.createdAt).toLocaleDateString()}`, leftX, yPosition, 80);
      yPosition = addText(`Valid Until: ${quotation.validityPeriod ? new Date(quotation.validityPeriod).toLocaleDateString() : 'Not specified'}`, leftX, yPosition, 80);
      
      // Right column
      let rightY = 35;
      rightY = addText(`Customer: ${quotation.enquiry?.customer?.name ?? 'Unknown Customer'}`, rightX, rightY, 80);
      rightY = addText(`Currency: ${quotation.currency || 'INR'}`, rightX, rightY, 80);
      rightY = addText(`Status: ${quotation.status}`, rightX, rightY, 80);

      yPosition = Math.max(yPosition, rightY) + 10;

      // Payment Terms and Delivery Schedule
      if (quotation.paymentTerms) {
        checkNewPage(15);
        yPosition = addText(`Payment Terms: ${quotation.paymentTerms}`, leftX, yPosition, pageWidth - 40);
      }

      if (quotation.deliverySchedule) {
        checkNewPage(15);
        yPosition = addText(`Delivery Schedule: ${quotation.deliverySchedule}`, leftX, yPosition, pageWidth - 40);
      }

      if (quotation.specialInstructions) {
        checkNewPage(20);
        yPosition = addText(`Special Instructions:`, leftX, yPosition, pageWidth - 40, 12);
        yPosition = addText(quotation.specialInstructions, leftX, yPosition + 5, pageWidth - 40);
      }

      yPosition += 10;

      // Line Items Table Header
      checkNewPage(20);
      pdf.setFont('helvetica', 'bold');
      yPosition = addText('Line Items', leftX, yPosition, pageWidth - 40, 14);
      yPosition += 5;

      // Table headers
      pdf.setFontSize(10);
      pdf.text('Description', leftX, yPosition);
      pdf.text('Qty', leftX + 80, yPosition);
      pdf.text('Unit Price', leftX + 100, yPosition);
      pdf.text('Total', leftX + 140, yPosition);
      
      // Draw line under headers
      pdf.line(leftX, yPosition + 2, pageWidth - 20, yPosition + 2);
      yPosition += 8;

      // Line Items
      pdf.setFont('helvetica', 'normal');
      let subtotal = 0;

      quotation.items?.forEach((item) => {
        checkNewPage(15);
        
        const quantity = Number(item.quantity);
        const pricePerUnit = Number(item.pricePerUnit);
        const itemTotal = quantity * pricePerUnit;
        subtotal += itemTotal;

        // Description (with wrapping)
        const descLines = pdf.splitTextToSize(item.materialDescription, 70) as string[];
        pdf.text(descLines, leftX, yPosition);
        
        // Quantity, Unit Price, Total
        pdf.text(quantity.toString(), leftX + 80, yPosition);
        pdf.text(formatCurrency(pricePerUnit), leftX + 100, yPosition);
        pdf.text(formatCurrency(itemTotal), leftX + 140, yPosition);
        
        yPosition += Math.max(descLines.length * 4, 8);
      });

      yPosition += 10;

      // Totals
      checkNewPage(25);
      const transportCosts = Number(quotation.transportCosts) || 0;
      const gstPercentage = Number(extendedQuotation?.gst) || 0;
      const gstAmount = (subtotal * gstPercentage) / 100;
      const packingForwardingPercentage = Number(extendedQuotation?.packingForwardingPercentage) || 3;
      const packingForwardingAmount = (subtotal * packingForwardingPercentage) / 100;
      const total = subtotal + transportCosts + gstAmount + packingForwardingAmount;

      pdf.setFont('helvetica', 'normal');
      pdf.text('Subtotal:', leftX + 100, yPosition);
      pdf.text(formatCurrency(subtotal), leftX + 140, yPosition);
      yPosition += 6;

      pdf.text('Transport Costs:', leftX + 100, yPosition);
      pdf.text(formatCurrency(transportCosts), leftX + 140, yPosition);
      yPosition += 6;

      pdf.text(`GST (${gstPercentage}%):`, leftX + 100, yPosition);
      pdf.text(formatCurrency(gstAmount), leftX + 140, yPosition);
      yPosition += 6;

      pdf.text(`Packing & Forwarding (${packingForwardingPercentage}%):`, leftX + 100, yPosition);
      pdf.text(formatCurrency(packingForwardingAmount), leftX + 140, yPosition);
      yPosition += 6;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Total:', leftX + 100, yPosition);
      pdf.text(formatCurrency(total), leftX + 140, yPosition);

      // Save the PDF
      pdf.save(`quotation-${quotation.quotationNumber}.pdf`);
    } catch {
      // Error generating PDF
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'DRAFT': { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      'LIVE': { color: 'bg-yellow-100 text-yellow-800', label: 'Live' },
      'WON': { color: 'bg-green-100 text-green-800', label: 'Won' },
      'LOST': { color: 'bg-red-100 text-red-800', label: 'Lost' },
      'RECEIVED': { color: 'bg-purple-100 text-purple-800', label: 'Received' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['DRAFT'];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    const currency = quotation.currency || 'INR';
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.push('/quotations')} 
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quotation {quotation.quotationNumber}
            </h1>
            <p className="text-gray-600 mt-1">
              For {quotation.enquiry?.customer?.name ?? 'Unknown Customer'}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => router.push(`/quotations/${quotationId}/edit`)}
            className="inline-flex items-center gap-2 rounded-md bg-green-100 px-4 py-2 text-green-700 hover:bg-green-200"
          >
            <Edit className="h-4 w-4" />
            Edit Quotation
          </button>
          <button 
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quotation Details */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Quotation Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Quotation Number</p>
                <p className="text-gray-900 font-medium">{quotation.quotationNumber}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Revision Number</p>
                <p className="text-gray-900">{quotation.revisionNumber || 0}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Quotation Date</p>
                <p className="text-gray-900">
                  {new Date(quotation.quotationDate || quotation.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Currency</p>
                <p className="text-gray-900">{quotation.currency || 'INR'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="text-gray-900">{quotation.enquiry?.customer?.name ?? 'Unknown Customer'}</p>
              </div>
              
              {quotation.deliverySchedule && (
                <div>
                  <p className="text-sm text-gray-500">Delivery Schedule</p>
                  <p className="text-gray-900">{quotation.deliverySchedule}</p>
                </div>
              )}
            </div>

            {/* Purchase Order Information */}
            {quotation.purchaseOrderNumber && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">Purchase Order Number</p>
                  <p className="text-gray-900 font-medium">{quotation.purchaseOrderNumber}</p>
                </div>
                
                {quotation.poValue && (
                  <div>
                    <p className="text-sm text-gray-500">PO Value</p>
                    <p className="text-gray-900 font-medium">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: quotation.currency || 'INR',
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(Number(quotation.poValue))}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Quoted Items</h2>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-3 text-left text-sm font-medium text-gray-900">Description</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-900">Specifications</th>
                    <th className="p-3 text-right text-sm font-medium text-gray-900">Quantity</th>
                    <th className="p-3 text-right text-sm font-medium text-gray-900">Unit Price</th>
                    <th className="p-3 text-right text-sm font-medium text-gray-900">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items?.map((item: QuotationItem) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-3 text-gray-900">
                        {item.materialDescription}
                      </td>
                      <td className="p-3 text-gray-500 text-sm">
                        {item.specifications ?? '-'}
                      </td>
                      <td className="p-3 text-right">
                        {item.quantity}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(Number(item.pricePerUnit))}
                      </td>
                      <td className="p-3 text-right text-gray-900">
                        {formatCurrency(Number(item.total))}
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-gray-500">
                        No line items available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-6 flex justify-end">
              <div className="w-80">
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Value:</span>
                    <span>{formatCurrency(Number(quotation.totalValue) ?? 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Status Management</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Current Status</span>
                {getStatusBadge(quotation.status)}
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Update Status</label>
                <select 
                  value={quotation.status} 
                  onChange={(e) => handleStatusUpdate(e.target.value)}
                  disabled={updating}
                  className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="LIVE">Live</option>
                  <option value="WON">Won</option>
                  <option value="LOST">Lost</option>
                  <option value="BUDGETARY">Budgetary</option>
                  <option value="RECEIVED">Received</option>
                  <option value="DEAD">Dead</option>
                </select>
              </div>

              {quotation.lostReason && (
                <div>
                  <p className="text-sm text-gray-500">Lost Reason</p>
                  <p className="text-red-600 text-sm">{quotation.lostReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Summary</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Total Value</p>
                <p className="text-xl text-gray-900">
                  {formatCurrency(Number(quotation.totalValue) || 0)}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Items Count</p>
                <p className="text-gray-900">{quotation.items?.length || 0} items</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Currency</p>
                <p className="text-gray-900">{quotation.currency || 'USD'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Quotation ID</p>
                <p className="text-xs text-gray-600 font-mono">
                  #{quotation.id?.substring(0, 8)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lost Reason Modal */}
      {showLostReasonModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] overflow-visible animate-in fade-in-0 duration-200">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-7 max-w-md w-full mx-4 relative z-[100] border border-gray-200/50 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl shadow-sm border border-orange-200/50">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Mark as Lost</h3>
                  <p className="text-sm text-gray-500 mt-1">Select the reason for this loss</p>
                </div>
              </div>
              <button
                onClick={() => setShowLostReasonModal(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200 hover:scale-110"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label htmlFor="lostReason" className="text-sm font-bold text-gray-900 mb-3 block">
                  Lost Reason <span className="text-red-500 ml-1">*</span>
                </Label>
                <Select value={lostReason} onValueChange={setLostReason}>
                  <SelectTrigger className="w-full h-12 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 hover:border-blue-300 hover:shadow-md focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200">
                    <SelectValue placeholder="Choose a reason..." />
                  </SelectTrigger>
                  <SelectContent className="z-[110] max-h-[260px] rounded-xl border-2 border-gray-200 shadow-xl bg-white">
                    <SelectItem 
                      value="PRICE" 
                      className="flex items-center gap-3 py-3.5 px-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 focus:bg-blue-50 transition-all duration-150 rounded-lg m-1"
                    >
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <DollarSign className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-900">Price</span>
                    </SelectItem>
                    <SelectItem 
                      value="DELIVERY_SCHEDULE" 
                      className="flex items-center gap-3 py-3.5 px-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 focus:bg-blue-50 transition-all duration-150 rounded-lg m-1"
                    >
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-900">Delivery Schedule</span>
                    </SelectItem>
                    <SelectItem 
                      value="LACK_OF_CONFIDENCE" 
                      className="flex items-center gap-3 py-3.5 px-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 focus:bg-blue-50 transition-all duration-150 rounded-lg m-1"
                    >
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <Shield className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-900">Lack of Confidence</span>
                    </SelectItem>
                    <SelectItem 
                      value="OTHER" 
                      className="flex items-center gap-3 py-3.5 px-4 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 focus:bg-blue-50 transition-all duration-150 rounded-lg m-1"
                    >
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <HelpCircle className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-900">Other</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200/80">
                <button 
                  onClick={() => setShowLostReasonModal(false)}
                  className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 hover:shadow-md transition-all duration-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLostReasonSubmit} 
                  disabled={!lostReason || updating}
                  className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-red-600 via-red-600 to-red-700 rounded-xl hover:from-red-700 hover:via-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {updating ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      <span>Mark as Lost</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PO Upload Modal */}
      {showPOUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative z-[100]">
            <div className="flex items-center space-x-2 mb-4">
              <Upload className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold">Upload Purchase Order</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Please upload the purchase order received from the customer.
            </p>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="mb-4">
                  <label htmlFor="po-upload" className="cursor-pointer">
                    <span className="block text-sm text-gray-600 mb-2">
                      <button 
                        type="button" 
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        Choose PO file
                      </button>
                    </span>
                    <input
                      id="po-upload"
                      name="po-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                  </label>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, or image files
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button 
                  onClick={() => setShowPOUpload(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
