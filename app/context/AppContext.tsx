import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Category, CartItem, Cart } from '../../types';
import { productAPI, categoryAPI, cartAPI } from '../../services/api';

// Create context
const AppContext = createContext<any>(undefined);

// Provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartData, setCartData] = useState<Cart | null>(null);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Loading states
  const [loading, setLoading] = useState({
    products: false,
    categories: false,
    cart: false,
  });
  
  const [error, setError] = useState<string | null>(null);

  // Fetch all categories on mount
  useEffect(() => {
    fetchCategories();
    fetchCart();
  }, []);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(prev => ({ ...prev, categories: true }));
      setError(null);
      const data = await categoryAPI.getAll();
      setCategories(Array.isArray(data) ? data : (data.categories || []));
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  };

  // Fetch products by category
  const fetchProductsByCategory = async (categoryId?: string) => {
    try {
      setLoading(prev => ({ ...prev, products: true }));
      setError(null);
      const data = await productAPI.getByCategory(categoryId);
      const productsList = Array.isArray(data) ? data : (data.products || []);
      setProducts(productsList);
      return productsList;
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching products by category:', err);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  // Fetch products by speciality
  const fetchProductsBySpeciality = async (specialityId?: string) => {
    try {
      setLoading(prev => ({ ...prev, products: true }));
      setError(null);
      const data = await productAPI.getBySpeciality(specialityId);
      const productsList = Array.isArray(data) ? data : (data.products || []);
      setProducts(productsList);
      return productsList;
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching products by speciality:', err);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  // Fetch new products
  const fetchNewProducts = async () => {
    try {
      setLoading(prev => ({ ...prev, products: true }));
      setError(null);
      const data = await productAPI.getNew();
      const productsList = Array.isArray(data) ? data : (data.products || []);
      setProducts(productsList);
      return productsList;
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching new products:', err);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  // Fetch sale products
  const fetchSaleProducts = async () => {
    try {
      setLoading(prev => ({ ...prev, products: true }));
      setError(null);
      const data = await productAPI.getSale();
      const productsList = Array.isArray(data) ? data : (data.products || []);
      setProducts(productsList);
      return productsList;
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching sale products:', err);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  };

  // Fetch cart
  const fetchCart = async () => {
    try {
      setLoading(prev => ({ ...prev, cart: true }));
      setError(null);
      const data = await cartAPI.get();
      if (data && data.items) {
        setCart(data.items);
        setCartData(data);
      } else if (Array.isArray(data)) {
        setCart(data);
      } else {
        // If no data, set empty cart
        setCart([]);
        setCartData({ items: [], subtotal: 0, shipping: 0, total: 0 });
      }
    } catch (err: any) {
      // Don't show error for cart if endpoint doesn't exist yet
      // Just set empty cart
      console.warn('Cart API not available, using empty cart:', err.message);
      setCart([]);
      setCartData({ items: [], subtotal: 0, shipping: 0, total: 0 });
    } finally {
      setLoading(prev => ({ ...prev, cart: false }));
    }
  };

  // Add to cart
  const addToCart = async (product: Product, quantity: number = 1) => {
    try {
      setError(null);
      await cartAPI.add(product.id, quantity);
      // Refresh cart after adding
      await fetchCart();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Remove from cart
  const removeFromCart = async (productId: string) => {
    try {
      setError(null);
      await cartAPI.remove(productId);
      // Refresh cart after removing
      await fetchCart();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Add to wishlist (local only)
  const addToWishlist = (product: Product) => {
    setWishlist(current => {
      if (current.find(item => item.id === product.id)) return current;
      return [...current, product];
    });
  };

  // Remove from wishlist (local only)
  const removeFromWishlist = (productId: string) => {
    setWishlist(current => current.filter(item => item.id !== productId));
  };

  const value = {
    // Data
    products,
    categories,
    cart,
    cartData,
    wishlist,
    searchQuery,
    
    // Loading states
    loading,
    error,
    
    // Setters
    setSearchQuery,
    setProducts,
    
    // Functions
    fetchProductsByCategory,
    fetchProductsBySpeciality,
    fetchNewProducts,
    fetchSaleProducts,
    fetchCategories,
    fetchCart,
    addToCart,
    removeFromCart,
    addToWishlist,
    removeFromWishlist,
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