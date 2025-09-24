'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Package } from 'lucide-react';
import { CompanyFormData } from '../_types/company.types';

export function PurchaseOrderCard() {
  const { register } = useFormContext<CompanyFormData>();

  return (
    <div className="bg-white rounded-xl border shadow-sm">
      <div className="px-6 pt-6">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center">
          <Package className="w-5 h-5 mr-2 text-purple-600" />
          Purchase Orders Received
        </h4>
        <p className="text-gray-600 text-sm">Tick the types of POs received from the company</p>
      </div>
      <div className="px-6 pb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <input
              {...register('poRuptureDiscs')}
              type="checkbox"
              id="poRuptureDiscs"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="poRuptureDiscs" className="text-sm text-gray-700">
              Rupture Discs
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              {...register('poThermowells')}
              type="checkbox"
              id="poThermowells"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="poThermowells" className="text-sm text-gray-700">
              Thermowells
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              {...register('poHeatExchanger')}
              type="checkbox"
              id="poHeatExchanger"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="poHeatExchanger" className="text-sm text-gray-700">
              Heat Exchanger
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              {...register('poMiscellaneous')}
              type="checkbox"
              id="poMiscellaneous"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="poMiscellaneous" className="text-sm text-gray-700">
              Miscellaneous
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              {...register('poWaterJetSteamJet')}
              type="checkbox"
              id="poWaterJetSteamJet"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="poWaterJetSteamJet" className="text-sm text-gray-700">
              Water Jet / Steam Jet
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
