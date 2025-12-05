export interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  image: string;
  description: string;
  category: string;
  fastDelivery: boolean;
  inStock: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface FilterOptions {
  sortBy: 'price-low' | 'price-high' | 'rating' | 'name';
  rating: number;
  fastDelivery: boolean;
  category: string;
}