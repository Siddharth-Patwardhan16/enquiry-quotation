'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateQuotationSchema } from '@/lib/validators/quotation';
import type { z } from 'zod';
import { api } from '@/trpc/client';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { useFormConfirmation } from '@/hooks/useFormConfirmation';
import { useToastContext } from '@/components/providers/ToastProvider';
import type { AppRouter } from '@/server/api/root';
import type { inferRouterOutputs } from '@trpc/server';

// Use the same type as other enquiry components
type Enquiry = inferRouterOutputs<AppRouter>['enquiry']['getAll'][0];

// Quotation number will be auto-assigned from the selected enquiry

type FormData = z.infer<typeof CreateQuotationSchema>;

export default function NewQuotationPage() {
  const router = useRouter();
  const { confirmFormClose } = useFormConfirmation();
  const { success, error: showError } = useToastContext();
  
  // Fetch enquiries to populate the dropdown
  const { data: enquiries, isLoading: isLoadingEnquiries } = api.enquiry.getAll.useQuery();

  const {
    register,
    handleSubmit,
    control, // Control object from useForm is needed for useFieldArray
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(CreateQuotationSchema),
    defaultValues: {
      currency: 'INR',
      revisionNumber: 0,
      items: [],
    },
  });

  // Watch the selected enquiry to get its quotation number
  const selectedEnquiryId = watch('enquiryId');
  const selectedEnquiry = enquiries?.find(e => e.id === selectedEnquiryId);
  
  // Watch the items to calculate totals in real-time
  const watchedItems = watch('items') ?? [];
  const currency = watch('currency') ?? 'INR';
  
  // Quotation number will be auto-assigned from the selected enquiry

  // Calculate totals
  const totalBasicPrice = watchedItems.reduce((sum, item) => {
    const quantity = Number(item.quantity) ?? 0;
    const pricePerUnit = Number(item.pricePerUnit) ?? 0;
    return sum + (quantity * pricePerUnit);
  }, 0);

  const formatCurrency = (amount: number) => {
    const locale = currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Quotation number is auto-assigned from the selected enquiry

  // useFieldArray hook to manage dynamic items
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const createQuotation = api.quotation.create.useMutation({
    onSuccess: () => {
      success('Quotation Created', 'The quotation has been successfully created.');
      router.push('/quotations');
    },
    onError: (error) => {
      // Quotation creation error
      
      // Handle validation errors specifically
      if (error.data?.code === 'BAD_REQUEST') {
        try {
          const validationErrors = JSON.parse(error.message) as { path?: string[]; message: string }[];
          if (Array.isArray(validationErrors)) {
            const errorMessages = validationErrors.map((err: { path?: string[]; message: string }) => {
              if (err.path && err.path.length > 0) {
                const fieldName = err.path.join('.');
                return `${fieldName}: ${err.message}`;
              }
              return err.message;
            });
            showError('Validation Error', errorMessages.join('\n'));
          } else {
            showError('Validation Error', error.message);
          }
        } catch {
          showError('Validation Error', error.message);
        }
      } else if (error.message.includes('already exists')) {
        showError('Duplicate Error', `Duplicate quotation number: ${error.message}`);
      } else {
        showError('Creation Failed', `Failed to create quotation: ${error.message}`);
      }
    },
  });

  const onSubmit = (data: FormData) => {
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
                Quotation Number
              </label>
              <div className="w-full rounded-md border border-gray-300 p-2 bg-gray-50 text-gray-700">
                {selectedEnquiry?.quotationNumber ?? 'Select an enquiry to auto-assign quotation number'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Quotation number is automatically assigned from the selected enquiry
              </p>
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
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enquiry
              </label>
              <select 
                {...register('enquiryId')} 
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{isLoadingEnquiries ? "Loading..." : "Select Enquiry (Optional)"}</option>
                {enquiries?.map((e: Enquiry) => (
                  <option key={e.id} value={e.id}>
                    {e.company?.name} - {e.subject}
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
                Delivery Schedule
              </label>
              <input 
                {...register('deliverySchedule')} 
                placeholder="e.g., 2-3 weeks after order confirmation"
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
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
          
          {fields.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <p>No items added yet. All fields are optional - you can submit without any items.</p>
              <button
                type="button"
                onClick={() => append({ materialDescription: '', quantity: 0, pricePerUnit: 0 })}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <Plus className="h-4 w-4" />
                Add First Item
              </button>
            </div>
          ) : (
            fields.map((field, index) => {
              const item = watchedItems[index];
              const quantity = Number(item?.quantity) ?? 0;
              const pricePerUnit = Number(item?.pricePerUnit) ?? 0;
              const itemTotal = quantity * pricePerUnit;
              
              return (
                <div key={field.id} className="space-y-4 border-b border-gray-200 pb-4 mb-4">
                 {/* First Row: Description, Quantity, Price/Unit, Total, Remove */}
                 <div className="grid grid-cols-1 md:grid-cols-6 items-end gap-4">
                   <div className="md:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Description
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
                       Quantity
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
                       Price/Unit
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
            })
          )}
          
          {errors.items && <p className="text-red-500 text-sm">{errors.items.message}</p>}
          
                     {/* Summary Section */}
           <div className="mt-6 bg-gray-50 rounded-lg p-4">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Quotation Summary</h3>
             <div className="space-y-3">
               <div className="flex justify-between text-sm">
                 <span className="text-gray-600">Total Basic Price:</span>
                 <span className="font-medium text-gray-900">{formatCurrency(totalBasicPrice)}</span>
               </div>
               
               <div className="border-t pt-2 flex justify-between">
                 <span className="text-lg font-semibold text-gray-900">Total:</span>
                 <span className="text-lg font-semibold text-gray-900">{formatCurrency(totalBasicPrice)}</span>
               </div>
             </div>
           </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-between">
          <button 
            type="button"
            onClick={() => {
              confirmFormClose({
                hasUnsavedChanges: true,
                onConfirm: () => router.push('/quotations')
              });
            }}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 font-medium hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Quotations
          </button>
          <button 
            type="submit" 
            disabled={createQuotation.isPending} 
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
