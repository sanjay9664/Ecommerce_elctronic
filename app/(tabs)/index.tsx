import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fixed imports - use relative paths
import { productAPI, categoryAPI } from '../../services/api';

const { width } = Dimensions.get('window');

// Local storage keys
const CART_STORAGE_KEY = '@smartg5_cart';
const WISHLIST_STORAGE_KEY = '@smartg5_wishlist';

// Safe Image Component to handle loading errors
const SafeImage = ({ source, style, placeholder, resizeMode = 'cover' }) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleError = () => {
    console.log('Image failed to load:', source?.uri);
    setImageError(true);
    setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  // Return placeholder if no source or error
  if (!source?.uri || imageError) {
    return (
      <View style={[style, styles.imagePlaceholder]}>
        <Ionicons name="image-outline" size={30} color="#ccc" />
        <Text style={styles.placeholderText}>{placeholder || 'No Image'}</Text>
      </View>
    );
  }

  return (
    <View style={style}>
      {loading && (
        <View style={[styles.imageLoading, style]}>
          <ActivityIndicator size="small" color="#FF9900" />
        </View>
      )}
      <Image
        source={source}
        style={style}
        resizeMode={resizeMode}
        onError={handleError}
        onLoad={handleLoad}
      />
    </View>
  );
};

export default function HomeScreen() {
  // State for data
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState({
    products: false,
    categories: false,
  });
  const [error, setError] = useState<string | null>(null);

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showWishlistProducts, setShowWishlistProducts] = useState(false);

  // Header Menu Options - Remove wishlist route
  const menuOptions = [
    { id: '1', name: 'My Profile', icon: 'person', route: '/(tabs)/profile' },
    { id: '2', name: 'My Orders', icon: 'receipt', route: '/orders' },
    { id: '3', name: 'Settings', icon: 'settings', route: null },
    { id: '4', name: 'Customer Support', icon: 'headset', route: null },
  ];

  // Load cart and wishlist from storage on mount
  useEffect(() => {
    console.log('🚀 HomeScreen mounted - fetching real data from API...');
    loadInitialData();
  }, []);

  // Reload cart when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      console.log('HomeScreen focused - reloading cart');
      loadCartFromStorage();
    }, [])
  );

  const loadInitialData = async () => {
    await loadCartFromStorage();
    await loadWishlistFromStorage();
    fetchDataFromAPI();
  };

  // Load cart from AsyncStorage
  const loadCartFromStorage = async () => {
    try {
      const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      console.log('Load cart - raw data:', savedCart);
      
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          console.log('Home: Loaded cart from storage:', Array.isArray(parsedCart) ? parsedCart.length : 'invalid', 'items');
          
          if (Array.isArray(parsedCart)) {
            setCart(parsedCart);
          } else {
            console.error('Cart data is not an array');
            setCart([]);
          }
        } catch (parseError) {
          console.error('Error parsing cart:', parseError);
          setCart([]);
        }
      } else {
        console.log('No cart found in storage');
        setCart([]);
      }
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      setCart([]);
    }
  };

  // Save cart to AsyncStorage - FIXED: Proper error handling
  const saveCartToStorage = async (cartData: any[]) => {
    try {
      console.log('Saving cart:', cartData);
      
      // Validate cartData
      if (!Array.isArray(cartData)) {
        console.error('Invalid cart data (not array):', cartData);
        return;
      }
      
      if (cartData.length === 0) {
        // Remove item if cart is empty
        await AsyncStorage.removeItem(CART_STORAGE_KEY);
        console.log('Cart empty - removed from storage');
        return;
      }
      
      // Validate each item
      const validCartData = cartData.filter(item => 
        item && item.id && (item.name || item.title)
      ).map(item => ({
        id: item.id,
        name: item.name || item.title || 'Product',
        title: item.title || item.name || 'Product',
        price: parseFloat(item.price) || 0,
        offer_price: parseFloat(item.offer_price) || parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 1,
        image: item.image || item.images?.[0] || null,
        description: item.description || '',
        discount_percentage: item.discount_percentage || 0,
        category: item.category || '',
      }));
      
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(validCartData));
      console.log('Cart saved to storage:', validCartData.length, 'items');
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  };

  // Load wishlist from AsyncStorage
  const loadWishlistFromStorage = async () => {
    try {
      const savedWishlist = await AsyncStorage.getItem(WISHLIST_STORAGE_KEY);
      if (savedWishlist) {
        setWishlist(JSON.parse(savedWishlist));
      }
    } catch (error) {
      console.error('Error loading wishlist from storage:', error);
    }
  };

  // Save wishlist to AsyncStorage
  const saveWishlistToStorage = async () => {
    try {
      await AsyncStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (error) {
      console.error('Error saving wishlist to storage:', error);
    }
  };

  // Calculate total cart items count
  const getCartItemCount = () => {
    if (!Array.isArray(cart)) return 0;
    
    const count = cart.reduce((total, item) => {
      const quantity = item?.quantity || 1;
      return total + quantity;
    }, 0);
    
    console.log('Cart count calculated:', count, 'items in cart');
    return count;
  };

  // Add to cart function - FIXED
  const addToCart = (product: any, quantity: number = 1) => {
    console.log('Adding to cart:', product?.name, 'quantity:', quantity);
    
    setCart(prevCart => {
      if (!Array.isArray(prevCart)) {
        console.error('prevCart is not an array:', prevCart);
        return prevCart;
      }
      
      const existingItem = prevCart.find(item => item.id === product.id);
      let updatedCart;
      
      if (existingItem) {
        // Update quantity if product already in cart
        updatedCart = prevCart.map(item =>
          item.id === product.id
            ? { 
                ...item, 
                quantity: (parseInt(item.quantity) || 1) + quantity 
              }
            : item
        );
      } else {
        // Add new product to cart
        updatedCart = [...prevCart, { 
          ...product, 
          quantity: quantity,
          offer_price: product.offer_price || product.price,
          price: product.price || 0,
          image: product.image || product.images?.[0] || null,
          name: product.name || product.title || 'Product',
          title: product.title || product.name || 'Product'
        }];
      }
      
      console.log('Updated cart before save:', updatedCart);
      saveCartToStorage(updatedCart);
      return updatedCart;
    });
  };

  // Remove from cart function - FIXED
  const removeFromCart = (productId: string) => {
    console.log('Removing from cart:', productId);
    
    setCart(prevCart => {
      if (!Array.isArray(prevCart)) {
        console.error('prevCart is not an array:', prevCart);
        return prevCart;
      }
      
      const updatedCart = prevCart.filter(item => item.id !== productId);
      console.log('After removal, cart:', updatedCart);
      saveCartToStorage(updatedCart);
      return updatedCart;
    });
  };

  // Update cart quantity - FIXED
  const updateCartQuantity = (productId: string, quantity: number) => {
    console.log('Updating quantity:', productId, 'to', quantity);
    
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => {
      if (!Array.isArray(prevCart)) {
        console.error('prevCart is not an array:', prevCart);
        return prevCart;
      }
      
      const updatedCart = prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity: quantity }
          : item
      );
      saveCartToStorage(updatedCart);
      return updatedCart;
    });
  };

  // Clear cart completely
  const clearCart = async () => {
    try {
      console.log('Clearing cart completely');
      setCart([]);
      await AsyncStorage.removeItem(CART_STORAGE_KEY);
      console.log('Cart cleared from storage');
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  // Add to wishlist function
  const addToWishlist = (product: any) => {
    setWishlist(prev => {
      // Check if product is already in wishlist
      if (prev.some(item => item.id === product.id)) {
        return prev;
      }
      return [...prev, product];
    });
  };

  // Remove from wishlist function
  const removeFromWishlist = (productId: string) => {
    setWishlist(prev => prev.filter(item => item.id !== productId));
  };

  // Toggle wishlist function
  const toggleWishlist = (product: any) => {
    if (wishlist.find(item => item.id === product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  // Show wishlist products directly
  const handleHeartIconClick = () => {
    setShowWishlistProducts(!showWishlistProducts);
  };

  // Fetch data on mount
  const fetchDataFromAPI = async () => {
    console.log('🌐 Starting real API calls...');
    
    try {
      setError(null);
      
      // Fetch categories from API
      setLoading(prev => ({ ...prev, categories: true }));
      console.log('📋 Fetching categories from /categories endpoint...');
      
      try {
        const categoriesResponse = await categoryAPI.getAll();
        console.log('✅ Categories API raw response:', categoriesResponse);
        
        // Handle your API response structure
        let categoriesArray = [];
        
        if (categoriesResponse?.status === true && categoriesResponse?.data) {
          // Your API structure: { status: true, data: [...] }
          categoriesArray = categoriesResponse.data;
          console.log('📊 Categories from data property:', categoriesArray.length);
          
          // Process each category to extract its products
          let allProducts: any[] = [];
          
          categoriesArray.forEach((category: any) => {
            console.log(`📦 Category: ${category.name}, Products: ${category.products?.length || 0}`);
            
            if (category.products && Array.isArray(category.products)) {
              // Process each product in this category
              const categoryProducts = category.products.map((product: any) => {
                // Build full image URL - FIXED: Remove extra space
                const mainImage = product.main_image 
                  ? `https://smartg5.com/${product.main_image}`
                  : null;
                
                // Parse gallery images
                let galleryImages: string[] = [];
                try {
                  if (product.gallery_images) {
                    const parsed = JSON.parse(product.gallery_images.replace(/\\\//g, '/'));
                    if (Array.isArray(parsed)) {
                      galleryImages = parsed.map((img: string) => `https://smartg5.com/${img}`);
                    }
                  }
                } catch (e) {
                  console.log('Error parsing gallery images:', e);
                }
                
                return {
                  id: product.id?.toString() || Math.random().toString(),
                  name: product.name || 'Product',
                  title: product.name || 'Product',
                  price: parseFloat(product.price || 0),
                  offer_price: parseFloat(product.offer_price || product.price || 0),
                  image: mainImage,
                  images: galleryImages.length > 0 ? galleryImages : (mainImage ? [mainImage] : []),
                  category: category.name,
                  category_id: category.id?.toString() || '',
                  slug: product.slug,
                  sku: product.sku,
                  description: product.description || '',
                  discount_percentage: product.offer_price && product.price 
                    ? Math.round((1 - parseFloat(product.offer_price) / parseFloat(product.price)) * 100)
                    : 0,
                  discount: product.offer_price && product.price 
                    ? Math.round((1 - parseFloat(product.offer_price) / parseFloat(product.price)) * 100)
                    : 0,
                  rating: 0,
                  fastDelivery: true,
                  inStock: true,
                };
              });
              
              allProducts = [...allProducts, ...categoryProducts];
            }
          });
          
          console.log('📊 Total products from all categories:', allProducts.length);
          
          if (allProducts.length > 0) {
            console.log('✅ Setting products:', allProducts.length);
            setProducts(allProducts);
          }
        }
        
        // Clean categories data for display
        const cleanedCategories = categoriesArray.map((category: any) => {
          // Build full image URL for category - FIXED: Remove extra space
          const categoryImage = category.image 
            ? `https://smartg5.com/${category.image}`
            : null;
          
          return {
            id: category.id?.toString() || Math.random().toString(),
            name: category.name || category.title || 'Category',
            icon: 'folder', // Default icon
            image: categoryImage,
            description: category.description || '',
            product_count: category.products?.length || 0,
          };
        });
        
        console.log('✅ Setting cleaned categories:', cleanedCategories.length);
        setCategories(cleanedCategories);
        
      } catch (catError: any) {
        console.error('❌ Categories API error:', catError.message);
        setError('Failed to load categories: ' + catError.message);
      } finally {
        setLoading(prev => ({ ...prev, categories: false }));
      }

      // If no products were loaded from categories, try to fetch products separately
      if (products.length === 0) {
        setLoading(prev => ({ ...prev, products: true }));
        console.log('📦 Fetching products from /products/new endpoint...');
        
        try {
          const productsResponse = await productAPI.getNew();
          console.log('✅ Products API raw response:', productsResponse);
          
          // Handle different response structures for products endpoint
          let productsArray = [];
          
          if (productsResponse?.status === true && productsResponse?.data) {
            productsArray = productsResponse.data;
          } else if (Array.isArray(productsResponse)) {
            productsArray = productsResponse;
          }
          
          // Process products if found
          if (productsArray.length > 0) {
            const processedProducts = productsArray.map((product: any) => {
              // Build full image URL - FIXED: Remove extra space
              const mainImage = product.main_image || product.image;
              const fullImageUrl = mainImage 
                ? `https://smartg5.com/${mainImage}`
                : null;
              
              return {
                id: product.id?.toString() || Math.random().toString(),
                name: product.name || product.title || 'Product',
                title: product.name || product.title || 'Product',
                price: parseFloat(product.price || product.offer_price || 0),
                offer_price: parseFloat(product.offer_price || product.price || 0),
                image: fullImageUrl,
                category: product.category || product.category_name || '',
                category_id: product.category_id || '',
                discount_percentage: product.offer_price && product.price 
                  ? Math.round((1 - parseFloat(product.offer_price) / parseFloat(product.price)) * 100)
                  : 0,
                discount: product.offer_price && product.price 
                  ? Math.round((1 - parseFloat(product.offer_price) / parseFloat(product.price)) * 100)
                  : 0,
                rating: 0,
                fastDelivery: true,
                inStock: true,
              };
            });
            
            console.log('✅ Setting products from /products/new:', processedProducts.length);
            setProducts(prev => [...prev, ...processedProducts]);
          }
          
        } catch (prodError: any) {
          console.error('❌ Products API error:', prodError.message);
        } finally {
          setLoading(prev => ({ ...prev, products: false }));
        }
      }
      
      console.log('✅ All API calls completed');
      
    } catch (err: any) {
      console.error('💥 Main fetch error:', err);
      setError('Failed to load data from server. Please check your connection.');
    }
  };

  // Helper function to safely format price
  const formatPrice = (price: any) => {
    if (price === undefined || price === null) {
      return '0.00';
    }
    
    const priceNum = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(priceNum)) {
      return '0.00';
    }
    
    return priceNum.toFixed(2);
  };

  // Helper to get display price (offer price if available, otherwise regular price)
  const getDisplayPrice = (product: any) => {
    if (!product) return 0;
    if (product?.offer_price && product.offer_price > 0) {
      return product.offer_price;
    }
    return product?.price || 0;
  };

  // Search Functionality - FIXED
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.length > 0) {
      setIsSearching(true);
      // FIX: Check if products array exists and is not empty
      if (products && products.length > 0) {
        const results = products.filter(product => {
          if (!product) return false;
          const name = product?.name || product?.title || '';
          return name.toLowerCase().includes(text.toLowerCase());
        });
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  // Add to Cart with Alert - FIXED: Using local cart function
  const handleAddToCart = (product: any) => {
    try {
      if (!product) {
        Alert.alert('Error', 'Product information is missing');
        return;
      }
      addToCart(product);
      const productName = product?.name || product?.title || 'Product';
      Alert.alert('Success', `${productName} added to cart!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add product to cart');
    }
  };

  // Toggle Wishlist - FIXED: Using local wishlist function
  const handleToggleWishlist = (product: any) => {
    if (!product || !product.id) return;
    
    const productName = product?.name || product?.title || 'Product';
    const isInWishlist = wishlist?.find(item => item?.id === product.id) || false;
    
    if (isInWishlist) {
      removeFromWishlist(product.id);
      Alert.alert('Removed', `${productName} removed from wishlist`);
    } else {
      addToWishlist(product);
      Alert.alert('Added', `${productName} added to wishlist`);
    }
  };

  // Handle product click - FIXED
  const handleProductClick = (product: any) => {
    if (!product || !product.id) {
      console.error('Product missing ID or invalid:', product);
      Alert.alert('Error', 'Product information is incomplete');
      return;
    }
    
    console.log('Navigating to product detail:', product.id);
    try {
      // Pass the complete product data to the detail page
      router.push({
        pathname: '/product/[id]',
        params: { 
          id: product.id,
          productData: JSON.stringify(product) // Pass entire product as JSON string
        }
      });
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Error', 'Failed to open product details');
    }
  };

  // Render Category
  const renderCategory = ({ item }: any) => {
    // Map category names to icons
    const getCategoryIcon = (categoryName: string) => {
      const name = categoryName?.toLowerCase() || '';
      if (name.includes('medical') || name.includes('equipment')) return 'medical-services';
      if (name.includes('hotel') || name.includes('smart')) return 'hotel';
      if (name.includes('supply') || name.includes('tool')) return 'build';
      if (name.includes('pharmacy') || name.includes('drug')) return 'local-pharmacy';
      if (name.includes('lab') || name.includes('test')) return 'science';
      if (name.includes('surgical') || name.includes('surgery')) return 'healing';
      if (name.includes('diagnostic')) return 'biotech';
      return 'folder';
    };
    
    const categoryIcon = getCategoryIcon(item?.name);
    const productCount = item?.product_count || 0;
    
    return (
      <TouchableOpacity 
        style={styles.categoryItem}
        onPress={() => {
          // FIXED: Safe navigation with proper error handling
          if (item?.id && item?.name) {
            router.push({
              pathname: '/(tabs)/category/[id]',
              params: { 
                id: item.id,
                categoryName: item.name 
              }
            });
          } else {
            console.error('Category item missing required fields:', item);
            Alert.alert('Error', 'Category information is incomplete');
          }
        }}
      >
        {item?.image ? (
          <SafeImage 
            source={{ uri: item.image }}
            style={styles.categoryIconImage}
            placeholder={item.name}
          />
        ) : (
          <MaterialIcons name={categoryIcon as any} size={32} color="#FF9900" />
        )}
        <Text style={styles.categoryText} numberOfLines={2}>{item?.name || 'Category'}</Text>
        {productCount > 0 && (
          <Text style={styles.categoryCount}>{productCount} items</Text>
        )}
      </TouchableOpacity>
    );
  };

  // Render Product Card - FIXED
  const renderProduct = ({ item }: any) => {
    if (!item) return null;
    
    const productName = item?.name || item?.title || 'Product';
    const productImage = item?.image || item?.images?.[0] || null;
    const productRating = item?.rating || 0;
    const displayPrice = getDisplayPrice(item);
    const regularPrice = item?.price || 0;
    const discount = item?.discount_percentage || item?.discount || 0;
    const hasDiscount = discount > 0 && displayPrice < regularPrice;
    const isInWishlist = wishlist?.some(w => w?.id === item?.id) || false;
    
    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => handleProductClick(item)}
      >
        <SafeImage 
          source={{ uri: productImage }} 
          style={styles.productImage}
          placeholder="Product Image"
          resizeMode="cover"
        />
        
        {/* Wishlist Button */}
        <TouchableOpacity 
          style={styles.wishlistButton}
          onPress={(e) => {
            e.stopPropagation(); // Prevent product card click
            handleToggleWishlist(item);
          }}
        >
          <Ionicons 
            name={isInWishlist ? "heart" : "heart-outline"} 
            size={20} 
            color={isInWishlist ? "red" : "#666"} 
          />
        </TouchableOpacity>

        {/* Discount Badge */}
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{discount}% OFF</Text>
          </View>
        )}

        <Text style={styles.productName} numberOfLines={2}>{productName}</Text>
        {productRating > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{productRating.toFixed(1)}</Text>
          </View>
        )}
        
        {/* Price Section */}
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>${formatPrice(displayPrice)}</Text>
          {hasDiscount && (
            <Text style={styles.originalPrice}>${formatPrice(regularPrice)}</Text>
          )}
        </View>
        
        {/* Fast Delivery Badge */}
        {item?.fastDelivery && (
          <View style={styles.fastDeliveryBadge}>
            <Text style={styles.fastDeliveryText}>🚚 Fast Delivery</Text>
          </View>
        )}
        
        {/* Category Badge */}
        {item?.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.addToCartBtn}
          onPress={(e) => {
            e.stopPropagation(); // Prevent product card click
            handleAddToCart(item);
          }}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Calculate cart item count
  const cartItemCount = getCartItemCount();
  console.log('Current cart item count for display:', cartItemCount);

  return (
    <SafeAreaView style={styles.container}>
      {/* Beautiful Header - REMOVED DEBUG ICON */}
      <View style={styles.header}>
        {/* Menu Button */}
        <TouchableOpacity onPress={() => setIsMenuVisible(true)}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        
        {/* Enhanced Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🏨</Text>
          <Text style={styles.logoText}>SmartG5</Text>
        </View>
        
        {/* Header Icons - ONLY KEEP WISHLIST AND CART */}
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleHeartIconClick}
          >
            <Ionicons 
              name={showWishlistProducts ? "heart" : "heart-outline"} 
              size={24} 
              color="#fff" 
            />
            {wishlist.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {wishlist.length > 9 ? '9+' : wishlist.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => {
              console.log('Cart icon clicked, current count:', cartItemCount);
              router.push('/(tabs)/cart');
            }}
          >
            <Ionicons name="cart-outline" size={24} color="#fff" />
            {cartItemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Enhanced Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => {
              setSearchQuery('');
              setIsSearching(false);
              setSearchResults([]);
            }}
          >
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Wishlist Products Section */}
      {showWishlistProducts && (
        <View style={styles.wishlistSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>❤️ My Wishlist ({wishlist.length})</Text>
            <TouchableOpacity onPress={() => setShowWishlistProducts(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          {wishlist.length === 0 ? (
            <View style={styles.emptyWishlist}>
              <Ionicons name="heart-outline" size={60} color="#ccc" />
              <Text style={styles.emptyWishlistText}>Your wishlist is empty</Text>
              <Text style={styles.emptyWishlistSubtext}>Click heart icon on products to add them here</Text>
            </View>
          ) : (
            <FlatList
              data={wishlist}
              renderItem={renderProduct}
              keyExtractor={item => item?.id?.toString() || Math.random().toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.wishlistProductsList}
            />
          )}
        </View>
      )}

      {/* Search Results - FIXED */}
      {isSearching && (
        <View style={styles.searchResultsContainer}>
          <Text style={styles.searchResultsTitle}>
            Search Results ({searchResults.length})
          </Text>
          {searchResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={40} color="#ccc" />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          ) : (
            searchResults.map((product, index) => {
              if (!product) return null;
              const productName = product?.name || product?.title || 'Product';
              const productImage = product?.image || product?.images?.[0] || null;
              const displayPrice = getDisplayPrice(product);
              
              return (
                <TouchableOpacity 
                  key={product?.id?.toString() || index.toString()}
                  style={styles.searchResultItem}
                  onPress={() => {
                    if (product?.id) {
                      handleProductClick(product);
                      setIsSearching(false);
                      setSearchQuery('');
                    }
                  }}
                >
                  <SafeImage 
                    source={{ uri: productImage }} 
                    style={styles.searchResultImage}
                  />
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName} numberOfLines={2}>
                      {productName}
                    </Text>
                    <Text style={styles.searchResultPrice}>
                      ${formatPrice(displayPrice)}
                    </Text>
                    {product?.category && (
                      <Text style={styles.searchResultCategory}>{product.category}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}

      {!isSearching && !showWishlistProducts && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={20} color="#c62828" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={fetchDataFromAPI}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Enhanced Banner */}
          <View style={styles.banner}>
            <SafeImage
              source={{ uri: 'https://smartg5.com/img/hotelsection.png' }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerTitle}>Smart Hotel Solutions</Text>
              <Text style={styles.bannerSubtitle}>Premium GRMS & Hotel Technology</Text>
            </View>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏷️ Shop by Category</Text>
            {loading.categories ? (
              <ActivityIndicator size="large" color="#FF9900" style={styles.loader} />
            ) : (
              <FlatList
                data={categories}
                renderItem={renderCategory}
                keyExtractor={item => item?.id?.toString() || Math.random().toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesList}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="folder-outline" size={40} color="#ccc" />
                    <Text style={styles.emptyText}>No categories available</Text>
                  </View>
                }
              />
            )}
          </View>

          {/* Featured Products */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>✨ Featured Products</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/all-products')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {loading.products ? (
              <ActivityIndicator size="large" color="#FF9900" style={styles.loader} />
            ) : (
              <FlatList
                data={products.slice(0, 6)}
                renderItem={renderProduct}
                keyExtractor={item => item?.id?.toString() || Math.random().toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.productsList}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="cube-outline" size={40} color="#ccc" />
                    <Text style={styles.emptyText}>No products available</Text>
                  </View>
                }
              />
            )}
          </View>

          {/* Today's Deals - FIXED CLICK HANDLER */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔥 Today's Deals</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/sale')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {loading.products ? (
              <ActivityIndicator size="large" color="#FF9900" style={styles.loader} />
            ) : (
              <View style={styles.dealsGrid}>
                {products
                  .filter(p => p?.discount_percentage > 0 || p?.discount > 0)
                  .slice(0, 4)
                  .map((product, index) => {
                    if (!product) return null;
                    const productImage = product?.image || product?.images?.[0] || null;
                    const displayPrice = getDisplayPrice(product);
                    const discount = product?.discount_percentage || product?.discount || 0;
                    return (
                      <TouchableOpacity 
                        key={product?.id?.toString() || index.toString()}
                        style={styles.dealCard}
                        onPress={() => handleProductClick(product)}
                      >
                        <SafeImage 
                          source={{ uri: productImage }} 
                          style={styles.dealImage}
                          resizeMode="cover"
                        />
                        {discount > 0 && (
                          <View style={styles.dealBadge}>
                            <Text style={styles.dealBadgeText}>{discount}% OFF</Text>
                          </View>
                        )}
                        <Text style={styles.dealName} numberOfLines={2}>
                          {product?.name || product?.title}
                        </Text>
                        <View style={styles.dealPriceContainer}>
                          <Text style={styles.dealPrice}>${formatPrice(displayPrice)}</Text>
                          {discount > 0 && product?.price && (
                            <Text style={styles.dealOriginalPrice}>${formatPrice(product.price)}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                {products.filter(p => p?.discount_percentage > 0 || p?.discount > 0).length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="pricetag-outline" size={40} color="#ccc" />
                    <Text style={styles.emptyText}>No deals available</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      {/* Menu Modal */}
      <Modal
        visible={isMenuVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setIsMenuVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Menu</Text>
            {menuOptions.map(option => (
              <TouchableOpacity 
                key={option.id}
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuVisible(false);
                  if (option.route) {
                    router.push(option.route as any);
                  } else {
                    Alert.alert(option.name, `${option.name} feature coming soon!`);
                  }
                }}
              >
                <Ionicons name={option.icon as any} size={24} color="#131921" />
                <Text style={styles.menuItemText}>{option.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    marginRight: 8,
  },
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 15,
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 25,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  imagePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
  imageLoading: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  wishlistSection: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  closeText: {
    color: '#ff4757',
    fontWeight: 'bold',
  },
  emptyWishlist: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyWishlistText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
    fontWeight: '500',
  },
  emptyWishlistSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  wishlistProductsList: {
    paddingVertical: 10,
  },
  searchResultsContainer: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 15,
    padding: 15,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1a1a2e',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 15,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a2e',
  },
  searchResultPrice: {
    fontSize: 16,
    color: '#B12704',
    fontWeight: 'bold',
    marginTop: 2,
  },
  searchResultCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  banner: {
    marginHorizontal: 15,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  bannerImage: {
    width: '100%',
    height: 200,
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 20,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bannerSubtitle: {
    color: '#FF9900',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 5,
  },
  section: {
    marginVertical: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
    paddingHorizontal: 15,
  },
  seeAllText: {
    color: '#0066c0',
    fontWeight: '600',
    fontSize: 14,
  },
  categoriesList: {
    paddingHorizontal: 10,
  },
  categoryItem: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginHorizontal: 8,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIconImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 90,
    color: '#1a1a2e',
  },
  categoryCount: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  productsList: {
    paddingHorizontal: 10,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 12,
    marginHorizontal: 8,
    width: 170,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 130,
    borderRadius: 12,
  },
  wishlistButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  discountBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#ff4757',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    height: 40,
    color: '#1a1a2e',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  rating: {
    marginLeft: 6,
    fontSize: 13,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B12704',
  },
  originalPrice: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  fastDeliveryBadge: {
    backgroundColor: '#FFD814',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  fastDeliveryText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#131921',
  },
  categoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: '#666',
  },
  addToCartBtn: {
    backgroundColor: '#FFD814',
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addToCartText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#131921',
  },
  dealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  dealCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    width: (width - 50) / 2,
    marginBottom: 15,
    padding: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dealImage: {
    width: '100%',
    height: 130,
    borderRadius: 12,
  },
  dealBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#ff4757',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  dealBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  dealName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    height: 40,
    color: '#1a1a2e',
  },
  dealPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dealPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B12704',
  },
  dealOriginalPrice: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 50,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#1a1a2e',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 18,
    marginLeft: 20,
    color: '#1a1a2e',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 20,
    margin: 15,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
  },
  retryText: {
    color: '#0066c0',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 15,
  },
  loader: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    width: '100%',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 15,
    fontSize: 18,
    fontWeight: '500',
  },
});