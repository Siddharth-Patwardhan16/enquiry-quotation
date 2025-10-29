'use client';

import React from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import { MapPin, Plus } from 'lucide-react';
import { CompanyFormData } from '../_types/company.types';
import { OfficeCard } from './OfficeCard';
import { PlantCard } from './PlantCard';

interface LocationManagerProps {
  type: 'offices' | 'plants';
}

export function LocationManager({ type }: LocationManagerProps) {
  const { control, watch } = useFormContext<CompanyFormData>();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: type
  });

  const locations = watch(type);

  const addLocation = () => {
    const newLocation = {
      name: '',
      address: '',
      area: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      contacts: []
    };
    append(newLocation);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          {type === 'offices' ? 'Company Offices' : 'Manufacturing Plants'}
        </h3>
        <button
          type="button"
          onClick={addLocation}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add {type === 'offices' ? 'Office' : 'Plant'}
        </button>
      </div>

      {(!locations || locations.length === 0) && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No {type} added yet</p>
          <button
            type="button"
            onClick={addLocation}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Add your first {type.slice(0, -1)}
          </button>
        </div>
      )}

      <div className="grid gap-6">
        {fields.map((field, index) => (
          <div key={field.id}>
            {type === 'offices' ? (
              <OfficeCard 
                index={index} 
                onRemove={() => remove(index)}
              />
            ) : (
              <PlantCard 
                index={index} 
                onRemove={() => remove(index)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
