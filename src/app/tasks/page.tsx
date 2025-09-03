'use client';

import Link from 'next/link';
import { api } from '@/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle, CheckCircle, FileText, MessageSquare, TrendingUp } from 'lucide-react';

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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const queryResult: any = api.tasks.getUpcoming.useQuery();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const tasks = queryResult.data as Task[] | undefined;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const isLoading = queryResult.isLoading;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
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
      case 'DUE':
        return 'bg-red-100 text-red-800 border-red-200';
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

  // Safely filter tasks with proper type checking
  const overdueTasks: Task[] = tasks ? tasks.filter((task: Task) => isOverdue(task.dueDate)) : [];
  const upcomingTasks: Task[] = tasks ? tasks.filter((task: Task) => !isOverdue(task.dueDate)) : [];

  return (
    <main className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Upcoming Tasks</h1>
        <p className="text-muted-foreground mt-2">
          Your centralized to-do list for all active communications and quotations.
        </p>
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
                <p className="text-2xl font-bold text-blue-900">{tasks?.length ?? 0}</p>
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

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-emerald-500 rounded-lg shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700">Upcoming</p>
                <p className="text-2xl font-bold text-emerald-900">{upcomingTasks.length}</p>
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
          ) : (tasks?.length ?? 0) === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
              <p className="text-gray-500 text-sm">No upcoming tasks at the moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="p-4 font-semibold text-gray-900">Due Date</th>
                    <th className="p-4 font-semibold text-gray-900">Type</th>
                    <th className="p-4 font-semibold text-gray-900">Customer</th>
                    <th className="p-4 font-semibold text-gray-900">Task Description</th>
                    <th className="p-4 font-semibold text-gray-900">Status</th>
                    <th className="p-4 font-semibold text-gray-900">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks?.map((task: Task) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
