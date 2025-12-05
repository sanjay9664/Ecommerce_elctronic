import React, { createContext, useContext, useState, ReactNode } from 'react';

// Simple product type
export interface Product {
  id: string;
  name: string;
  price: number;
  rating: number;
  image: string;
  description: string;
  category: string;
  fastDelivery: boolean;
}

// Create context
const AppContext = createContext<any>(undefined);

// Provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Dummy Products Data - Simple version
  const [products] = useState<Product[]>([
    {
      id: '1',
      name: 'Wireless Headphones',
      price: 99.99,
      rating: 4.5,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150',
      description: 'High-quality wireless headphones',
      category: 'electronics',
      fastDelivery: true
    },
    {
      id: '2',
      name: 'Smart Watch',
      price: 199.99,
      rating: 4.3,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150',
      description: 'Advanced smartwatch',
      category: 'electronics',
      fastDelivery: true
    },
    {
      id: '3',
      name: 'Gaming Mouse',
      price: 49.99,
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=150',
      description: 'RGB gaming mouse',
      category: 'electronics',
      fastDelivery: false
    },
    {
      id: '4',
      name: 'Cotton T-Shirt',
      price: 19.99,
      rating: 4.2,
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=150',
      description: 'Comfortable cotton t-shirt',
      category: 'fashion',
      fastDelivery: true
    },
    {
      id: '5',
      name: 'Programming Book',
      price: 29.99,
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150',
      description: 'Complete programming guide',
      category: 'books',
      fastDelivery: false
    },
    {
      id: '6',
      name: 'Water Bottle',
      price: 24.99,
      rating: 4.1,
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=150',
      description: 'Eco-friendly bottle',
      category: 'home',
      fastDelivery: true
    }
  ]);

  const [cart, setCart] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Simple functions
  const addToCart = (product: Product) => {
    setCart(current => {
      const existing = current.find(item => item.product.id === product.id);
      if (existing) {
        return current.map(item =>
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(current => current.filter(item => item.product.id !== productId));
  };

  const addToWishlist = (product: Product) => {
    setWishlist(current => {
      if (current.find(item => item.id === product.id)) return current;
      return [...current, product];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist(current => current.filter(item => item.id !== productId));
  };

  const value = {
    products,
    cart,
    wishlist,
    searchQuery,
    setSearchQuery,
    addToCart,
    removeFromCart,
    addToWishlist,
    removeFromWishlist
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};