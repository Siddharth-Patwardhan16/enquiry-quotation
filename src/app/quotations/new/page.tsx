'use client';

import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateQuotationSchema } from '@/lib/validators/quotation';
import type { z } from 'zod';
import { api } from '@/trpc/client';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save } from 'lucide-react';
import { useState } from 'react';

// Generate a unique quotation number
const generateQuotationNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);
  return `Q${year}${month}${timestamp}`;
};

type FormData = z.infer<typeof CreateQuotationSchema>;

export default function NewQuotationPage() {
  const router = useRouter();
  const [customPaymentPlan, setCustomPaymentPlan] = useState<string>('');
  const [customPaymentError, setCustomPaymentError] = useState<string>('');
  const [quotationNumberError, setQuotationNumberError] = useState<string>('');
  const [isCheckingQuotationNumber, setIsCheckingQuotationNumber] = useState(false);
  
  // Fetch enquiries to populate the dropdown
  const { data: enquiries, isLoading: isLoadingEnquiries } = api.enquiry.getAll.useQuery();

  const {
    register,
    handleSubmit,
    control, // Control object from useForm is needed for useFieldArray
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(CreateQuotationSchema),
    defaultValues: {
      quotationNumber: generateQuotationNumber(),
      currency: 'USD',
      revisionNumber: 0,
      transportCosts: 0,
      insuranceCosts: 0,
      gst: 0,
      items: [{ materialDescription: '', quantity: 1, pricePerUnit: 0 }],
    },
  });

  // Watch the items to calculate totals in real-time
  const watchedItems = watch('items') || [];
  const currency = watch('currency') || 'USD';
  const watchedPaymentTerms = watch('paymentTerms');
  
  // Check for duplicate quotation numbers
  const checkDuplicateQuotationNumber = api.quotation.checkDuplicateNumber.useMutation();
  
  // Debug: Log when the mutation changes
  console.log('TRPC Mutation State:', {
    data: checkDuplicateQuotationNumber.data,
    isPending: checkDuplicateQuotationNumber.isPending,
    error: checkDuplicateQuotationNumber.error,
  });

  // Calculate totals
  const totalBasicPrice = watchedItems.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const pricePerUnit = Number(item.pricePerUnit) || 0;
    return sum + (quantity * pricePerUnit);
  }, 0);
  
  // Watch commercial terms for grand total calculation
  const transportCosts = Number(watch('transportCosts')) || 0;
  const insuranceCosts = Number(watch('insuranceCosts')) || 0;
  const gst = Number(watch('gst')) || 0;
  
  // Calculate grand total including commercial terms
  const grandTotal = totalBasicPrice + transportCosts + insuranceCosts + gst;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Parse custom payment plan (e.g., "30-30-40" -> [30, 30, 40])
  const parseCustomPaymentPlan = (input: string) => {
    if (!input.trim()) return null;
    
    const percentages = input.split('-').map(p => p.trim()).filter(p => p);
    const numbers = percentages.map(p => {
      const num = parseFloat(p);
      return isNaN(num) ? null : num;
    }).filter((num): num is number => num !== null);
    
    // Validate that all percentages are positive and sum to 100
    if (numbers.length === 0) return null;
    if (numbers.some(n => n <= 0)) return null;
    
    const total = numbers.reduce((sum, n) => sum + n, 0);
    if (Math.abs(total - 100) > 0.01) return null; // Allow small rounding errors
    
    return numbers;
  };

  // Handle custom payment plan input
  const handleCustomPaymentPlanChange = (value: string) => {
    setCustomPaymentPlan(value);
    setCustomPaymentError('');
    
    const percentages = parseCustomPaymentPlan(value);
    if (percentages) {
      // Create a structured payment plan description
      const planDescription = percentages.map((p, i) => `${p}%`).join('-');
      setValue('paymentTerms', `Custom Plan (${planDescription})`);
    } else if (value.trim()) {
      setCustomPaymentError('Please enter valid percentages that sum to 100 (e.g., 30-30-40)');
    }
  };

  // Handle quotation number change and check for duplicates
  const handleQuotationNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('Quotation number changed to:', value); // Debug log
    setQuotationNumberError(''); // Clear previous errors
    
    if (value.trim()) {
      setIsCheckingQuotationNumber(true);
      console.log('Checking for duplicates...'); // Debug log
      // Use a timeout to debounce the API call
      setTimeout(() => {
        checkDuplicateQuotationNumber.mutate(
          { quotationNumber: value },
          {
            onSuccess: (result) => {
              console.log('Duplicate check result:', result); // Debug log
              if (result?.exists) {
                const errorMsg = `Quotation number "${value}" already exists. Please use a different number.`;
                console.log('Setting error:', errorMsg); // Debug log
                setQuotationNumberError(errorMsg);
              }
              setIsCheckingQuotationNumber(false);
            },
            onError: (error) => {
              console.error('Error checking duplicate:', error);
              setIsCheckingQuotationNumber(false);
            }
          }
        );
      }, 500); // 500ms delay
    } else {
      setIsCheckingQuotationNumber(false);
    }
  };

  // Generate payment plan details for custom plans
  const generateCustomPaymentDetails = (percentages: number[]) => {
    const milestones = [
      'Advance Payment: Due upon confirmation of the purchase order to secure the order and commence work.',
      'Mid-Project Payment: Due upon completion of manufacturing and prior to dispatch.',
      'Final Payment: Due upon completion and prior to shipment.'
    ];
    
    // Extend milestones if we have more than 3 payments
    while (milestones.length < percentages.length) {
      milestones.push(`Payment ${milestones.length + 1}: Due upon completion of phase ${milestones.length + 1}.`);
    }
    
    return {
      title: `Custom Payment Plan (${percentages.map(p => `${p}%`).join('-')})`,
      description: 'Custom payment plan with specified percentages',
      percentages: percentages,
      milestones: percentages.map((percentage, index) => ({
        percentage: `${percentage}%`,
        description: milestones[index] || `Payment ${index + 1}: Due upon completion of phase ${index + 1}.`
      }))
    };
  };

  // useFieldArray hook to manage dynamic items
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const createQuotation = api.quotation.create.useMutation({
    onSuccess: () => {
      router.push('/quotations');
      alert('Quotation created successfully!');
    },
    onError: (error) => {
      // Handle specific error types
      if (error.message.includes('already exists')) {
        alert(`Duplicate quotation number: ${error.message}`);
      } else {
        alert(`Failed to create quotation: ${error.message}`);
      }
    },
  });

  const onSubmit = (data: FormData) => {
    // Prevent submission if there's a duplicate quotation number error
    if (quotationNumberError) {
      return;
    }
    createQuotation.mutate(data);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Quotation</h1>
        <p className="text-gray-600">Create a detailed quotation with multiple line items</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Main Quotation Details */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Quotation Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quotation Number <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input 
                    {...register('quotationNumber')} 
                    onChange={handleQuotationNumberChange}
                    placeholder="e.g., QT-2024-001"
                    className={`w-full rounded-md border p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      quotationNumberError ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {(isCheckingQuotationNumber || checkDuplicateQuotationNumber.isPending) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {!isCheckingQuotationNumber && !quotationNumberError && watch('quotationNumber') && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="text-green-600">✓</div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newNumber = generateQuotationNumber();
                    setValue('quotationNumber', newNumber);
                    setQuotationNumberError(''); // Clear any existing errors
                  }}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md"
                  title="Generate new quotation number"
                >
                  🔄
                </button>
              </div>
              {quotationNumberError && (
                <p className="text-red-500 text-sm mt-1">{quotationNumberError}</p>
              )}
              {errors.quotationNumber && <p className="text-red-500 text-sm mt-1">{errors.quotationNumber.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Revision Number
              </label>
              <input 
                {...register('revisionNumber')} 
                placeholder="e.g., Rev. 1, Rev. 2"
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quotation Date
              </label>
              <input 
                type="date"
                {...register('quotationDate')} 
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid Until
              </label>
              <input 
                type="date"
                {...register('validityPeriod')} 
                defaultValue={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enquiry <span className="text-red-500">*</span>
              </label>
              <select 
                {...register('enquiryId')} 
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{isLoadingEnquiries ? "Loading..." : "Select Enquiry"}</option>
                {enquiries?.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.customer?.name} - {e.subject}
                  </option>
                ))}
              </select>
              {errors.enquiryId && <p className="text-red-500 text-sm mt-1">{errors.enquiryId.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select 
                {...register('currency')} 
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Terms <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customPaymentPlan}
                onChange={(e) => handleCustomPaymentPlanChange(e.target.value)}
                placeholder="Enter payment plan (e.g., 30-30-40)"
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {customPaymentError && (
                <p className="text-red-500 text-sm mt-1">{customPaymentError}</p>
              )}
              {customPaymentPlan && !customPaymentError && parseCustomPaymentPlan(customPaymentPlan) && (
                <p className="text-green-600 text-sm mt-1">
                  ✓ Valid payment plan: {parseCustomPaymentPlan(customPaymentPlan)?.map(p => `${p}%`).join('-')}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Enter percentages separated by hyphens that sum to 100 (e.g., 30-30-40, 50-50, 25-25-25-25)
              </p>
              
              {/* Payment Plan Details Display */}
              {watchedPaymentTerms && watchedPaymentTerms.startsWith('Custom Plan') && parseCustomPaymentPlan(customPaymentPlan) && (
                <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  {(() => {
                    const percentages = parseCustomPaymentPlan(customPaymentPlan);
                    if (!percentages) return null;
                    
                    const paymentDetails = generateCustomPaymentDetails(percentages);
                    
                    return (
                      <>
                        <h4 className="font-semibold text-blue-900 mb-2">
                          {paymentDetails.title}
                        </h4>
                        <p className="text-sm text-blue-700 mb-3">
                          {paymentDetails.description}
                        </p>
                        <div className="space-y-2">
                          {paymentDetails.milestones.map((milestone, index) => {
                            const amount = (grandTotal * percentages[index]) / 100;
                            
                            return (
                              <div key={index} className="flex items-start gap-3">
                                <span className="inline-flex items-center justify-center w-12 h-6 text-xs font-bold text-white bg-blue-600 rounded-full flex-shrink-0">
                                  {milestone.percentage}
                                </span>
                                <div className="flex-1">
                                  <p className="text-sm text-blue-800">{milestone.description}</p>
                                  <p className="text-xs text-blue-600 font-medium mt-1">
                                    Amount: {formatCurrency(amount)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Payment Summary */}
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <h5 className="font-medium text-green-900 mb-2">Payment Summary</h5>
                          <div className="space-y-1">
                            {percentages.map((percentage, index) => {
                              const amount = (grandTotal * percentage) / 100;
                              return (
                                <div key={index} className="flex justify-between text-sm">
                                  <span className="text-green-700">Payment {index + 1} ({percentage}%):</span>
                                  <span className="font-medium text-green-900">{formatCurrency(amount)}</span>
                                </div>
                              );
                            })}
                            <div className="border-t border-green-200 pt-1 mt-2">
                              <div className="flex justify-between font-medium">
                                <span className="text-green-900">Total:</span>
                                <span className="text-green-900">{formatCurrency(grandTotal)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Schedule
              </label>
              <input 
                {...register('deliverySchedule')} 
                placeholder="e.g., 2-3 weeks after order confirmation"
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Instructions
            </label>
            <textarea
              {...register('specialInstructions')} 
              rows={3}
              placeholder="Any special terms, conditions, or instructions..."
              className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>

          {/* Commercial Terms */}
          <div className="mt-6">
            <h3 className="text-md font-semibold text-gray-900 mb-3">Commercial Terms</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transport Costs
                </label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('transportCosts')} 
                  placeholder="0.00"
                  className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Costs
                </label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('insuranceCosts')} 
                  placeholder="0.00"
                  className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST
                </label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('gst')} 
                  placeholder="0.00"
                  className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Line Items */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Line Items</h2>
            <button 
              type="button" 
              onClick={() => append({ materialDescription: '', quantity: 1, pricePerUnit: 0 })} 
              className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>
          
          {fields.map((field, index) => {
            const item = watchedItems[index];
            const quantity = Number(item?.quantity) || 0;
            const pricePerUnit = Number(item?.pricePerUnit) || 0;
            const itemTotal = quantity * pricePerUnit;
            
                         return (
               <div key={field.id} className="space-y-4 border-b border-gray-200 pb-4 mb-4">
                 {/* First Row: Description, Quantity, Price/Unit, Total, Remove */}
                 <div className="grid grid-cols-1 md:grid-cols-6 items-end gap-4">
                   <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Description <span className="text-red-500">*</span>
                     </label>
                     <input 
                       {...register(`items.${index}.materialDescription`)} 
                       placeholder="Material or service description"
                       className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                     />
                     {errors.items?.[index]?.materialDescription && (
                       <p className="text-red-500 text-sm mt-1">{errors.items[index]?.materialDescription?.message}</p>
                     )}
                   </div>
                   
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Quantity <span className="text-red-500">*</span>
                     </label>
                     <input 
                       type="number" 
                       {...register(`items.${index}.quantity`)} 
                       min="1"
                       className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                     />
                     {errors.items?.[index]?.quantity && (
                       <p className="text-red-500 text-sm mt-1">{errors.items[index]?.quantity?.message}</p>
                     )}
                   </div>
                   
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Price/Unit <span className="text-red-500">*</span>
                     </label>
                     <input 
                       type="number" 
                       {...register(`items.${index}.pricePerUnit`)} 
                       min="0"
                       step="0.01"
                       className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                     />
                     {errors.items?.[index]?.pricePerUnit && (
                       <p className="text-red-500 text-sm mt-1">{errors.items[index]?.pricePerUnit?.message}</p>
                     )}
                   </div>
                   
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Total
                     </label>
                     <div className="w-full rounded-md border border-gray-300 p-2 bg-gray-50 text-gray-900 font-medium">
                       {formatCurrency(itemTotal)}
                     </div>
                   </div>
                   
                   {fields.length > 1 && (
                     <button 
                       type="button" 
                       onClick={() => remove(index)} 
                       className="rounded-md bg-red-600 p-2 text-white hover:bg-red-700"
                       title="Remove item"
                     >
                       <Trash2 className="h-4 w-4" />
                     </button>
                   )}
                 </div>
                 
                 {/* Second Row: Technical Specifications */}
                 <div className="md:col-span-full">
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Technical Specifications
                   </label>
                   <textarea 
                     {...register(`items.${index}.specifications`)} 
                     placeholder="Detailed technical specifications, requirements, and specifications..."
                     rows={3}
                     className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical" 
                   />
                 </div>
               </div>
             );
          })}
          
          {errors.items && <p className="text-red-500 text-sm">{errors.items.message}</p>}
          
                     {/* Summary Section */}
           <div className="mt-6 bg-gray-50 rounded-lg p-4">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Quotation Summary</h3>
             <div className="space-y-3">
               <div className="flex justify-between text-sm">
                 <span className="text-gray-600">Total Basic Price:</span>
                 <span className="font-medium text-gray-900">{formatCurrency(totalBasicPrice)}</span>
               </div>
               
               <div className="flex justify-between text-sm">
                 <span className="text-gray-600">Transport Costs:</span>
                 <span className="font-medium text-gray-900">{formatCurrency(transportCosts)}</span>
               </div>
               
               <div className="flex justify-between text-sm">
                 <span className="text-gray-600">Insurance Costs:</span>
                 <span className="font-medium text-gray-900">{formatCurrency(insuranceCosts)}</span>
               </div>
               
               <div className="flex justify-between text-sm">
                 <span className="text-gray-600">GST:</span>
                 <span className="font-medium text-gray-900">{formatCurrency(gst)}</span>
               </div>
               
               <div className="border-t pt-2 flex justify-between">
                 <span className="text-lg font-semibold text-gray-900">Grand Total:</span>
                 <span className="text-lg font-semibold text-gray-900">{formatCurrency(grandTotal)}</span>
               </div>
             </div>
           </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={createQuotation.isPending || !!quotationNumberError} 
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {createQuotation.isPending ? 'Saving...' : 'Save Quotation'}
          </button>
        </div>
      </form>
    </div>
  );
}
