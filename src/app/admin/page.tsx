'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../../trpc/client';
import { useAuth } from '../../components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const InviteUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(['MANAGER', 'ADMINISTRATOR']),
});

type InviteUserFormData = z.infer<typeof InviteUserSchema>;

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(InviteUserSchema),
  });

  // Check if user is admin and redirect if not
  useEffect(() => {
    if (isAuthenticated && user?.role !== 'ADMINISTRATOR') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const inviteUserMutation = api.admin.inviteUser.useMutation({
    onSuccess: (data) => {
      setError('');
      setSuccess(data.message);
      reset();
      // Refetch users list
      usersQuery.refetch();
    },
    onError: (error) => {
      setError(error.message);
      setSuccess('');
    },
  });

  const updateRoleMutation = api.admin.updateUserRole.useMutation({
    onSuccess: (data) => {
      setError('');
      setSuccess(data.message);
      // Refetch users list
      usersQuery.refetch();
    },
    onError: (error) => {
      setError(error.message);
      setSuccess('');
    },
  });

  const usersQuery = api.admin.getAllUsers.useQuery();

  const onSubmit = (data: InviteUserFormData) => {
    setError('');
    setSuccess('');
    inviteUserMutation.mutate(data);
  };

  const handleRoleUpdate = (userId: string, newRole: 'MARKETING' | 'MANAGER' | 'ADMINISTRATOR') => {
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  // Show loading if checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (user?.role !== 'ADMINISTRATOR') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage users and roles</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invite User Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Invite New User</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  {...register('role')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Select role</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                </select>
                {errors.role && (
                  <p className="text-sm text-red-500 mt-1">{errors.role.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={inviteUserMutation.isPending}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {inviteUserMutation.isPending ? 'Creating User...' : 'Create User'}
              </button>
            </form>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">All Users</h2>
            
            {usersQuery.isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading users...</p>
              </div>
            ) : usersQuery.error ? (
              <div className="text-center py-8">
                <p className="text-red-600">Error loading users: {usersQuery.error.message}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {usersQuery.data?.map((user) => (
                  <div key={user.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          user.role === 'ADMINISTRATOR' ? 'bg-red-100 text-red-800' :
                          user.role === 'MANAGER' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleUpdate(user.id, e.target.value as 'MARKETING' | 'MANAGER' | 'ADMINISTRATOR')}
                          disabled={updateRoleMutation.isPending}
                          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="MARKETING">Marketing</option>
                          <option value="MANAGER">Manager</option>
                          <option value="ADMINISTRATOR">Administrator</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                
                {usersQuery.data?.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No users found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

