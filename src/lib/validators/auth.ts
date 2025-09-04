// src/lib/validators/auth.ts
import { z } from 'zod';

// Common weak passwords to blacklist (currently unused but kept for future use)
// const weakPasswords = [
//   'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
//   'admin', 'letmein', 'welcome', 'monkey', 'dragon', 'master', 'hello',
//   'freedom', 'whatever', 'qwertyuiop', 'admin123', 'login', 'passw0rd',
//   'abc123', '111111', '123123', 'admin123', 'root', 'toor', 'test',
//   'guest', 'info', 'adm', 'mysql', 'user', 'administrator', 'administrator',
//   'root', 'toor', 'admin', 'admin123', 'admin1234', 'admin12345',
//   'demo', 'demo123', 'demo1234', 'demo12345', 'demo123456'
// ];

// Password strength validation - relaxed requirements
const passwordStrength = z.string()
  .min(4, "Password must be at least 4 characters");

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

// Password strength checker utility - relaxed requirements
export const checkPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
  isStrong: boolean;
  warnings: string[];
} => {
  const feedback: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // Very basic requirements - just length
  if (password.length >= 4) score += 5; // Give full score for just meeting minimum length
  else feedback.push("At least 4 characters");

    // Optional bonus points for additional complexity (but not required)
  if (password.length >= 6) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  return {
    score: Math.max(0, Math.min(5, score)),
    feedback,
    warnings,
    isStrong: password.length >= 4 // Much more lenient - just needs 4+ characters
  };
};