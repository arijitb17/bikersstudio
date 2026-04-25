// app/admin/types.ts

import React from 'react';
import type { LucideIcon } from 'lucide-react';

// ---------------------
// Admin Dashboard Types
// ---------------------

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  revenue: number;
  pendingOrders: number;
  lowStock: number;
}

// ---------------------
// Base Admin Item (index signature for contravariance compatibility)
// ---------------------

export interface AdminItem {
  id?: string;
  [key: string]: unknown;
}

// ---------------------
// DB Entities
// All extend AdminItem to satisfy index-signature contravariance constraints
// ---------------------

export interface Product extends AdminItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  description: string;
  categoryId: string;
  category?: Category;
  bikeId?: string;
  bike?: Bike;
  images: string[];
  thumbnail?: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt?: string;
}

export interface Category extends AdminItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  position: number;
  parentId?: string;
  showInMenu: boolean;
  isActive: boolean;
}

export interface Brand extends AdminItem {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  position: number;
  isActive: boolean;
}

export interface Bike extends AdminItem {
  id: string;
  name: string;
  brandId: string;
  brand?: Brand;
  model: string;
  year: number;
  isActive: boolean;
}

export interface MenuEntity extends AdminItem {
  id: string;
  name: string;
  type: 'BRAND_MENU' | 'CATEGORY_MENU' | 'CUSTOM_MENU';
  position: number;
  isActive: boolean;
}

export interface Order extends AdminItem {
  id: string;
  orderNumber: string;
  userId: string;
  user?: {
    name?: string;
    email: string;
  };
  total: number;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
}

export interface Banner extends AdminItem {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  link?: string;
  position: number;
  isActive: boolean;
}

export interface Coupon extends AdminItem {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface Testimonial extends AdminItem {
  id: string;
  name: string;
  review: string;
  rating: number;
  image?: string;
  location?: string;
}

export interface Video extends AdminItem {
  id: string;
  title: string;
  videoUrl: string;
  views?: string;
  duration?: string;
  thumbnail?: string;
  isActive?: boolean;
}

export interface User extends AdminItem {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  role: 'USER' | 'ADMIN';
  image?: string | null;
  emailVerified?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    orders: number;
    reviews: number;
    addresses: number;
  };
}

// ---------------------
// Modal Form Data Types
// ---------------------

export interface UserFormData extends AdminItem {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'USER' | 'ADMIN';
  password: string;
}

// ---------------------
// Table Config Types
// ---------------------

export interface TableColumn<T = AdminItem> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  successRows?: number;
  failedRows?: number;
}

// ---------------------
// Admin UI Navigation
// ---------------------

export type TabType =
  | 'dashboard'
  | 'users'
  | 'products'
  | 'categories'
  | 'brands'
  | 'bikes'
  | 'menu-json'
  | 'menu-items'
  | 'orders'
  | 'reviews'
  | 'testimonials'
  | 'banners'
  | 'coupons'
  | 'images'
  | 'videos';

export interface MenuItem {
  id: TabType;
  label: string;
  icon: LucideIcon;
}

// ---------------------
// Modals / UI helpers
// ---------------------

export type ModalType = 'create' | 'edit';