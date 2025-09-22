'use client';

import { memo } from 'react';
import { 
  Users, 
  Phone, 
  Mail, 
  Briefcase, 
  Edit, 
  Trash2 
} from 'lucide-react';
import { CustomerRowProps } from '../_types/customer.types';
import { 
  formatCustomerName, 
  formatCustomerDesignation, 
  formatPhoneNumber, 
  formatEmail,
  getCustomerInitials 
} from '../_utils/customerHelpers';

export const CustomerRow = memo(function CustomerRow({
  customer,
  isSelected,
  onSelectionChange,
  onEdit,
  onDelete,
}: CustomerRowProps) {
  const handleSelectionChange = () => {
    onSelectionChange(customer.id);
  };

  const handleEdit = () => {
    onEdit(customer);
  };

  const handleDelete = () => {
    onDelete(customer);
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Selection Checkbox */}
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleSelectionChange}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          aria-label={`Select ${formatCustomerName(customer)}`}
        />
      </td>

      {/* Customer Name */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {getCustomerInitials(customer)}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="flex items-center">
              <Users className="w-4 h-4 text-gray-400 mr-2" />
              <div className="text-sm font-medium text-gray-900">
                {formatCustomerName(customer)}
              </div>
            </div>
            {customer.isNew && (
              <div className="text-xs text-green-600 font-medium">
                New Customer
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Designation */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <Briefcase className="w-4 h-4 text-gray-400 mr-2" />
          <div className="text-sm text-gray-900">
            {formatCustomerDesignation(customer)}
          </div>
        </div>
      </td>

      {/* Phone Number */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <Phone className="w-4 h-4 text-gray-400 mr-2" />
          <div className="text-sm text-gray-900">
            {formatPhoneNumber(customer)}
          </div>
        </div>
      </td>

      {/* Email ID */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <Mail className="w-4 h-4 text-gray-400 mr-2" />
          <div className="text-sm text-gray-900">
            {formatEmail(customer)}
          </div>
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="text-blue-600 hover:text-blue-900 transition-colors"
            title="Edit customer"
            aria-label={`Edit ${formatCustomerName(customer)}`}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-900 transition-colors"
            title="Delete customer"
            aria-label={`Delete ${formatCustomerName(customer)}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
});

