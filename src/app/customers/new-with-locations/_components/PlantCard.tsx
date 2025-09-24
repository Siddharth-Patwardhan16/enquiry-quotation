'use client';

import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { Trash2, Users, Plus, X, Phone, Mail, User } from 'lucide-react';
import { CompanyFormData } from '../_types/company.types';
import { COUNTRIES, INDIAN_STATES } from '../_utils/constants';

interface PlantCardProps {
  index: number;
  onRemove: () => void;
}

export function PlantCard({ index, onRemove }: PlantCardProps) {
  const { register, formState: { errors }, control, watch } = useFormContext<CompanyFormData>();
  
  const { fields: contactFields, append: addContact, remove: removeContactField } = useFieldArray({
    control,
    name: `plants.${index}.contacts`
  });

  // Watch the country to show appropriate city/state options
  const watchedCountry = watch(`plants.${index}.country`);

  const addNewContact = () => {
    addContact({
      name: '',
      designation: '',
      phoneNumber: '',
      emailId: '',
      isPrimary: contactFields.length === 0
    });
  };

  const removeContact = (contactIndex: number) => {
    removeContactField(contactIndex);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 space-y-6 bg-gradient-to-br from-green-50 to-white">
      {/* Plant Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-3">
          <div className="flex items-center space-x-4">
            <input
              {...register(`plants.${index}.name`)}
              placeholder="Plant Name"
              className="text-lg font-semibold bg-transparent border-b-2 border-green-200 focus:border-green-500 outline-none px-2 py-1 w-full"
            />
          </div>
          {errors.plants?.[index]?.name && (
            <p className="text-sm text-red-600">{errors.plants[index]?.name?.message}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      
      {/* Address Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <textarea
            {...register(`plants.${index}.address`)}
            rows={2}
            placeholder="Complete plant address"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
          {errors.plants?.[index]?.address && (
            <p className="mt-1 text-sm text-red-600">{errors.plants[index]?.address?.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Industrial Area
          </label>
          <input
            {...register(`plants.${index}.area`)}
            placeholder="e.g., GIDC, SEZ"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City *
          </label>
          <input
            {...register(`plants.${index}.city`)}
            placeholder="e.g., Aurangabad"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
          {errors.plants?.[index]?.city && (
            <p className="mt-1 text-sm text-red-600">{errors.plants[index]?.city?.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          {watchedCountry === 'India' ? (
            <select
              {...register(`plants.${index}.state`)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          ) : (
            <input
              {...register(`plants.${index}.state`)}
              placeholder="e.g., California"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          )}
          {errors.plants?.[index]?.state && (
            <p className="mt-1 text-sm text-red-600">{errors.plants[index]?.state?.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country *
          </label>
          <select
            {...register(`plants.${index}.country`)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">Select Country</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
          {errors.plants?.[index]?.country && (
            <p className="mt-1 text-sm text-red-600">{errors.plants[index]?.country?.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PIN Code
          </label>
          <input
            {...register(`plants.${index}.pincode`)}
            placeholder="e.g., 413512"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      
      {/* Contacts Section */}
      <div className="bg-white rounded-lg p-4 border">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium flex items-center text-gray-900">
            <Users className="w-4 h-4 mr-2 text-green-600" />
            Contact Persons
          </h4>
          <button
            type="button"
            onClick={addNewContact}
            className="text-green-600 hover:text-green-800 text-sm flex items-center hover:bg-green-50 px-2 py-1 rounded"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Contact
          </button>
        </div>
        
        {contactFields.length === 0 ? (
          <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p>No contacts added yet</p>
            <button
              type="button"
              onClick={addNewContact}
              className="text-green-600 hover:text-green-800 text-sm mt-1"
            >
              Add first contact
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {contactFields.map((contactField, contactIndex) => (
              <ContactPersonForm
                key={contactField.id}
                plantIndex={index}
                contactIndex={contactIndex}
                onRemove={() => removeContact(contactIndex)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ContactPersonFormProps {
  plantIndex: number;
  contactIndex: number;
  onRemove: () => void;
}

function ContactPersonForm({ plantIndex, contactIndex, onRemove }: ContactPersonFormProps) {
  const { register, formState: { errors } } = useFormContext<CompanyFormData>();

  return (
    <div className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register(`plants.${plantIndex}.contacts.${contactIndex}.isPrimary`)}
            className="rounded text-green-600"
          />
          <span className="text-sm font-medium text-gray-700">Primary Contact</span>
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
            <User className="w-3 h-3 mr-1" />
            Name *
          </label>
          <input
            {...register(`plants.${plantIndex}.contacts.${contactIndex}.name`)}
            placeholder="e.g., Rahul Sharma"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
          />
          {errors.plants?.[plantIndex]?.contacts?.[contactIndex]?.name && (
            <p className="mt-1 text-xs text-red-600">{errors.plants[plantIndex]?.contacts?.[contactIndex]?.name?.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Designation *
          </label>
          <input
            {...register(`plants.${plantIndex}.contacts.${contactIndex}.designation`)}
            placeholder="e.g., Plant Manager"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
          />
          {errors.plants?.[plantIndex]?.contacts?.[contactIndex]?.designation && (
            <p className="mt-1 text-xs text-red-600">{errors.plants[plantIndex]?.contacts?.[contactIndex]?.designation?.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
            <Phone className="w-3 h-3 mr-1" />
            Phone Number *
          </label>
          <input
            {...register(`plants.${plantIndex}.contacts.${contactIndex}.phoneNumber`)}
            type="tel"
            placeholder="e.g., 9876543210"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
          />
          {errors.plants?.[plantIndex]?.contacts?.[contactIndex]?.phoneNumber && (
            <p className="mt-1 text-xs text-red-600">{errors.plants[plantIndex]?.contacts?.[contactIndex]?.phoneNumber?.message}</p>
          )}
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center">
            <Mail className="w-3 h-3 mr-1" />
            Email *
          </label>
          <input
            {...register(`plants.${plantIndex}.contacts.${contactIndex}.emailId`)}
            type="email"
            placeholder="e.g., rahul@company.com"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
          />
          {errors.plants?.[plantIndex]?.contacts?.[contactIndex]?.emailId && (
            <p className="mt-1 text-xs text-red-600">{errors.plants[plantIndex]?.contacts?.[contactIndex]?.emailId?.message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
