import React from 'react';
import { checkPasswordStrength } from '../../lib/validators/auth';
import { AlertTriangle } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className = '' }: PasswordStrengthProps) {
  if (!password) return null;

  const { score, feedback, warnings, isStrong } = checkPasswordStrength(password);
  
  const getScoreColor = () => {
    if (score <= 2) return 'bg-red-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getScoreText = () => {
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  const getScoreTextColor = () => {
    if (score <= 2) return 'text-red-600';
    if (score <= 3) return 'text-yellow-600';
    if (score <= 4) return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-gray-600">Password strength:</span>
          <span className={`font-medium ${getScoreTextColor()}`}>
            {getScoreText()}
          </span>
        </div>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded-full transition-all duration-200 ${
                index <= score ? getScoreColor() : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Requirements feedback */}
      <div className="space-y-1">
        {feedback.map((requirement, index) => (
          <div key={index} className="flex items-center space-x-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-gray-600">{requirement}</span>
          </div>
        ))}
        {isStrong && (
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-green-600 font-medium">All requirements met!</span>
          </div>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-medium text-yellow-800">Security Warnings:</p>
              {warnings.map((warning, index) => (
                <p key={index} className="text-xs text-yellow-700">• {warning}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Security tips */}
      <div className="text-xs text-gray-500 space-y-1">
        <p className="font-medium text-gray-600">Security Tips:</p>
        <ul className="list-disc list-inside space-y-0.5 text-gray-500">
          <li>Use a unique password for this account</li>
          <li>Consider using a password manager</li>
          <li>Never share your password with anyone</li>
        </ul>
      </div>
    </div>
  );
}
