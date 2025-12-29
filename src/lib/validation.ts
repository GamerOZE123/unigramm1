import { z } from 'zod';

// Post validation
export const postSchema = z.object({
  content: z.string()
    .min(1, 'Post cannot be empty')
    .max(5000, 'Post must be less than 5000 characters')
    .trim(),
  hashtags: z.array(
    z.string().regex(/^[a-zA-Z0-9_]+$/, 'Hashtags can only contain letters, numbers, and underscores')
  ).max(10, 'Maximum 10 hashtags allowed').optional()
});

// Comment validation
export const commentSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters')
    .trim()
});

// Auth validation
export const signUpSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be less than 128 characters'),
  confirmPassword: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be less than 128 characters'),
  fullName: z.string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .trim(),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .trim()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const signInSchema = z.object({
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password must be less than 128 characters')
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password must be less than 128 characters')
});

// Profile validation
export const profileSchema = z.object({
  full_name: z.string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be less than 100 characters')
    .trim(),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .trim(),
  bio: z.string()
    .max(500, 'Bio must be less than 500 characters')
    .optional(),
  university: z.string()
    .min(1, 'University is required')
    .max(200, 'University name must be less than 200 characters')
    .trim()
    .optional(),
  major: z.string()
    .max(100, 'Major must be less than 100 characters')
    .trim()
    .optional(),
  linkedin_url: z.string()
    .url('Invalid LinkedIn URL')
    .max(500, 'URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  instagram_url: z.string()
    .url('Invalid Instagram URL')
    .max(500, 'URL must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  twitter_url: z.string()
    .url('Invalid Twitter URL')
    .max(500, 'URL must be less than 500 characters')
    .optional()
    .or(z.literal(''))
});

// Message validation
export const messageSchema = z.object({
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must be less than 2000 characters')
    .trim()
});

// Company/Club contact validation
export const urlSchema = z.string()
  .url('Invalid URL')
  .max(500, 'URL must be less than 500 characters')
  .or(z.literal(''));

export const emailSchema = z.string()
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters')
  .optional()
  .or(z.literal(''));

export const phoneSchema = z.string()
  .max(20, 'Phone number must be less than 20 characters')
  .optional()
  .or(z.literal(''));
