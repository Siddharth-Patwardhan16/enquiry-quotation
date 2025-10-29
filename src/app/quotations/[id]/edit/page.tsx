'use client';

import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateQuotationSchema } from '@/lib/validators/quotation';
import type { z } from 'zod';
import { api } from '@/trpc/client';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useToastContext } from '@/components/providers/ToastProvider';

type FormData = z.infer<typeof CreateQuotationSchema>;

export default function EditQuotationPage() {
  const params = useParams();
  const router = useRouter();
  const quotationId = params.id as string;
  const { success, error: showError } = useToastContext();
  
  const { data: quotation, isLoading, error } = api.quotation.getById.useQuery({ id: quotationId });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(CreateQuotationSchema),
    defaultValues: {
      currency: 'INR',
      revisionNumber: 0,
      items: [{ materialDescription: '', quantity: 1, pricePerUnit: 0 }],
    },
  });

  // Watch the items to calculate totals in real-time
  const watchedItems = watch('items') ?? [];
  const currency = watch('currency') ?? 'INR';

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

  // useFieldArray hook to manage dynamic items
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Initialize form with existing quotation data
  useEffect(() => {
    if (quotation) {
      reset({
        enquiryId: quotation.enquiryId,
        revisionNumber: quotation.revisionNumber || 0,
        quotationDate: quotation.quotationDate ? new Date(quotation.quotationDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        deliverySchedule: quotation.deliverySchedule || '',
        currency: quotation.currency || 'INR',
        items: quotation.items?.map(item => ({
          materialDescription: item.materialDescription,
          quantity: Number(item.quantity),
          pricePerUnit: Number(item.pricePerUnit),
        })) || [{ materialDescription: '', quantity: 1, pricePerUnit: 0 }],
      });
    }
  }, [quotation, reset]);

  const updateQuotationMutation = api.quotation.update.useMutation({
    onSuccess: () => {
      success('Quotation Updated', 'The quotation has been successfully updated.');
      router.push(`/quotations/${quotationId}`);
    },
    onError: (error) => {
      showError('Update Failed', `Failed to update quotation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const onSubmit = (data: FormData) => {
    updateQuotationMutation.mutate({
      id: quotationId,
      enquiryId: data.enquiryId,
      revisionNumber: data.revisionNumber,
      quotationDate: data.quotationDate,
      deliverySchedule: data.deliverySchedule,
      currency: data.currency,
      items: data.items,
    });
  };

  if (error) return <div>Error: {error instanceof Error ? error.message : 'Unknown error'}</div>;
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
              For {quotation.enquiry?.customer?.name ?? 'Unknown Customer'}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => router.push(`/quotations/${quotationId}`)}
            className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit(onSubmit)}
            disabled={updateQuotationMutation.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {updateQuotationMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
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
                {quotation.quotationNumber}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Quotation number cannot be changed
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
              {errors.revisionNumber && <p className="text-red-500 text-sm mt-1">{errors.revisionNumber.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quotation Date
              </label>
              <input 
                type="date"
                {...register('quotationDate')} 
                className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              />
              {errors.quotationDate && <p className="text-red-500 text-sm mt-1">{errors.quotationDate.message}</p>}
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
              {errors.currency && <p className="text-red-500 text-sm mt-1">{errors.currency.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enquiry
              </label>
              <div className="w-full rounded-md border border-gray-300 p-2 bg-gray-50 text-gray-700">
                {quotation.enquiry?.customer?.name ?? 'Unknown Customer'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enquiry cannot be changed
              </p>
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
              {errors.deliverySchedule && <p className="text-red-500 text-sm mt-1">{errors.deliverySchedule.message}</p>}
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
                      min="0"
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
                      className="inline-flex items-center justify-center w-10 h-10 rounded-md border border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                      title="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {fields.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No items added yet. Click &quot;Add Item&quot; to start.</p>
            </div>
          )}

          {/* Total Summary */}
          {fields.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-end">
                <div className="text-right">
                  <div className="text-sm text-gray-600 mb-1">Total Basic Price</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(totalBasicPrice)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}