'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/trpc/client';
import { Calendar, Building, Plus, Trash2 } from 'lucide-react';
import type { Communication } from '@/types/communication';
import { useFormConfirmation } from '@/hooks/useFormConfirmation';
import { useToastContext } from '@/components/providers/ToastProvider';

const CommunicationEntrySchema = z.object({
  info: z.string().min(1, 'Enter communication details'),
});

const CommunicationSchema = z.object({
  date: z.string().optional(),
  companyId: z.string().optional(),
  contactId: z.string().optional(),
  subject: z.string().optional(),
  enquiryRelated: z.string().optional(),
  entries: z.array(CommunicationEntrySchema).min(1, 'Add at least one communication'),
});

type FormData = z.infer<typeof CommunicationSchema>;

interface CompanyOption {
  id: string;
  name: string;
}

interface CommunicationFormProps {
  onSuccess?: () => void;
  initialData?: Communication;
  mode?: 'create' | 'edit';
}

function parseCommunicationEntries(description?: string | null): { info: string }[] {
  if (!description?.trim()) {
    return [{ info: '' }];
  }

  const matches = [...description.matchAll(/Communication (\d+):\n([\s\S]*?)(?=\n\nCommunication \d+:|$)/g)];
  if (matches.length > 0) {
    return matches.map((match) => ({ info: match[2]?.trim() ?? '' }));
  }

  return [{ info: description.trim() }];
}

export function CommunicationForm({ onSuccess, initialData, mode = 'create' }: CommunicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);
  const { confirmFormClose } = useFormConfirmation();
  const { success, error: showError } = useToastContext();

  const { data: customers, isLoading: loadingCustomers } = api.company.getAll.useQuery();
  const { data: enquiries } = api.enquiry.getAll.useQuery({});

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(CommunicationSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      entries: [{ info: '' }],
      ...(initialData
        ? {
            companyId: initialData.companyId ?? undefined,
            subject: initialData.subject,
            enquiryRelated: initialData.enquiryRelated ?? undefined,
            entries: parseCommunicationEntries(initialData.description),
          }
        : {}),
    },
  });

  const watchedCompanyId = watch('companyId');
  const watchedEnquiryRelated = watch('enquiryRelated');
  const watchedEntries = watch('entries');

  const filteredEnquiries = useMemo(
    () => enquiries?.filter((enquiry) => enquiry.companyId === watchedCompanyId) ?? [],
    [enquiries, watchedCompanyId],
  );

  useEffect(() => {
    if (!watchedCompanyId) {
      setSelectedCompanyName(null);
      return;
    }

    const company = customers?.find((customer: CompanyOption) => customer.id === watchedCompanyId);
    setSelectedCompanyName(company?.name ?? null);
  }, [watchedCompanyId, customers]);

  useEffect(() => {
    if (!watchedEnquiryRelated) return;

    const selectedEnquiry = filteredEnquiries.find(
      (enquiry) => enquiry.id === parseInt(watchedEnquiryRelated, 10),
    );

    if (selectedEnquiry?.subject) {
      setValue('subject', selectedEnquiry.subject);
    }
  }, [watchedEnquiryRelated, filteredEnquiries, setValue]);

  const createCommunication = api.communication.create.useMutation({
    onSuccess: () => {
      success('Communication created', 'The communication has been saved.');
      setIsSubmitting(false);
      setSelectedCompanyName(null);
      reset({
        date: new Date().toISOString().split('T')[0],
        entries: [{ info: '' }],
      });
      onSuccess?.();
    },
    onError: (error) => {
      setIsSubmitting(false);
      showError('Creation failed', error.message);
    },
  });

  const updateCommunication = api.communication.update.useMutation({
    onSuccess: () => {
      success('Communication updated', 'The communication has been saved.');
      setIsSubmitting(false);
      onSuccess?.();
    },
    onError: (error) => {
      setIsSubmitting(false);
      showError('Update failed', error.message);
    },
  });

  const addEntry = () => {
    setValue('entries', [...(watchedEntries ?? []), { info: '' }]);
  };

  const removeEntry = (index: number) => {
    const nextEntries = (watchedEntries ?? []).filter((_, entryIndex) => entryIndex !== index);
    setValue('entries', nextEntries.length > 0 ? nextEntries : [{ info: '' }], { shouldValidate: true });
  };

  const onSubmit = (data: FormData) => {
    setIsSubmitting(true);

    const payload = {
      date: data.date,
      companyId: data.companyId,
      contactId: data.contactId,
      subject: data.subject,
      enquiryRelated: data.enquiryRelated,
      entries: data.entries,
      type: 'TELEPHONIC' as const,
    };

    if (mode === 'edit' && initialData?.id) {
      updateCommunication.mutate({
        id: initialData.id,
        ...payload,
        description: data.entries
          .map((entry, index) => `Communication ${index + 1}:\n${entry.info.trim()}`)
          .join('\n\n'),
      });
      return;
    }

    createCommunication.mutate(payload);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">
          {mode === 'edit' ? 'Edit communication' : 'New communication'}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Record one or more touchpoints for this customer interaction.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-6">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Date</h3>
          <div className="max-w-xs">
            <label className="mb-1 block text-sm font-medium text-slate-700">Communication date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                {...register('date')}
                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Customer</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Customer name</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  {...register('companyId')}
                  className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  disabled={loadingCustomers}
                >
                  <option value="">{loadingCustomers ? 'Loading...' : 'Select company'}</option>
                  {customers?.map((customer: CompanyOption) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              {errors.companyId && <p className="mt-1 text-sm text-red-600">{errors.companyId.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Customer details</label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                {selectedCompanyName ? (
                  <span>{selectedCompanyName}</span>
                ) : (
                  <span className="text-slate-400">Select a customer to view details</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Subject</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
              <input
                {...register('subject')}
                placeholder="Enter communication subject"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              {errors.subject && <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Related enquiry</label>
              <select
                {...register('enquiryRelated')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                disabled={!watchedCompanyId}
              >
                <option value="">Select enquiry (optional)</option>
                {filteredEnquiries.map((enquiry) => (
                  <option key={enquiry.id} value={enquiry.id}>
                    {enquiry.quotationNumber
                      ? `Q#${enquiry.quotationNumber} - ${enquiry.subject ?? ''}`
                      : (enquiry.subject ?? '')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Communications</h3>
            <button
              type="button"
              onClick={addEntry}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
            >
              <Plus className="h-4 w-4" />
              Add communication
            </button>
          </div>

          <div className="space-y-4">
            {(watchedEntries ?? []).map((_, index) => (
              <div
                key={`communication-entry-${index}`}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-slate-900">Communication {index + 1}</h4>
                  {(watchedEntries?.length ?? 0) > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEntry(index)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-slate-500 transition-colors hover:bg-white hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>

                <label className="mb-1 block text-sm font-medium text-slate-700">Info</label>
                <textarea
                  {...register(`entries.${index}.info`)}
                  placeholder="What was discussed or noted?"
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                {errors.entries?.[index]?.info && (
                  <p className="mt-1 text-sm text-red-600">{errors.entries[index]?.info?.message}</p>
                )}
              </div>
            ))}
          </div>

          {errors.entries?.message && (
            <p className="text-sm text-red-600">{errors.entries.message}</p>
          )}
        </section>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-6">
          <button
            type="button"
            onClick={() => {
              confirmFormClose({
                hasUnsavedChanges: true,
                onConfirm: () => {
                  setSelectedCompanyName(null);
                  reset({
                    date: new Date().toISOString().split('T')[0],
                    entries: [{ info: '' }],
                  });
                },
              });
            }}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Update communication' : 'Save communication'}
          </button>
        </div>
      </form>
    </div>
  );
}
