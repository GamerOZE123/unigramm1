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

// Store validation
export const storeSchema = z.object({
  store_name: z.string()
    .min(3, 'Store name must be at least 3 characters')
    .max(100, 'Store name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_'&.]+$/, 'Store name contains invalid characters')
    .trim(),
  store_description: z.string()
    .max(2000, 'Description must be less than 2000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
});

// Student store item validation
export const studentStoreItemSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters')
    .trim(),
  description: z.string()
    .max(5000, 'Description must be less than 5000 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  price: z.number()
    .positive('Price must be greater than 0')
    .max(1000000, 'Price must be less than 1,000,000'),
  category: z.string()
    .min(1, 'Category is required')
    .max(50, 'Category must be less than 50 characters'),
  product_type: z.enum(['physical', 'digital']),
  tags: z.array(z.string()
    .max(30, 'Each tag must be less than 30 characters')
    .regex(/^[a-zA-Z0-9\-_\s]+$/, 'Tags can only contain letters, numbers, hyphens, underscores, and spaces')
  ).max(10, 'Maximum 10 tags allowed').optional(),
  stock_quantity: z.number()
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .max(10000, 'Stock must be less than 10000'),
});

// Payment method validation
export const paymentMethodSchema = z.object({
  type: z.string()
    .min(1, 'Payment type is required')
    .max(50, 'Payment type must be less than 50 characters')
    .trim(),
  details: z.string()
    .min(3, 'Payment details required')
    .max(200, 'Details must be less than 200 characters')
    .trim(),
});

// Bank details validation
export const bankDetailsSchema = z.object({
  account_name: z.string()
    .max(100, 'Account name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'\-]*$/, 'Account name can only contain letters, spaces, hyphens, and apostrophes')
    .trim()
    .optional()
    .or(z.literal('')),
  account_number: z.string()
    .max(17, 'Account number must be less than 17 digits')
    .regex(/^[0-9]*$/, 'Account number can only contain digits')
    .optional()
    .or(z.literal('')),
  routing_number: z.string()
    .refine((val) => val === '' || /^[0-9]{9}$/.test(val), 'Routing number must be exactly 9 digits')
    .optional()
    .or(z.literal('')),
  bank_name: z.string()
    .max(100, 'Bank name must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),
});
