'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, AlertCircle, CheckCircle, FileText, MessageSquare, Settings } from 'lucide-react';
import { MeetingManagementModal } from './_components/MeetingManagementModal';
import { QuotationStatusModal } from './_components/QuotationStatusModal';
import { CommunicationStatusModal } from './_components/CommunicationStatusModal';

// Define the task type based on the API response
type Task = {
  type: 'QUOTATION' | 'COMMUNICATION';
  dueDate: Date;
  customerName: string;
  taskDescription: string;
  status: string;
  link: string;
  id: string;
  priority: 'high' | 'medium' | 'low';
};

export default function TasksPage() {
  // State for modals
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showCommunicationStatusModal, setShowCommunicationStatusModal] = useState(false);
  const [selectedCommunicationId, setSelectedCommunicationId] = useState<string>('');
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('');

  // State for filtering
  const [filterType, setFilterType] = useState<'all' | 'QUOTATION' | 'COMMUNICATION'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const queryResult = api.tasks.getUpcoming.useQuery();
  const tasks = queryResult.data as Task[] | undefined;
  const isLoading = queryResult.isLoading;
  const error = queryResult.error as { message: string } | null;

  if (error) {
    return (
      <main className="p-4 md:p-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Tasks</h3>
          <p className="text-red-500 text-sm">{error.message}</p>
        </div>
      </main>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LIVE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SUBMITTED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'WON':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'LOST':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'RECEIVED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'DUE_TODAY':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'DUE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'RESCHEDULED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'FOLLOW_UP_REQUIRED':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'QUOTATION':
        return <FileText className="w-4 h-4" />;
      case 'COMMUNICATION':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'QUOTATION':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'COMMUNICATION':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const isOverdue = (date: Date) => {
    return date < new Date();
  };

  // Handler functions for modals
  const handleManageMeeting = (communicationId: string) => {
    setSelectedCommunicationId(communicationId);
    setShowMeetingModal(true);
  };

  const handleUpdateQuotationStatus = (quotationId: string) => {
    setSelectedQuotationId(quotationId);
    setShowQuotationModal(true);
  };

  const handleUpdateCommunicationStatus = (communicationId: string) => {
    setSelectedCommunicationId(communicationId);
    setShowCommunicationStatusModal(true);
  };

  const handleModalClose = () => {
    setShowMeetingModal(false);
    setShowQuotationModal(false);
    setShowCommunicationStatusModal(false);
    setSelectedCommunicationId('');
    setSelectedQuotationId('');
  };

  const handleModalSuccess = () => {
    // Refetch tasks when modal operations are successful
    void queryResult.refetch();
  };

  // Filter tasks based on current filters
  const filteredTasks: Task[] = tasks ? tasks.filter((task: Task) => {
    // Filter by type
    if (filterType !== 'all' && task.type !== filterType) return false;
    
    // Filter by priority
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    
    // Filter by status
    if (filterStatus !== 'all') {
      const today = new Date();
      const taskDate = new Date(task.dueDate);
      const isOverdue = taskDate < today;
      const isToday = taskDate.toDateString() === today.toDateString();
      
      switch (filterStatus) {
        case 'overdue':
          return isOverdue;
        case 'today':
          return isToday;
        case 'upcoming':
          return !isOverdue && !isToday;
        default:
          return true;
      }
    }
    
    return true;
  }) : [];

  // Calculate stats for filtered tasks
  const overdueTasks: Task[] = filteredTasks.filter((task: Task) => isOverdue(task.dueDate));
  const todayTasks: Task[] = filteredTasks.filter((task: Task) => {
    const today = new Date();
    return new Date(task.dueDate).toDateString() === today.toDateString();
  });


  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Task Management</h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          Manage your active quotations and communications in one place.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 bg-white rounded-lg border p-4">
        <div className="space-y-4">
          {/* Mobile-first responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'QUOTATION' | 'COMMUNICATION')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="QUOTATION">Quotations</option>
                <option value="COMMUNICATION">Communications</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'overdue' | 'today' | 'upcoming')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="overdue">Overdue</option>
                <option value="today">Due Today</option>
                <option value="upcoming">Upcoming</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as 'all' | 'high' | 'medium' | 'low')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Actions</label>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setFilterType('all');
                    setFilterStatus('all');
                    setFilterPriority('all');
                  }}
                  className="flex-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Results count - full width on mobile */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {filteredTasks.length} of {tasks?.length ?? 0} tasks
            </div>
          </div>
        </div>
      </div>

      {/* Task Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-500 rounded-lg shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Total Tasks</p>
                <p className="text-2xl font-bold text-blue-900">{filteredTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-500 rounded-lg shadow-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-700">Overdue</p>
                <p className="text-2xl font-bold text-red-900">{overdueTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-500 rounded-lg shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700">Due Today</p>
                <p className="text-2xl font-bold text-orange-900">{todayTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>


      </div>

      {/* Tasks Table */}
      <Card className="bg-white border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            Task Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-500 text-sm">No tasks match your current filters</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="p-4 font-semibold text-gray-900">Due Date</th>
                      <th className="p-4 font-semibold text-gray-900">Type</th>
                      <th className="p-4 font-semibold text-gray-900">Customer</th>
                      <th className="p-4 font-semibold text-gray-900">Task Description</th>
                      <th className="p-4 font-semibold text-gray-900">Status</th>
                      <th className="p-4 font-semibold text-gray-900">Priority</th>
                      <th className="p-4 font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task: Task) => (
                      <tr 
                        key={`${task.type}-${task.id}`} 
                        className="border-b border-gray-100 last:border-none hover:bg-gray-50 transition-all duration-200 bg-white"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {isOverdue(task.dueDate) ? (
                              <div className="p-2 bg-red-100 rounded-full">
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              </div>
                            ) : (
                              <div className="p-2 bg-emerald-100 rounded-full">
                                <Clock className="w-4 h-4 text-emerald-600" />
                              </div>
                            )}
                            <span className={`font-medium ${
                              isOverdue(task.dueDate) 
                                ? 'text-red-700' 
                                : 'text-emerald-700'
                            }`}>
                              {formatDate(task.dueDate)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border shadow-sm ${getTypeColor(task.type)}`}>
                            {getTypeIcon(task.type)}
                            {task.type}
                          </div>
                        </td>
                        <td className="p-4 font-medium text-gray-900">{task.customerName}</td>
                        <td className="p-4">
                          <Link 
                            href={task.link} 
                            className="text-primary hover:underline font-medium hover:text-primary/80 transition-colors"
                          >
                            {task.taskDescription}
                          </Link>
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant="outline" 
                            className={`text-xs font-medium shadow-sm ${getStatusColor(task.status)}`}
                          >
                            {task.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Badge 
                            className={`px-2 py-1 text-xs font-medium text-white border-0 shadow-sm ${
                              task.priority === 'high' 
                                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                                : task.priority === 'medium' 
                                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' 
                                : 'bg-gradient-to-r from-green-500 to-green-600'
                            }`}
                          >
                            {task.priority}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {task.type === 'COMMUNICATION' ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleManageMeeting(task.id)}
                                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                >
                                  <Settings className="h-3 w-3 mr-1" />
                                  Manage
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateCommunicationStatus(task.id)}
                                  className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Update Status
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateQuotationStatus(task.id)}
                                className="text-purple-600 border-purple-300 hover:bg-purple-50"
                              >
                                <Settings className="h-3 w-3 mr-1" />
                                Update Status
                              </Button>
                            )}
                            <Link href={task.link}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-gray-600 border-gray-300 hover:bg-gray-50"
                              >
                                View
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {filteredTasks.map((task: Task) => (
                  <div 
                    key={`${task.type}-${task.id}`} 
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Header with date and type */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {isOverdue(task.dueDate) ? (
                          <div className="p-2 bg-red-100 rounded-full">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          </div>
                        ) : (
                          <div className="p-2 bg-emerald-100 rounded-full">
                            <Clock className="w-4 h-4 text-emerald-600" />
                          </div>
                        )}
                        <span className={`font-medium text-sm ${
                          isOverdue(task.dueDate) 
                            ? 'text-red-700' 
                            : 'text-emerald-700'
                        }`}>
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border shadow-sm ${getTypeColor(task.type)}`}>
                        {getTypeIcon(task.type)}
                        {task.type}
                      </div>
                    </div>

                    {/* Task description */}
                    <div className="mb-3">
                      <Link 
                        href={task.link} 
                        className="text-primary hover:underline font-medium hover:text-primary/80 transition-colors text-sm"
                      >
                        {task.taskDescription}
                      </Link>
                    </div>

                    {/* Customer */}
                    <div className="mb-3">
                      <span className="text-xs font-medium text-gray-500">Customer:</span>
                      <p className="text-sm text-gray-900 font-medium">{task.customerName}</p>
                    </div>

                    {/* Status and Priority */}
                    <div className="flex items-center gap-2 mb-4">
                      <Badge 
                        variant="outline" 
                        className={`text-xs font-medium shadow-sm ${getStatusColor(task.status)}`}
                      >
                        {task.status}
                      </Badge>
                      <Badge 
                        className={`px-2 py-1 text-xs font-medium text-white border-0 shadow-sm ${
                          task.priority === 'high' 
                            ? 'bg-gradient-to-r from-red-500 to-red-600' 
                            : task.priority === 'medium' 
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' 
                            : 'bg-gradient-to-r from-green-500 to-green-600'
                        }`}
                      >
                        {task.priority}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {task.type === 'COMMUNICATION' ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleManageMeeting(task.id)}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50 text-xs"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Manage
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateCommunicationStatus(task.id)}
                            className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Update Status
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateQuotationStatus(task.id)}
                          className="text-purple-600 border-purple-300 hover:bg-purple-50 text-xs"
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Update Status
                        </Button>
                      )}
                      <Link href={task.link}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-gray-600 border-gray-300 hover:bg-gray-50 text-xs"
                        >
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Meeting Management Modal */}
      <MeetingManagementModal
        isOpen={showMeetingModal}
        onClose={handleModalClose}
        communicationId={selectedCommunicationId}
        onSuccess={handleModalSuccess}
      />

      {/* Quotation Status Modal */}
      <QuotationStatusModal
        isOpen={showQuotationModal}
        onClose={handleModalClose}
        quotationId={selectedQuotationId}
        onSuccess={handleModalSuccess}
      />

      {/* Communication Status Modal */}
      <CommunicationStatusModal
        isOpen={showCommunicationStatusModal}
        onClose={handleModalClose}
        communicationId={selectedCommunicationId}
        onSuccess={handleModalSuccess}
      />
    </main>
  );
}
