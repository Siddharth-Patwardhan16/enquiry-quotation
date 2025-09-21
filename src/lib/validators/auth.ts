import { z } from 'zod';

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
  email: z.string().email("Invalid email address"),
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