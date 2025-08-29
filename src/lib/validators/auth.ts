// src/lib/validators/auth.ts
import { z } from 'zod';

// Common weak passwords to blacklist
const weakPasswords = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', 'dragon', 'master', 'hello',
  'freedom', 'whatever', 'qwertyuiop', 'admin123', 'login', 'passw0rd',
  'abc123', '111111', '123123', 'admin123', 'root', 'toor', 'test',
  'guest', 'info', 'adm', 'mysql', 'user', 'administrator', 'administrator',
  'root', 'toor', 'admin', 'admin123', 'admin1234', 'admin12345',
  'demo', 'demo123', 'demo1234', 'demo12345', 'demo123456'
];

// Password strength validation
const passwordStrength = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character")
  .refine((password) => !weakPasswords.includes(password.toLowerCase()), {
    message: "This password is too common. Please choose a stronger password."
  })
  .refine((password) => {
    // Check for repeated characters (e.g., "aaa", "111")
    const hasRepeatedChars = /(.)\1{2,}/.test(password);
    return !hasRepeatedChars;
  }, {
    message: "Password contains too many repeated characters."
  })
  .refine((password) => {
    // Check for sequential characters (e.g., "abc", "123")
    const hasSequential = /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password);
    return !hasSequential;
  }, {
    message: "Password contains sequential characters."
  });

export const SignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: passwordStrength,
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const LoginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password cannot be empty"),
});

// Password strength checker utility
export const checkPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
  warnings: string[];
} => {
  const feedback: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  if (password.length >= 8) score += 1;
  else feedback.push("At least 8 characters");

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("One lowercase letter");

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("One uppercase letter");

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push("One number");

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback.push("One special character");

  // Additional checks for warnings
  if (password.length < 12) {
    warnings.push("Consider using 12+ characters for maximum security");
  }

  if (weakPasswords.includes(password.toLowerCase())) {
    warnings.push("This is a commonly used password");
    score = Math.max(0, score - 2); // Penalize weak passwords
  }

  if (/(.)\1{2,}/.test(password)) {
    warnings.push("Avoid repeated characters");
  }

  if (/(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    warnings.push("Avoid sequential characters");
  }

  return {
    score: Math.max(0, Math.min(5, score)),
    feedback,
    warnings,
    isStrong: score >= 4 && warnings.length === 0
  };
};