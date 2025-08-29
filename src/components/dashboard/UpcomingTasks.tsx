import React from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle, FileText, Building, User, ChevronRight, Plus, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/trpc/client';

interface Task {
  id: string;
  title: string;
  type: 'enquiry' | 'quotation' | 'communication' | 'followup';
  dueDate: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
  customerName?: string;
  description?: string;
  assignedTo?: string;
  sourceId?: string | number;
  sourceType?: string;
}

interface UpcomingTasksProps {
  tasks?: Task[];
  isLoading?: boolean;
}

export function UpcomingTasks({ tasks, isLoading }: UpcomingTasksProps) {
  // Fetch real data from the API
  const { data: apiTasks, isLoading: isLoadingTasks } = api.dashboard.getUpcomingTasks.useQuery();
  
  // Use provided tasks prop or fall back to API data
  const displayTasks = tasks || apiTasks || [];
  const isDataLoading = isLoading || isLoadingTasks;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'from-red-500 to-red-600';
      case 'medium': return 'from-yellow-500 to-yellow-600';
      case 'low': return 'from-green-500 to-green-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getPriorityBgColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'enquiry': return <FileText className="w-4 h-4" />;
      case 'quotation': return <Building className="w-4 h-4" />;
      case 'communication': return <User className="w-4 h-4" />;
      case 'followup': return <Clock className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'enquiry': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'quotation': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'communication': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'followup': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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
        day: 'numeric' 
      });
    }
  };

  const isOverdue = (date: Date) => {
    return date < new Date();
  };

  if (isDataLoading) {
    return (
      <Card className="bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            Upcoming Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedTasks = displayTasks.sort((a, b) => {
    // Sort by priority first (high > medium > low)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    
    if (priorityDiff !== 0) return priorityDiff;
    
    // Then sort by due date (earliest first)
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  const overdueTasks = sortedTasks.filter(task => isOverdue(task.dueDate));
  const upcomingTasks = sortedTasks.filter(task => !isOverdue(task.dueDate));

  return (
    <Card className="bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            Upcoming Tasks
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1 text-sm font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border-blue-200">
              {displayTasks.length}
            </Badge>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <Filter className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Task Summary */}
        <div className="flex items-center gap-4 mt-3">
          {overdueTasks.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-red-600 font-medium">{overdueTasks.length} overdue</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-blue-600 font-medium">{upcomingTasks.length} upcoming</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-500 text-sm">No upcoming tasks at the moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Overdue Tasks */}
            {overdueTasks.map((task) => (
              <div
                key={task.id}
                className="group relative p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="absolute top-3 right-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(task.type)}`}>
                    {getTypeIcon(task.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                      {task.title}
                    </h4>
                    
                    {task.customerName && (
                      <p className="text-xs text-gray-600 mb-2 font-medium">
                        📍 {task.customerName}
                      </p>
                    )}
                    
                    {task.description && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={`px-2 py-1 text-xs font-medium bg-gradient-to-r ${getPriorityColor(task.priority)} text-white border-0`}
                        >
                          {task.priority}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(task.status)}`}
                        >
                          {task.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-red-600 font-semibold">
                        <Clock className="w-3 h-3" />
                        <span>OVERDUE</span>
                      </div>
                    </div>
                    
                    {task.assignedTo && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-red-200">
                        <div className="w-6 h-6 bg-gradient-to-r from-red-400 to-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {task.assignedTo.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-red-700 font-medium">
                          {task.assignedTo}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Upcoming Tasks */}
            {upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="group relative p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(task.type)}`}>
                    {getTypeIcon(task.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                      {task.title}
                    </h4>
                    
                    {task.customerName && (
                      <p className="text-xs text-gray-600 mb-2 font-medium">
                        📍 {task.customerName}
                      </p>
                    )}
                    
                    {task.description && (
                      <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={`px-2 py-1 text-xs font-medium bg-gradient-to-r ${getPriorityColor(task.priority)} text-white border-0`}
                        >
                          {task.priority}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(task.status)}`}
                        >
                          {task.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span className="font-medium">{formatDate(task.dueDate)}</span>
                      </div>
                    </div>
                    
                    {task.assignedTo && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {task.assignedTo.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-600 font-medium">
                          {task.assignedTo}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Hover indicator */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* {displayTasks.length > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <button className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 group">
              <Plus className="w-4 h-4" />
              View All Tasks
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )} */}
      </CardContent>
    </Card>
  );
}
