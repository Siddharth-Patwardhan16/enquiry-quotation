'use client';

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/trpc/client';
import { ArrowLeft, Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const quotationId = params.id as string;
  
  const [formData, setFormData] = useState({
    quotationNumber: '',
    revisionNumber: 0,
    quotationDate: '',
    validityPeriod: '',
    paymentTerms: '',
    deliverySchedule: '',
    specialInstructions: '',
    currency: 'INR',
    transportCosts: 0,
    gst: 0,
    packingForwardingPercentage: 3,
    incoterms: '',
  });
  
  const [items, setItems] = useState<Array<{
    materialDescription: string;
    specifications: string;
    quantity: number;
    pricePerUnit: number;
  }>>([]);

  const { data: quotation, isLoading, error } = api.quotation.getById.useQuery({ id: quotationId });

  const updateQuotationMutation = api.quotation.update.useMutation({
    onSuccess: () => {
      router.push(`/quotations/${quotationId}`);
    },
    onError: (error) => {
      alert(`Failed to update quotation: ${error.message}`);
    },
  });

  useEffect(() => {
    if (quotation) {
      setFormData({
        quotationNumber: quotation.quotationNumber,
        revisionNumber: quotation.revisionNumber || 0,
        quotationDate: quotation.quotationDate ? new Date(quotation.quotationDate).toISOString().split('T')[0] : '',
        validityPeriod: quotation.validityPeriod ? new Date(quotation.validityPeriod).toISOString().split('T')[0] : '',
        paymentTerms: quotation.paymentTerms ?? '',
        deliverySchedule: quotation.deliverySchedule ?? '',
        specialInstructions: quotation.specialInstructions ?? '',
        currency: quotation.currency ?? 'INR',
        transportCosts: Number(quotation.transportCosts) ?? 0,
        gst: Number(quotation.gst) ?? 0,
        packingForwardingPercentage: Number(quotation.packingForwardingPercentage) ?? 3,
        incoterms: quotation.incoterms ?? '',
      });

      setItems(quotation.items?.map(item => ({
        materialDescription: item.materialDescription,
        specifications: item.specifications ?? '',
        quantity: Number(item.quantity),
        pricePerUnit: Number(item.pricePerUnit),
      })) ?? []);
    }
  }, [quotation]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      materialDescription: '',
      specifications: '',
      quantity: 1,
      pricePerUnit: 0,
    }]);
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    if (!quotation?.enquiryId) {
      alert('Enquiry ID is missing');
      return;
    }

    try {
      await updateQuotationMutation.mutateAsync({
        id: quotationId,
        enquiryId: quotation.enquiryId,
        quotationNumber: formData.quotationNumber,
        revisionNumber: formData.revisionNumber,
        quotationDate: formData.quotationDate,
        validityPeriod: formData.validityPeriod,
        paymentTerms: formData.paymentTerms,
        deliverySchedule: formData.deliverySchedule,
        specialInstructions: formData.specialInstructions,
        currency: formData.currency,
        transportCosts: formData.transportCosts,
        gst: formData.gst,
        packingForwardingPercentage: formData.packingForwardingPercentage,
        incoterms: formData.incoterms,
        items,
      });
    } catch {
      // Error is handled by the mutation
    }
  };

  if (error) return <div>Error: {error.message}</div>;
  if (isLoading || !quotation) return <div>Loading...</div>;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.push(`/quotations/${quotationId}`)} 
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Edit Quotation {quotation.quotationNumber}
            </h1>
            <p className="text-gray-600 mt-1">
              For {quotation.enquiry.customer.name}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => router.push(`/quotations/${quotationId}`)}
            className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={updateQuotationMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {updateQuotationMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quotation Number *
              </label>
              <input
                type="text"
                value={formData.quotationNumber}
                onChange={(e) => handleInputChange('quotationNumber', e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Revision Number
              </label>
              <input
                type="number"
                value={formData.revisionNumber}
                onChange={(e) => handleInputChange('revisionNumber', parseInt(e.target.value) || 0)}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quotation Date
              </label>
              <input
                type="date"
                value={formData.quotationDate}
                onChange={(e) => handleInputChange('quotationDate', e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={formData.validityPeriod}
                onChange={(e) => handleInputChange('validityPeriod', e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Terms
            </label>
            <input
              type="text"
              value={formData.paymentTerms}
              onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 30 days from invoice date"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Schedule
            </label>
            <input
              type="text"
              value={formData.deliverySchedule}
              onChange={(e) => handleInputChange('deliverySchedule', e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 4-6 weeks from order confirmation"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Instructions
            </label>
            <textarea
              value={formData.specialInstructions}
              onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Any special instructions or terms..."
            />
          </div>

          {/* Commercial Terms */}
          <div className="mt-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Commercial Terms</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   Transport Costs
                 </label>
                 <input
                   type="number"
                   step="0.01"
                   min="0"
                   value={formData.transportCosts}
                   onChange={(e) => handleInputChange('transportCosts', parseFloat(e.target.value) || 0)}
                   className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 />
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">
                   GST (%)
                 </label>
                 <input
                   type="number"
                   step="0.1"
                   min="0"
                   max="100"
                   value={formData.gst}
                   onChange={(e) => handleInputChange('gst', parseFloat(e.target.value) || 0)}
                   className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 />
                 <p className="text-xs text-gray-500 mt-1">Percentage of base price</p>
               </div>
             </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Packing and Forwarding (%)
                </label>
                <select
                  value={formData.packingForwardingPercentage}
                  onChange={(e) => handleInputChange('packingForwardingPercentage', parseFloat(e.target.value) || 3)}
                  className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="0">0%</option>
                  <option value="0.5">0.5%</option>
                  <option value="1">1%</option>
                  <option value="1.5">1.5%</option>
                  <option value="2">2%</option>
                  <option value="2.5">2.5%</option>
                  <option value="3">3%</option>
                  <option value="3.5">3.5%</option>
                  <option value="4">4%</option>
                  <option value="4.5">4.5%</option>
                  <option value="5">5%</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Percentage of base price (0-5%)</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Incoterms
                </label>
                <input
                  type="text"
                  value={formData.incoterms}
                  onChange={(e) => handleInputChange('incoterms', e.target.value)}
                  placeholder="e.g., FOB, CIF, EXW, etc."
                  className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">International commercial terms</p>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Line Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Item {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Material Description *
                    </label>
                    <input
                      type="text"
                      value={item.materialDescription}
                      onChange={(e) => handleItemChange(index, 'materialDescription', e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specifications
                    </label>
                    <input
                      type="text"
                      value={item.specifications}
                      onChange={(e) => handleItemChange(index, 'specifications', e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price Per Unit *
                    </label>
                    <input
                      type="number"
                      value={item.pricePerUnit}
                      onChange={(e) => handleItemChange(index, 'pricePerUnit', parseFloat(e.target.value) || 0)}
                      className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                <div className="mt-2 text-right">
                  <span className="text-sm text-gray-500">
                    Total: {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: formData.currency,
                      minimumFractionDigits: 2,
                    }).format(item.quantity * item.pricePerUnit)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
                    <p>No items added yet. Click &quot;Add Item&quot; to start.</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
