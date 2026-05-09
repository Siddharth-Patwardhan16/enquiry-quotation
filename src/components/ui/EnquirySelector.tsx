'use client';

import React, { useMemo, useState } from 'react';
import { Check, FileText, Search } from 'lucide-react';

export type EnquiryOption = {
  id: number;
  subject: string | null;
  quotationNumber: string | null;
  companyName: string;
};

interface EnquirySelectorProps {
  options: EnquiryOption[];
  selectedId?: number;
  onSelect: (_id: number) => void;
  loading?: boolean;
}

export function EnquirySelector({ options, selectedId, onSelect, loading }: EnquirySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return options;
    return options.filter((opt) => {
      const subject = (opt.subject ?? '').toLowerCase();
      const quotation = (opt.quotationNumber ?? '').toLowerCase();
      const company = opt.companyName.toLowerCase();
      return subject.includes(term) || quotation.includes(term) || company.includes(term);
    });
  }, [options, searchTerm]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Enquiry</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by customer, subject, quotation number"
          className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white">
        {loading ? (
          <div className="p-4 text-sm text-gray-500">Loading enquiries...</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">No enquiries found</div>
        ) : (
          filtered.map((opt) => {
            const active = selectedId === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onSelect(opt.id)}
                className={`w-full text-left p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${active ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {opt.companyName}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {opt.subject ?? 'No subject'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {opt.quotationNumber ? `Q#${opt.quotationNumber}` : 'No quotation number'}
                    </p>
                  </div>
                  {active && <Check className="h-4 w-4 text-blue-600 mt-1 shrink-0" />}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
