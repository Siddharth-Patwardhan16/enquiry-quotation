'use client';

import { X, MapPin, Phone, Building, Calendar } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  isNew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomerDetailViewProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
}

export function CustomerDetailView({ customer, isOpen, onClose }: CustomerDetailViewProps) {
  if (!isOpen) return null;

  const getStatusBadge = (isNew: boolean) => {
    return (
      <span className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 border-transparent ${
        isNew ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {isNew ? 'New Customer' : 'Existing Customer'}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Customer Details</h3>
              <p className="text-sm text-gray-500">View customer information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">
              Basic Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Company Name</label>
                <p className="text-sm text-gray-900 mt-1">{customer.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Customer Status</label>
                <div className="mt-1">{getStatusBadge(customer.isNew)}</div>
              </div>
            </div>
          </div>

          {/* Office Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
              <Building className="w-4 h-4 mr-2 text-blue-600" />
              Office Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Office Name</label>
                <p className="text-sm text-gray-900 mt-1">
                  {customer.name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  Reception Number
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  Not available
                </p>
              </div>
            </div>
          </div>

          {/* Plant Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2 flex items-center">
              <Building className="w-4 h-4 mr-2 text-green-600" />
              Plant Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Plant Name</label>
                <p className="text-sm text-gray-900 mt-1">
                  Not available
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  Plant Reception Number
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  Not available
                </p>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">
              Address Information
            </h4>
            <div className="space-y-3">
              {false && (
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    Office Address
                  </label>
                  <p className="text-sm text-gray-900 mt-1">Not available</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">City</label>
                  <p className="text-sm text-gray-900 mt-1">
                    Not available
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">State/Province</label>
                  <p className="text-sm text-gray-900 mt-1">
                    Not available
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Country</label>
                  <p className="text-sm text-gray-900 mt-1">
                    Not available
                  </p>
                </div>
              </div>
            </div>
            
            {/* Plant Address Information */}
                          {false && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    Plant Address
                  </label>
                  <p className="text-sm text-gray-900 mt-1">Not available</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plant City</label>
                    <p className="text-sm text-gray-900 mt-1">
                      Not available
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plant State/Province</label>
                    <p className="text-sm text-gray-900 mt-1">
                      Not available
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plant Country</label>
                    <p className="text-sm text-gray-900 mt-1">
                      Not available
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Timestamps */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">
              System Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  Created Date
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(customer.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  Last Updated
                </label>
                <p className="text-sm text-gray-900 mt-1">
                  {new Date(customer.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
