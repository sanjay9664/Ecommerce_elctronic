export interface Product {
  id: string;
  title?: string;
  name?: string;
  price: number;
  rating?: number;
  image?: string | null;
  images?: string[] | null;
  description?: string;
  category?: string;
  category_id?: string;
  speciality?: string;
  speciality_id?: string;
  fastDelivery?: boolean;
  inStock?: boolean;
  discount?: number;
  discount_percentage?: number;
  is_new?: boolean;
  is_sale?: boolean;
  [key: string]: any; // Allow additional fields from API
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  image?: string | null;
  description?: string;
  [key: string]: any;
}

export interface Speciality {
  id: string;
  name: string;
  slug?: string;
  image?: string | null;
  description?: string;
  [key: string]: any;
}

export interface CartItem {
  id?: string;
  product: Product;
  product_id?: string;
  quantity: number;
  price?: number;
  subtotal?: number;
}

export interface Cart {
  items: CartItem[];
  subtotal?: number;
  shipping?: number;
  total?: number;
  item_count?: number;
}

export interface Order {
  id: string;
  order_number?: string;
  status: string;
  items: CartItem[];
  subtotal?: number;
  shipping?: number;
  total?: number;
  created_at?: string;
  updated_at?: string;
  payment_status?: string;
  payment_proof?: string | null;
  delivery_info?: any;
  documents?: OrderDocument[];
  [key: string]: any;
}

export interface OrderDocument {
  id: string;
  type: 'RV' | 'PKL' | string;
  file_url: string;
  file_name?: string;
  created_at?: string;
}

export interface DealerStatus {
  can_order: boolean;
  reason?: string;
  blocked_until?: string;
  message?: string;
}

export interface FilterOptions {
  sortBy: 'price-low' | 'price-high' | 'rating' | 'name';
  rating: number;
  fastDelivery: boolean;
  category: string;
}

