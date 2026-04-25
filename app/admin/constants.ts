// app/admin/constants.ts
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Tag,
  Bike,
  Menu,
  ShoppingCart,
  Image as ImageIcon,
  Ticket,
  Star,
  LucideIcon,
  FileJson,
  Users,
  Video,
  MessageSquare 
} from 'lucide-react';
import { TabType } from './types';

interface AdminMenuItem {
  id: TabType;
  label: string;
  icon: LucideIcon;
}

export const MENU_ITEMS: AdminMenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: FolderTree },
  { id: 'brands', label: 'Brands', icon: Tag },
  { id: 'bikes', label: 'Bikes', icon: Bike },
  { id: 'menu-json', label: 'Menu JSON Editor', icon: FileJson },
  { id: 'menu-items', label: 'Menu Items', icon: Menu },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
  { id: 'banners', label: 'Banners', icon: ImageIcon },
  { id: 'coupons', label: 'Coupons', icon: Ticket },
  { id: 'images', label: 'Images', icon: ImageIcon },
  { id: 'videos', label: 'Videos', icon: Video },
];

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

export const STAT_COLORS = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  yellow: 'bg-yellow-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
} as const;
