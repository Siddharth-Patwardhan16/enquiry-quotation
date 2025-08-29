'use client';

import { useState } from 'react';
import { CommunicationForm } from './_components/CommunicationForm';
import { CommunicationList } from './_components/CommunicationList';
import { CommunicationDetail } from './_components/CommunicationDetail';
import { MessageSquare, Plus, List, Eye } from 'lucide-react';

type ViewMode = 'list' | 'form' | 'detail';

export default function CommunicationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCommunication, setSelectedCommunication] = useState<any>(null);
  const [editingCommunication, setEditingCommunication] = useState<any>(null);

  const handleCreateNew = () => {
    setEditingCommunication(null);
    setSelectedCommunication(null);
    setViewMode('form');
  };

  const handleEdit = (communication: any) => {
    setEditingCommunication(communication);
    setSelectedCommunication(null);
    setViewMode('form');
  };

  const handleView = (communication: any) => {
    setSelectedCommunication(communication);
    setEditingCommunication(null);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedCommunication(null);
    setEditingCommunication(null);
  };

  const handleFormSuccess = () => {
    setViewMode('list');
    setEditingCommunication(null);
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'form':
        return editingCommunication ? 'Edit Communication' : 'New Communication';
      case 'detail':
        return 'Communication Details';
      default:
        return 'Communications';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl text-gray-900 font-bold">{getViewTitle()}</h1>
            <p className="text-gray-600 mt-1">
              {viewMode === 'list' && 'Manage customer communications and interactions'}
              {viewMode === 'form' && 'Create or edit communication records'}
              {viewMode === 'detail' && 'View communication details'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {viewMode === 'list' && (
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4" />
              New Communication
            </button>
          )}

          {viewMode !== 'list' && (
            <button
              onClick={handleBackToList}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <List className="h-4 w-4" />
              Back to List
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {viewMode === 'list' && (
          <CommunicationList
            onEdit={handleEdit}
            onView={handleView}
            onCreateNew={handleCreateNew}
          />
        )}

        {viewMode === 'form' && (
          <CommunicationForm
            mode={editingCommunication ? 'edit' : 'create'}
            initialData={editingCommunication}
            onSuccess={handleFormSuccess}
          />
        )}

        {viewMode === 'detail' && selectedCommunication && (
          <CommunicationDetail
            communication={selectedCommunication}
            onBack={handleBackToList}
            onEdit={() => handleEdit(selectedCommunication)}
          />
        )}
      </div>

      {/* Quick Stats (only shown in list view) */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Communications</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Follow-ups</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
