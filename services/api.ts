import axios from 'axios';

const BASE_URL = 'https://smartg5.com/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    // You can add token from AsyncStorage here if needed
    // const token = await AsyncStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.config?.url}`, error.message);
    return Promise.reject(error);
  }
);

// Helper function to build full image URL
export const buildImageUrl = (path: string | null | undefined): string | null => {
  if (!path || path === 'null' || path === 'undefined' || path === '') {
    return null;
  }
  // If already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // Build full URL from relative path
  return `https://smartg5.com/${path.replace(/\\\//g, '/')}`;
};

// Helper function to parse gallery images
export const parseGalleryImages = (galleryString: string | null | undefined): string[] => {
  if (!galleryString) return [];
  
  try {
    // Clean the string and parse JSON
    const cleanedString = galleryString.replace(/\\\//g, '/');
    const parsed = JSON.parse(cleanedString);
    
    if (Array.isArray(parsed)) {
      return parsed.map((img: string) => buildImageUrl(img)).filter(Boolean) as string[];
    }
  } catch (error) {
    console.error('Error parsing gallery images:', error);
  }
  
  return [];
};

// Helper to process product data
export const processProductData = (product: any) => {
  const mainImage = buildImageUrl(product.main_image || product.image);
  const galleryImages = parseGalleryImages(product.gallery_images);
  
  // Calculate discount percentage
  const price = parseFloat(product.price || 0);
  const offerPrice = parseFloat(product.offer_price || product.price || 0);
  const discountPercentage = price > 0 && offerPrice < price 
    ? Math.round((1 - offerPrice / price) * 100) 
    : 0;
  
  return {
    id: product.id?.toString() || Math.random().toString(),
    name: product.name || product.title || 'Product',
    title: product.name || product.title || 'Product',
    price: price,
    offer_price: offerPrice,
    image: mainImage,
    images: galleryImages.length > 0 ? galleryImages : (mainImage ? [mainImage] : []),
    category: product.category || product.category_name || '',
    category_id: product.category_id || '',
    slug: product.slug || '',
    sku: product.sku || '',
    description: product.description || product.desc || '',
    discount_percentage: discountPercentage,
    discount: discountPercentage,
    rating: parseFloat(product.rating || product.review_rating || 0),
    fastDelivery: product.fastDelivery || product.fast_delivery || true,
    inStock: product.inStock !== undefined ? product.inStock : 
             product.in_stock !== undefined ? product.in_stock : 
             product.stock_quantity > 0 ? true : true,
    stock_quantity: product.stock_quantity || product.quantity || 0,
    is_new: product.is_new || product.new || false,
    is_sale: product.is_sale || product.sale || false,
    specifications: product.specifications || product.features || '',
    brand: product.brand || '',
    model: product.model || '',
  };
};

// Helper to process category data
export const processCategoryData = (category: any) => {
  return {
    id: category.id?.toString() || Math.random().toString(),
    name: category.name || category.title || 'Category',
    slug: category.slug || '',
    image: buildImageUrl(category.image),
    description: category.description || '',
    product_count: category.products?.length || category.product_count || 0,
    products: Array.isArray(category.products) 
      ? category.products.map(processProductData)
      : [],
  };
};

// Product APIs
export const productAPI = {
  // Get products by category
  getByCategory: async (categoryId?: string) => {
    try {
      console.log(`📋 Fetching products for category: ${categoryId || 'all'}`);
      const response = await api.get('/products/by-category', {
        params: categoryId ? { category: categoryId } : {},
      });
      console.log('✅ Products by category response:', response.data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch products by category');
    }
  },

  // Get products by speciality
  getBySpeciality: async (specialityId?: string) => {
    try {
      console.log(`📋 Fetching products for speciality: ${specialityId || 'all'}`);
      const response = await api.get('/products/by-speciality', {
        params: specialityId ? { speciality: specialityId } : {},
      });
      console.log('✅ Products by speciality response:', response.data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch products by speciality');
    }
  },

  // Get new products
  getNew: async () => {
    try {
      console.log('📋 Fetching new products');
      const response = await api.get('/products/new');
      console.log('✅ New products response:', response.data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch new products');
    }
  },

  // Get sale products
  getSale: async () => {
    try {
      console.log('📋 Fetching sale products');
      const response = await api.get('/products/sale');
      console.log('✅ Sale products response:', response.data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch sale products');
    }
  },

  // Get single product by ID
  getById: async (productId: string) => {
    try {
      console.log(`📋 Fetching product details for ID: ${productId}`);
      // Note: Adjust this endpoint based on your API
      const response = await api.get(`/products/${productId}`);
      console.log('✅ Product details response:', response.data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch product details');
    }
  },
};

// Category APIs
export const categoryAPI = {
  // Get all categories
  getAll: async () => {
    try {
      console.log('📋 Fetching all categories');
      const response = await api.get('/categories');
      console.log('✅ Categories response:', response.data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  },

  // Get single category by ID
  getById: async (categoryId: string) => {
    try {
      console.log(`📋 Fetching category details for ID: ${categoryId}`);
      // Note: Adjust this endpoint based on your API
      const response = await api.get(`/categories/${categoryId}`);
      console.log('✅ Category details response:', response.data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch category details');
    }
  },
};

// Cart APIs (keep existing)
export const cartAPI = {
  // Add product to cart
  add: async (productId: string, quantity: number = 1) => {
    try {
      const response = await api.post('/cart/add', {
        product_id: productId,
        quantity: quantity,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add product to cart');
    }
  },

  // Get cart
  get: async () => {
    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error: any) {
      // Handle case where endpoint might not exist yet
      if (error.response?.status === 404) {
        console.warn('Cart endpoint not found, returning empty cart');
        return { items: [], subtotal: 0, shipping: 0, total: 0 };
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch cart');
    }
  },

  // Remove product from cart
  remove: async (productId: string) => {
    try {
      const response = await api.delete('/cart/remove', {
        data: { product_id: productId },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to remove product from cart');
    }
  },
};

// Order APIs (keep existing)
export const orderAPI = {
  // Create order from cart
  create: async () => {
    try {
      const response = await api.post('/orders/create');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create order');
    }
  },

  // Get all orders
  getAll: async () => {
    try {
      const response = await api.get('/orders');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch orders');
    }
  },

  // Get order details
  getById: async (orderId: string) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch order details');
    }
  },

  // Upload payment proof
  uploadPaymentProof: async (orderId: string, file: any) => {
    try {
      const formData = new FormData();
      formData.append('payment_proof', file);
      const response = await api.post(`/orders/${orderId}/payment-proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to upload payment proof');
    }
  },

  // Confirm arrival
  confirmArrival: async (orderId: string) => {
    try {
      const response = await api.post(`/orders/${orderId}/confirm-arrival`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to confirm arrival');
    }
  },

  // Get order documents
  getDocuments: async (orderId: string) => {
    try {
      const response = await api.get(`/orders/${orderId}/documents`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch order documents');
    }
  },
};

// Dealer APIs (keep existing)
export const dealerAPI = {
  // Check if user can order
  canOrder: async () => {
    try {
      const response = await api.get('/dealer/can-order');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to check dealer order status');
    }
  },
};

export default api;