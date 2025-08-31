'use client';

import { useState } from 'react';
import { CommunicationForm } from './_components/CommunicationForm';
import { CommunicationList } from './_components/CommunicationList';
import { CommunicationDetail } from './_components/CommunicationDetail';
import { MessageSquare, Plus, List } from 'lucide-react';
import type { Communication } from '@/types/communication';

type ViewMode = 'list' | 'form' | 'detail';

export default function CommunicationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingCommunication, setEditingCommunication] = useState<Communication | null>(null);
  const [viewingCommunication, setViewingCommunication] = useState<Communication | null>(null);

  const handleCreateNew = () => {
    setEditingCommunication(null);
    setViewingCommunication(null);
    setViewMode('form');
  };

  const handleEdit = (communication: Communication) => {
    setEditingCommunication(communication);
    setViewingCommunication(null);
    setViewMode('form');
  };

  const handleView = (communication: Communication) => {
    setViewingCommunication(communication);
    setEditingCommunication(null);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setEditingCommunication(null);
    setViewingCommunication(null);
  };

  const handleFormSubmit = () => {
    setViewMode('list');
    setEditingCommunication(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="h-4 w-4 inline mr-2" />
                List
              </button>
              <button
                onClick={() => setViewMode('form')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'form'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Plus className="h-4 w-4 inline mr-2" />
                New
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'list' && (
          <CommunicationList
            onEdit={handleEdit}
            onView={handleView}
            onCreateNew={handleCreateNew}
          />
        )}

        {viewMode === 'form' && (
          <div>
            <div className="mb-4">
              <button
                onClick={handleBackToList}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ← Back to List
              </button>
            </div>
            <CommunicationForm
              mode={editingCommunication ? 'edit' : 'create'}
              initialData={editingCommunication ?? undefined}
              onSuccess={handleFormSubmit}
            />
          </div>
        )}

        {viewMode === 'detail' && viewingCommunication && (
          <div>
            <div className="mb-4">
              <button
                onClick={handleBackToList}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                ← Back to List
              </button>
            </div>
            <CommunicationDetail
              communication={viewingCommunication}
              onBack={handleBackToList}
              onEdit={() => handleEdit(viewingCommunication)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
