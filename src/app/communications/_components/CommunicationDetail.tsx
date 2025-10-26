'use client';

import { 
  Phone, 
  Mail, 
  Video, 
  Building, 
  MapPin, 
  Calendar,
  User,
  Building2,
  ArrowLeft,
  Edit
} from 'lucide-react';
import type { Communication } from '@/types/communication';

interface CommunicationDetailProps {
  communication: Communication;
  onBack?: () => void;
  onEdit?: () => void;
}

export function CommunicationDetail({ communication, onBack, onEdit }: CommunicationDetailProps) {
  const getCommunicationTypeIcon = (type: string) => {
    switch (type) {
      case 'TELEPHONIC': return <Phone className="h-5 w-5 text-blue-600" />;
      case 'VIRTUAL_MEETING': return <Video className="h-5 w-5 text-green-600" />;
      case 'EMAIL': return <Mail className="h-5 w-5 text-purple-600" />;
      case 'PLANT_VISIT': return <Building className="h-5 w-5 text-orange-600" />;
      case 'OFFICE_VISIT': return <MapPin className="h-5 w-5 text-red-600" />;
      default: return <Phone className="h-5 w-5 text-gray-600" />;
    }
  };

  const getCommunicationTypeLabel = (type: string) => {
    switch (type) {
      case 'TELEPHONIC': return 'Telephonic Discussion';
      case 'VIRTUAL_MEETING': return 'Virtual Meeting';
      case 'EMAIL': return 'Email';
      case 'PLANT_VISIT': return 'Plant Visit';
      case 'OFFICE_VISIT': return 'Office Visit';
      default: return type;
    }
  };

  const getCommunicationTypeBadge = (type: string) => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";
    switch (type) {
      case 'TELEPHONIC': 
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'VIRTUAL_MEETING': 
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'EMAIL': 
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'PLANT_VISIT': 
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'OFFICE_VISIT': 
        return `${baseClasses} bg-red-100 text-red-800`;
      default: 
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (!communication) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Communication not found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-gray-900">Communication Details</h2>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Communication Type and Date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getCommunicationTypeIcon(communication.type)}
            <span className={getCommunicationTypeBadge(communication.type)}>
              {getCommunicationTypeLabel(communication.type)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{new Date(communication.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Subject */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {communication.subject}
          </h3>
        </div>

        {/* Customer and Contact Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">Customer Information</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name: </span>
                <span className="text-gray-900">{communication.company?.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Type: </span>
                <span className="text-gray-900">Company</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-gray-600" />
              <h4 className="font-medium text-gray-900">Contact Person</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium text-gray-700">Name: </span>
                <span className="text-gray-900">
                  {communication.enquiry?.office?.contactPersons?.[0]?.name || 
                   communication.enquiry?.plant?.contactPersons?.[0]?.name || 
                   communication.contactPerson?.name || 
                   'No contact person'}
                </span>
              </div>
              {(communication.enquiry?.office?.contactPersons?.[0]?.designation || 
                communication.enquiry?.plant?.contactPersons?.[0]?.designation || 
                communication.contactPerson?.designation) && (
                <div>
                  <span className="font-medium text-gray-700">Designation: </span>
                  <span className="text-gray-900">
                    {communication.enquiry?.office?.contactPersons?.[0]?.designation || 
                     communication.enquiry?.plant?.contactPersons?.[0]?.designation || 
                     communication.contactPerson?.designation}
                  </span>
                </div>
              )}
              {(communication.enquiry?.office?.contactPersons?.[0]?.phoneNumber || 
                communication.enquiry?.plant?.contactPersons?.[0]?.phoneNumber || 
                communication.contactPerson?.phoneNumber) && (
                <div>
                  <span className="font-medium text-gray-700">Phone: </span>
                  <span className="text-gray-900">
                    {communication.enquiry?.office?.contactPersons?.[0]?.phoneNumber || 
                     communication.enquiry?.plant?.contactPersons?.[0]?.phoneNumber || 
                     communication.contactPerson?.phoneNumber}
                  </span>
                </div>
              )}
              {(communication.enquiry?.office?.contactPersons?.[0]?.emailId || 
                communication.enquiry?.plant?.contactPersons?.[0]?.emailId || 
                communication.contactPerson?.emailId) && (
                <div>
                  <span className="font-medium text-gray-700">Email: </span>
                  <span className="text-gray-900">
                    {communication.enquiry?.office?.contactPersons?.[0]?.emailId || 
                     communication.enquiry?.plant?.contactPersons?.[0]?.emailId || 
                     communication.contactPerson?.emailId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Description</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 whitespace-pre-wrap">{communication.description}</p>
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Additional fields can be added here when needed */}
        </div>

        {/* Next Communication */}
        {(communication.nextCommunicationDate ?? communication.proposedNextAction) && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h4 className="font-medium text-green-900 mb-3">Next Communication</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {communication.nextCommunicationDate && (
                <div>
                  <span className="text-sm font-medium text-green-700">Next Date: </span>
                  <span className="text-sm text-green-800">
                    {new Date(communication.nextCommunicationDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              {communication.proposedNextAction && (
                <div>
                  <span className="text-sm font-medium text-green-700">Proposed Action: </span>
                  <span className="text-sm text-green-800">{communication.proposedNextAction}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Employee Information */}
        {communication.employee && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Recorded By</h4>
            <div className="text-sm text-gray-700">
              <span className="font-medium">{communication.employee.name}</span>
              {communication.employee.role && (
                <span className="ml-2 text-gray-600">({communication.employee.role})</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

