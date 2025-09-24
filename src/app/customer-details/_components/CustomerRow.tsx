'use client';

import { memo, useState } from 'react';
import { 
  Users, 
  ChevronDown,
  ChevronRight,
  Building,
  Factory
} from 'lucide-react';
import { CustomerRowProps } from '../_types/customer.types';
import { 
  formatCustomerName, 
  getCustomerInitials 
} from '../_utils/customerHelpers';

export const CustomerRow = memo(function CustomerRow({
  customer,
}: CustomerRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Get contact persons from the customer data
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  const contactPersons = (customer as any).contactPersons ?? [];
  const hasContactPersons = contactPersons.length > 0;
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

  return (
    <>
      <tr className="hover:bg-gray-50 transition-colors">
        {/* Customer Name with Expand Button */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {getCustomerInitials(customer)}
                </span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center">
                <Users className="w-4 h-4 text-gray-400 mr-2" />
                <div className="text-sm font-medium text-gray-900">
                  {formatCustomerName(customer)}
                </div>
                {hasContactPersons && (
                  <button
                    onClick={toggleExpanded}
                    className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
                    title={isExpanded ? "Hide contact persons" : "Show contact persons"}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                )}
              </div>
              {customer.type === 'company' && (
                <div className="text-xs text-green-600 font-medium">
                  Company
                </div>
              )}
              {hasContactPersons && (
                <div className="text-xs text-blue-600 font-medium">
                  {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
                  {contactPersons.length} contact person{contactPersons.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        </td>


      </tr>

      {/* Expanded Contact Persons Row */}
      {isExpanded && hasContactPersons && (
        <tr className="bg-gray-50">
          <td colSpan={1} className="px-6 py-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Contact Persons
              </h4>
              <div className="grid gap-3">
                {/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */}
                {contactPersons.map((contact: any, index: number) => (
                  <div key={contact.id ?? index} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="flex items-center">
                            {contact.location?.type === 'OFFICE' ? (
                              <Building className="w-4 h-4 text-blue-500 mr-2" />
                            ) : (
                              <Factory className="w-4 h-4 text-green-500 mr-2" />
                            )}
                            <span className="text-sm font-medium text-gray-900">
                              {contact.name}
                            </span>
                            {contact.isPrimary && (
                              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                Primary
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Designation:</span> {contact.designation ?? '-'}
                          </div>
                          <div>
                            <span className="font-medium">Location:</span> {contact.location?.name ?? '-'}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> 
                            <span className={`ml-1 px-2 py-1 text-xs rounded-full ${
                              contact.location?.type === 'OFFICE' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {contact.location?.type ?? '-'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Phone:</span> {contact.phoneNumber ?? '-'}
                          </div>
                          <div className="md:col-span-2">
                            <span className="font-medium">Email:</span> {contact.emailId ?? '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
});

