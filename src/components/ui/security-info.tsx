import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Shield, Lock, Eye, AlertTriangle } from 'lucide-react';

interface SecurityInfoProps {
  className?: string;
}

export function SecurityInfo({ className = '' }: SecurityInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-md ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Security Information</span>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 flex items-center space-x-1">
              <Lock className="h-3 w-3" />
              <span>Password Requirements</span>
            </h4>
            <ul className="text-xs text-gray-600 space-y-1 ml-4">
              <li>• Minimum 8 characters</li>
              <li>• At least one uppercase letter (A-Z)</li>
              <li>• At least one lowercase letter (a-z)</li>
              <li>• At least one number (0-9)</li>
              <li>• At least one special character (!@#$%^&*)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 flex items-center space-x-1">
              <Eye className="h-3 w-3" />
              <span>Security Best Practices</span>
            </h4>
            <ul className="text-xs text-gray-600 space-y-1 ml-4">
              <li>• Use unique passwords for each account</li>
              <li>• Consider using a password manager</li>
              <li>• Never share your password</li>
              <li>• Enable two-factor authentication if available</li>
              <li>• Regularly update your passwords</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700 flex items-center space-x-1">
              <AlertTriangle className="h-3 w-3" />
              <span>What We Don&apos;t Allow</span>
            </h4>
            <ul className="text-xs text-gray-600 space-y-1 ml-4">
              <li>• Common passwords (password, 123456, etc.)</li>
              <li>• Repeated characters (aaa, 111)</li>
              <li>• Sequential characters (abc, 123)</li>
              <li>• Personal information (name, birthdate)</li>
            </ul>
          </div>

          <div className="p-2 bg-blue-50 border border-blue-200 rounded">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Your account security is our priority. We use industry-standard 
              encryption and security measures to protect your information.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
