// src/app/login/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginSchema, SignupSchema } from '../../lib/validators/auth';
import type { z } from 'zod';
import { api } from '../../trpc/client';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../components/providers/AuthProvider';
import { PasswordStrength } from '../../components/ui/password-strength';
import { PasswordInput } from '../../components/ui/password-input';
import { PasswordResetModal } from '../../components/ui/password-reset-modal';
import { SecurityInfo } from '../../components/ui/security-info';

type FormData = z.infer<typeof LoginSchema>;
type SignupFormData = z.infer<typeof SignupSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
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

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    formState: { errors: signupErrors },
    watch: watchSignup,
  } = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
  });

  const loginMutation = api.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.user) {
        login(data.user);
        setError('');
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    },
    onError: (error) => {
      setError(error.message);
      // Login failed
    },
  });

  const signupMutation = api.auth.signup.useMutation({
    onSuccess: (data) => {
      if (data.user) {
        login(data.user);
        setError('');
        setSuccess('Account created successfully! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      }
    },
    onError: (error) => {
      setError(error.message);
      // Signup failed
    },
  });

  const onSubmit = (data: FormData) => {
    setError('');
    setSuccess('');
    loginMutation.mutate(data);
  };

  const onSignupSubmit = (data: SignupFormData) => {
    setError('');
    setSuccess('');
    signupMutation.mutate(data);
  };



  const watchedSignupPassword = watchSignup('password');

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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-3xl text-gray-900 mb-2">CRM Portal</h1>
          <p className="text-gray-600">Customer Enquiry & Quotation Management</p>
        </div>

        <div className="bg-white shadow-xl border-0 rounded-lg">
          <div className="p-6">
            {/* Tabs */}
            <div className="flex mb-6">
              <button
                onClick={() => setActiveTab('login')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'login'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setActiveTab('signup')}
                className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'signup'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Login Tab */}
            {activeTab === 'login' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
                  <p className="text-gray-600 text-sm">
                    Enter your credentials to access the portal
                  </p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="Enter your email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
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
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
                  </button>
                  
                  <div className="text-center">
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                      onClick={() => setShowPasswordReset(true)}
                    >
                      Forgot your password?
                    </button>
                  </div>
                  
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded-md">
                    <p className="text-xs text-gray-600 text-center">
                      <strong>Security:</strong> Multiple failed login attempts may result in temporary account lockout.
                    </p>
                  </div>
                </form>

                <div className="pt-4 border-t border-gray-200">
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-xs text-yellow-700 text-center">
                      <strong>Security Tip:</strong> Use strong, unique passwords and never share your credentials.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Signup Tab */}
            {activeTab === 'signup' && (
              <div className="space-y-4">
                                 <div className="space-y-2">
                   <h2 className="text-xl font-semibold text-gray-900">Create account</h2>
                   <p className="text-gray-600 text-sm">
                     Register for access to the CRM portal. You will be assigned the Marketing role by default.
                   </p>
                 </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                    <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                )}

                <form onSubmit={handleSignupSubmit(onSignupSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <input
                      type="text"
                      {...registerSignup('name')}
                      placeholder="Enter your full name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    />
                    {signupErrors.name && (
                      <p className="text-sm text-red-500">{signupErrors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      {...registerSignup('email')}
                      placeholder="Enter your email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    />
                    {signupErrors.email && (
                      <p className="text-sm text-red-500">{signupErrors.email.message}</p>
                    )}
                  </div>
                  <PasswordInput
                    label="Password"
                    {...registerSignup('password')}
                    placeholder="Create a password"
                    error={signupErrors.password?.message}
                  />
                  
                  {/* Password strength indicator */}
                  <PasswordStrength password={watchedSignupPassword} />
                  
                  <PasswordInput
                    label="Confirm Password"
                    {...registerSignup('confirmPassword')}
                    placeholder="Confirm your password"
                    error={signupErrors.confirmPassword?.message}
                  />
                   
                   <SecurityInfo className="mt-4" />
                   
                   <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                     <p className="text-xs text-blue-700">
                       <strong>Security Notice:</strong> All new accounts are created with Marketing role permissions. 
                       Higher privileges can only be granted by administrators through invitation.
                     </p>
                   </div>
                   
                   <button
                    type="submit"
                    disabled={signupMutation.isPending}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {signupMutation.isPending ? 'Creating Account...' : 'Create Account'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Secure access to customer enquiry and quotation management system
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