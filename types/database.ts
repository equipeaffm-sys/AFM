export type UserRole = 'client' | 'admin' | 'vip';
export type B2BStatus = 'pending' | 'approved' | 'rejected';
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface B2BProfile {
  id: string;
  company_name: string;
  vat_number: string;
  is_vat_valid: boolean;
  billing_address: Record<string, any> | null;
  status: B2BStatus;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price_cents: number;
  currency: string;
  stock: number;
  is_featured: boolean;
  is_digital_service: boolean;
  images: string[];
  metadata: Record<string, any>;
  category_id?: string | null;
  created_at: string;
}

export interface CrossSell {
  id: string;
  product_id: string;
  recommended_product_id: string;
  discount_percentage: number;
  recommended_product?: Product;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase_cents: number;
  product?: Product;
}

export interface Order {
  id: string;
  user_id?: string | null;
  stripe_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  status: OrderStatus;
  total_cents: number;
  currency: string;
  shipping_address?: Record<string, any> | null;
  tracking_number?: string | null;
  custom_note?: string | null;
  affiliate_code?: string | null;
  created_at: string;
  profiles?: Profile | null;
  order_items?: OrderItem[];
}

export interface Affiliate {
  id: string;
  user_id: string;
  code: string;
  commission_rate: number;
  total_earnings_cents: number;
  created_at: string;
}

export interface RewardPoints {
  id: string;
  user_id: string;
  points_balance: number;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  admin_id?: string | null;
  action: string;
  target_resource: string;
  ip_address?: string | null;
  created_at: string;
  admin_profile?: Profile | null;
}

export interface SiteSettings {
  top_banner: string;
  free_shipping_threshold_cents: number;
}
