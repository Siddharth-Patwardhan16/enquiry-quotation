// src/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema } from '../../lib/validators/auth';
import type { z } from 'zod';
import { api } from '../../trpc/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/providers/AuthProvider';
import { PasswordInput } from '../../components/ui/password-input';
import { PasswordResetModal } from '../../components/ui/password-reset-modal';
import { Lock, ShieldCheck } from 'lucide-react';

type FormData = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(LoginSchema),
  });

  const loginMutation = api.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.user) {
        login(data.user);
        setError('');
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 800);
      }
    },
    onError: (err) => {
      setError(err.message || 'Invalid email or password');
    },
  });

  const onSubmit = (data: FormData) => {
    setError('');
    setSuccess('');
    loginMutation.mutate(data);
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CRM Portal</h1>
          <p className="text-gray-600">Customer Enquiry & Quotation Management</p>
        </div>

        <div className="bg-white shadow-xl border border-gray-100 rounded-xl overflow-hidden">
          <div className="p-8">
            <div className="space-y-2 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Sign In to Your Account
              </h2>
              <p className="text-gray-600 text-sm">
                Enter your authorized company credentials to access the portal
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md mb-5">
                <svg className="h-4 w-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md mb-5">
                <svg className="h-4 w-4 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-green-700">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="name@svicarbon.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 text-sm"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <PasswordInput
                label="Password"
                {...register('password')}
                placeholder="Enter your password"
                error={errors.password?.message}
              />

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {loginMutation.isPending ? 'Authenticating...' : 'Sign In'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                  onClick={() => setShowPasswordReset(true)}
                >
                  Forgot your password?
                </button>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md mt-4">
                <p className="text-xs text-gray-600 text-center">
                  <strong>Security:</strong> Protected by rate-limiting and enterprise encryption. Multiple failed attempts will temporarily lock your account.
                </p>
              </div>
            </form>

            <div className="pt-5 mt-6 border-t border-gray-100">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-xs text-amber-800 text-center">
                  <strong>Authorized Personnel Only:</strong> Public registration is closed. New employee access must be provisioned by a system administrator.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          &copy; {new Date().getFullYear()} SVI Carbon. Proprietary and confidential.
        </p>
      </div>

      {/* Password Reset Modal */}
      <PasswordResetModal 
        isOpen={showPasswordReset} 
        onClose={() => setShowPasswordReset(false)} 
      />
    </div>
  );
}