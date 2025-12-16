import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productAPI } from '../../services/api';
import { SafeImage } from '../../components/common/SafeImage';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const SORT_OPTIONS = [
  { id: 'discount_high', label: 'Biggest Discount', icon: 'trending-down', color: '#FF5252' },
  { id: 'price_low', label: 'Price Low to High', icon: 'arrow-up', color: '#4CAF50' },
  { id: 'price_high', label: 'Price High to Low', icon: 'arrow-down', color: '#2196F3' },
  { id: 'newest', label: 'Newest First', icon: 'new-releases', color: '#9C27B0' },
  { id: 'popular', label: 'Most Popular', icon: 'trending-up', color: '#FF9800' },
];

const QUICK_FILTERS = [
  { id: 'under500', label: 'Under ₹500', max: 500 },
  { id: '500_2000', label: '₹500-₹2000', min: 500, max: 2000 },
  { id: '2000_5000', label: '₹2000-₹5000', min: 2000, max: 5000 },
  { id: 'above5000', label: 'Above ₹5000', min: 5000 },
];

export default function SaleScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [sortBy, setSortBy] = useState('discount_high');
  const [showSortModal, setShowSortModal] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    fetchSaleProducts();
    loadCartAndWishlist();
    startAnimations();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [products, sortBy, minPrice, maxPrice, searchQuery]);

  const startAnimations = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  };

  const loadCartAndWishlist = async () => {
    try {
      const [savedCart, savedWishlist] = await Promise.all([
        AsyncStorage.getItem('@cart'),
        AsyncStorage.getItem('@wishlist'),
      ]);
      
      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    } catch (error) {
      console.error('Error loading cart/wishlist:', error);
    }
  };

  const fetchSaleProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getSale();
      
      if (response.status === true && response.data) {
        const processedProducts = response.data
          .filter((product: any) => product)
          .map((product: any) => ({
            id: product.id?.toString() || Math.random().toString(),
            name: product.name || product.title || 'Premium Product',
            description: product.description || 'Experience premium quality with amazing discount. Limited time offer!',
            price: parseFloat(product.price || 0),
            offer_price: parseFloat(product.offer_price || product.price || 0),
            image: product.main_image ? `https://smartg5.com/${product.main_image}` : 
                   product.image ? `https://smartg5.com/${product.image}` : null,
            category: product.category || product.category_name || 'Sale',
            discount_percentage: product.offer_price && product.price 
              ? Math.round((1 - parseFloat(product.offer_price) / parseFloat(product.price)) * 100)
              : Math.floor(Math.random() * 50) + 20,
            rating: parseFloat(product.rating || product.review_rating || (Math.random() * 4 + 1).toFixed(1)),
            review_count: product.review_count || Math.floor(Math.random() * 500),
            in_stock: product.in_stock !== undefined ? product.in_stock : true,
            fast_delivery: product.fast_delivery || Math.random() > 0.3,
            specifications: product.specifications || 'Premium Quality | Durable | Eco-friendly',
            brand: product.brand || 'SmartG5 Premium',
            sku: product.sku || `SG5-${Math.floor(Math.random() * 10000)}`,
            warranty: product.warranty || '1 Year Warranty',
            return_policy: product.return_policy || '30 Days Return',
            tags: ['Limited', 'Hot', 'Exclusive', 'Trending'],
            quantity_in_cart: 0,
            is_in_wishlist: false,
          }));
        
        setProducts(processedProducts);
        setFilteredProducts(processedProducts);
      } else {
        // Mock data
        const mockProducts = Array.from({ length: 20 }).map((_, index) => ({
          id: `sale-${index}`,
          name: `Sale Product ${index + 1}`,
          description: 'Premium quality product with exclusive discount',
          price: 1500 + Math.random() * 8500,
          offer_price: 800 + Math.random() * 4000,
          image: `https://images.unsplash.com/photo-${150000 + index}?auto=format&fit=crop&w=400&h=300&q=80`,
          category: ['Electronics', 'Home', 'Fashion', 'Health'][index % 4],
          discount_percentage: 40 + Math.floor(Math.random() * 40),
          rating: (Math.random() * 4 + 1).toFixed(1),
          review_count: Math.floor(Math.random() * 1000),
          in_stock: Math.random() > 0.1,
          fast_delivery: Math.random() > 0.2,
          specifications: 'Premium Materials | Advanced Technology',
          brand: ['SmartG5', 'Premium', 'Elite', 'Pro'][index % 4],
          sku: `SG5-SALE-${1000 + index}`,
          warranty: '2 Year Warranty',
          return_policy: '45 Days Return',
          tags: ['HOT', 'Premium', 'Limited', 'Fast'],
          quantity_in_cart: 0,
          is_in_wishlist: false,
        }));
        
        setProducts(mockProducts);
        setFilteredProducts(mockProducts);
      }
    } catch (error) {
      console.error('Error fetching sale products:', error);
      Alert.alert('Error', 'Failed to load exclusive deals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query)
      );
    }

    // Price filter
    if (minPrice) {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) {
        filtered = filtered.filter(p => p.offer_price >= min);
      }
    }
    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        filtered = filtered.filter(p => p.offer_price <= max);
      }
    }

    // Sort products
    switch (sortBy) {
      case 'discount_high':
        filtered.sort((a, b) => b.discount_percentage - a.discount_percentage);
        break;
      case 'price_low':
        filtered.sort((a, b) => a.offer_price - b.offer_price);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.offer_price - a.offer_price);
        break;
      case 'newest':
        filtered.sort((a, b) => b.id.localeCompare(a.id));
        break;
      case 'popular':
        filtered.sort((a, b) => b.review_count - a.review_count);
        break;
    }

    setFilteredProducts(filtered);
  };

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    await fetchSaleProducts();
  };

  const handleAddToCart = async (product: any) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const existingItem = cart.find(item => item.id === product.id);
      let newCart;
      
      if (existingItem) {
        newCart = cart.map(item =>
          item.id === product.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item
        );
      } else {
        newCart = [...cart, { ...product, quantity: 1 }];
      }
      
      setCart(newCart);
      await AsyncStorage.setItem('@cart', JSON.stringify(newCart));
      
      Alert.alert(
        'Added to Cart',
        `${product.name} has been added to your cart`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add product to cart');
    }
  };

  const handleToggleWishlist = async (product: any) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const isInWishlist = wishlist.some(item => item.id === product.id);
      let newWishlist;
      
      if (isInWishlist) {
        newWishlist = wishlist.filter(item => item.id !== product.id);
        Alert.alert('Removed', `${product.name} removed from wishlist`);
      } else {
        newWishlist = [...wishlist, product];
        Alert.alert('Added to Wishlist', `${product.name} added to your wishlist`);
      }
      
      setWishlist(newWishlist);
      await AsyncStorage.setItem('@wishlist', JSON.stringify(newWishlist));
      
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, is_in_wishlist: !isInWishlist } : p
      ));
    } catch (error) {
      Alert.alert('Error', 'Failed to update wishlist');
    }
  };

  const handleViewProduct = (product: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedProduct(product);
    openProductModal();
  };

  const openProductModal = () => {
    setShowProductModal(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  const closeProductModal = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowProductModal(false);
    });
  };

  const handleClearFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('discount_high');
    setSearchQuery('');
  };

  const applyQuickFilter = (filter: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMinPrice(filter.min?.toString() || '');
    setMaxPrice(filter.max?.toString() || '');
  };

  const renderProduct = ({ item }: any) => {
    const discount = item.discount_percentage || 0;
    const displayPrice = item.offer_price || item.price;
    const originalPrice = item.price || displayPrice * (1 + discount / 100);
    const isInWishlist = wishlist.some(w => w.id === item.id);
    const cartItem = cart.find(c => c.id === item.id);
    const quantityInCart = cartItem?.quantity || 0;

    return (
      <View style={styles.productCard}>
        <TouchableOpacity 
          onPress={() => handleViewProduct(item)}
          activeOpacity={0.9}
          style={styles.productCardInner}
        >
          {/* Product Image */}
          <View style={styles.productImageContainer}>
            <SafeImage 
              source={{ uri: item.image }} 
              style={styles.productImage}
              showPlaceholder={true}
              placeholder="Product"
            />
            
            {/* Discount Badge */}
            <View style={styles.discountBadge}>
              <LinearGradient
                colors={['#FF5252', '#FF4081']}
                style={styles.discountBadgeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.discountBadgeText}>{discount}% OFF</Text>
              </LinearGradient>
            </View>
            
            {/* Wishlist Button */}
            <TouchableOpacity 
              style={[styles.wishlistButton, isInWishlist && styles.wishlistButtonActive]}
              onPress={() => handleToggleWishlist(item)}
            >
              <Ionicons 
                name={isInWishlist ? "heart" : "heart-outline"} 
                size={18} 
                color={isInWishlist ? "#FF4081" : "#fff"} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Product Info */}
          <View style={styles.productInfo}>
            {/* Category */}
            <Text style={styles.productCategory} numberOfLines={1}>
              {item.category}
            </Text>
            
            {/* Product Name */}
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            
            {/* Rating */}
            <View style={styles.ratingContainer}>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons 
                    key={star}
                    name="star" 
                    size={12} 
                    color={star <= Math.floor(item.rating) ? "#FFD700" : "#ddd"} 
                  />
                ))}
              </View>
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
            
            {/* Price */}
            <View style={styles.priceContainer}>
              <Text style={styles.currentPrice}>₹{displayPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
              <Text style={styles.originalPrice}>₹{originalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Text>
            </View>
            
            {/* Save Amount */}
            <Text style={styles.saveText}>
              Save ₹{(originalPrice - displayPrice).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </Text>
            
            {/* Stock Status */}
            {!item.in_stock ? (
              <View style={styles.outOfStockContainer}>
                <Text style={styles.outOfStockText}>Out of Stock</Text>
              </View>
            ) : (
              <View style={styles.deliveryContainer}>
                <Ionicons name="rocket" size={12} color="#4CAF50" />
                <Text style={styles.deliveryText}>
                  {item.fast_delivery ? 'Fast Delivery' : 'Standard'}
                </Text>
              </View>
            )}
            
            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={styles.viewButton}
                onPress={() => handleViewProduct(item)}
              >
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.cartButton, quantityInCart > 0 && styles.cartButtonActive]}
                onPress={() => handleAddToCart(item)}
                disabled={!item.in_stock}
              >
                {quantityInCart > 0 ? (
                  <View style={styles.cartQuantityContainer}>
                    <Text style={styles.cartQuantityText}>{quantityInCart}</Text>
                    <Ionicons name="cart" size={14} color="#fff" />
                  </View>
                ) : (
                  <Ionicons name="cart-outline" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderProductModal = () => {
    if (!selectedProduct) return null;

    const discount = selectedProduct.discount_percentage || 0;
    const displayPrice = selectedProduct.offer_price || selectedProduct.price;
    const originalPrice = selectedProduct.price || displayPrice * (1 + discount / 100);
    const isInWishlist = wishlist.some(w => w.id === selectedProduct.id);
    const cartItem = cart.find(c => c.id === selectedProduct.id);
    const quantityInCart = cartItem?.quantity || 0;

    return (
      <Modal
        visible={showProductModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeProductModal}
      >
        <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
          <ScrollView 
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Product Image */}
            <View style={styles.modalImageSection}>
              <LinearGradient
                colors={['#000', '#333']}
                style={styles.modalImageGradient}
              >
                <SafeImage 
                  source={{ uri: selectedProduct.image }} 
                  style={styles.modalImage}
                  showPlaceholder={true}
                />
              </LinearGradient>
              
              {/* Close Button */}
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={closeProductModal}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              
              {/* Wishlist Button */}
              <TouchableOpacity 
                style={styles.modalWishlistButton}
                onPress={() => handleToggleWishlist(selectedProduct)}
              >
                <Ionicons 
                  name={isInWishlist ? "heart" : "heart-outline"} 
                  size={22} 
                  color={isInWishlist ? "#FF4081" : "#fff"} 
                />
              </TouchableOpacity>
              
              {/* Discount Badge */}
              <View style={styles.modalDiscountContainer}>
                <LinearGradient
                  colors={['#FF5252', '#FF4081']}
                  style={styles.modalDiscountGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.modalDiscountText}>SAVE {discount}%</Text>
                </LinearGradient>
              </View>
            </View>

            {/* Product Details */}
            <View style={styles.modalDetailsSection}>
              {/* Brand & Category */}
              <View style={styles.brandCategoryContainer}>
                <View style={styles.brandContainer}>
                  <Ionicons name="business" size={16} color="#666" />
                  <Text style={styles.brandText}>{selectedProduct.brand}</Text>
                </View>
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>{selectedProduct.category}</Text>
                </View>
              </View>
              
              {/* Product Name */}
              <Text style={styles.modalProductName}>{selectedProduct.name}</Text>
              
              {/* Rating */}
              <View style={styles.modalRatingContainer}>
                <View style={styles.modalRatingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons 
                      key={star}
                      name="star" 
                      size={16} 
                      color={star <= Math.floor(selectedProduct.rating) ? "#FFD700" : "#ddd"} 
                    />
                  ))}
                </View>
                <Text style={styles.modalRatingText}>{selectedProduct.rating} • {selectedProduct.review_count} reviews</Text>
              </View>
              
              {/* Price */}
              <View style={styles.modalPriceSection}>
                <View style={styles.priceRow}>
                  <Text style={styles.modalCurrentPrice}>₹{displayPrice.toLocaleString('en-IN')}</Text>
                  <Text style={styles.modalOriginalPrice}>₹{originalPrice.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.savingsContainer}>
                  <Feather name="save" size={16} color="#4CAF50" />
                  <Text style={styles.savingsText}>
                    Save ₹{(originalPrice - displayPrice).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>
              
              {/* Description */}
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>
                  {selectedProduct.description}
                </Text>
              </View>
              
              {/* Specifications */}
              <View style={styles.specsSection}>
                <Text style={styles.sectionTitle}>Specifications</Text>
                <View style={styles.specsGrid}>
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Brand</Text>
                    <Text style={styles.specValue}>{selectedProduct.brand}</Text>
                  </View>
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>SKU</Text>
                    <Text style={styles.specValue}>{selectedProduct.sku}</Text>
                  </View>
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Warranty</Text>
                    <Text style={styles.specValue}>{selectedProduct.warranty}</Text>
                  </View>
                  <View style={styles.specItem}>
                    <Text style={styles.specLabel}>Delivery</Text>
                    <Text style={styles.specValue}>
                      {selectedProduct.fast_delivery ? '2-3 Days' : '5-7 Days'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.buyNowButton}
              onPress={() => {
                handleAddToCart(selectedProduct);
                closeProductModal();
                router.push('/(tabs)/cart');
              }}
              disabled={!selectedProduct.in_stock}
            >
              <LinearGradient
                colors={['#FF5252', '#FF4081']}
                style={styles.buyNowGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Feather name="zap" size={18} color="#fff" />
                <Text style={styles.buyNowText}>BUY NOW</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.addToCartModalButton}
              onPress={() => handleAddToCart(selectedProduct)}
              disabled={!selectedProduct.in_stock}
            >
              {quantityInCart > 0 ? (
                <LinearGradient
                  colors={['#4CAF50', '#2E7D32']}
                  style={styles.addToCartGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <View style={styles.modalCartQuantity}>
                    <Feather name="shopping-cart" size={18} color="#fff" />
                    <Text style={styles.modalCartQuantityText}>{quantityInCart} in Cart</Text>
                  </View>
                </LinearGradient>
              ) : (
                <LinearGradient
                  colors={['#FF9800', '#FF5722']}
                  style={styles.addToCartGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Feather name="shopping-cart" size={18} color="#fff" />
                  <Text style={styles.addToCartModalText}>ADD TO CART</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {/* Main Header - Compact Design */}
        <View style={styles.mainHeader}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <View style={styles.fireIconContainer}>
                  <Ionicons name="flame" size={20} color="#FF6B6B" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Flash Sale</Text>
                  <Text style={styles.headerSubtitle}>Exclusive Deals</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.searchButton}
                onPress={() => setShowSearch(!showSearch)}
              >
                <Ionicons name="search" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cartIconButton}
                onPress={() => router.push('/(tabs)/cart')}
              >
                <Ionicons name="cart" size={20} color="#fff" />
                {cart.length > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cart.reduce((sum, item) => sum + (item.quantity || 1), 0)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          {showSearch && (
            <Animated.View style={[styles.searchContainer, { opacity: fadeAnim }]}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search deals..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#fff" />
                </TouchableOpacity>
              ) : (
                <Ionicons name="search" size={20} color="#fff" />
              )}
            </Animated.View>
          )}

          {/* Timer */}
          <View style={styles.timerContainer}>
            <View style={styles.timerContent}>
              <Ionicons name="time" size={14} color="#FF6B6B" />
              <Text style={styles.timerText}>Ends: 23:59:59</Text>
            </View>
          </View>
        </View>

        {/* Filter Bar - Compact */}
        <View style={styles.filterBar}>
          <TouchableOpacity 
            style={styles.filterBarButton}
            onPress={() => setShowSortModal(true)}
          >
            <Ionicons name="filter" size={16} color="#FF6B6B" />
            <Text style={styles.filterBarButtonText}>Sort</Text>
            {sortBy !== 'discount_high' && (
              <View style={styles.activeDot} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.filterBarButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="options" size={16} color="#FF6B6B" />
            <Text style={styles.filterBarButtonText}>Filter</Text>
            {(minPrice || maxPrice) && (
              <View style={styles.activeDot} />
            )}
          </TouchableOpacity>
          
          {(minPrice || maxPrice || sortBy !== 'discount_high' || searchQuery) && (
            <TouchableOpacity 
              style={styles.clearFilterButton}
              onPress={handleClearFilters}
            >
              <Ionicons name="close-circle" size={16} color="#666" />
              <Text style={styles.clearFilterText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Filters - Compact */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFiltersContainer}>
          <View style={styles.quickFilters}>
            {QUICK_FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={styles.quickFilterButton}
                onPress={() => applyQuickFilter(filter)}
              >
                <Text style={styles.quickFilterText}>{filter.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Active Filters */}
        {(minPrice || maxPrice || searchQuery) && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersContainer}>
            <View style={styles.activeFilters}>
              {searchQuery && (
                <View style={styles.activeFilterTag}>
                  <Ionicons name="search" size={12} color="#2196F3" />
                  <Text style={styles.activeFilterText}>"{searchQuery}"</Text>
                </View>
              )}
              {minPrice && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterText}>Min: ₹{minPrice}</Text>
                </View>
              )}
              {maxPrice && (
                <View style={styles.activeFilterTag}>
                  <Text style={styles.activeFilterText}>Max: ₹{maxPrice}</Text>
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* Products Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#FF6B6B" />
            <Text style={styles.loadingText}>Loading deals...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.productsGrid}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#FF6B6B']}
                tintColor="#FF6B6B"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="flash-outline" size={60} color="#e0e0e0" />
                <Text style={styles.emptyTitle}>No Deals Found</Text>
                <Text style={styles.emptyText}>
                  Try adjusting your filters
                </Text>
                <TouchableOpacity 
                  style={styles.shopButton}
                  onPress={() => router.push('/(tabs)/products')}
                >
                  <Text style={styles.shopButtonText}>Browse Products</Text>
                </TouchableOpacity>
              </View>
            }
            ListHeaderComponent={
              filteredProducts.length > 0 && (
                <View style={styles.resultsHeader}>
                  <Text style={styles.resultsText}>
                    {filteredProducts.length} deals found
                  </Text>
                </View>
              )
            }
          />
        )}

        {/* Product Detail Modal */}
        {renderProductModal()}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  // Main Header - Compact
  mainHeader: {
    backgroundColor: '#000',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fireIconContainer: {
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 6,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 2,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    marginRight: 15,
  },
  cartIconButton: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF6B6B',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 5,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  timerContainer: {
    marginTop: 8,
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  timerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 5,
  },
  // Filter Bar - Compact
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    marginTop: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 10,
    position: 'relative',
  },
  filterBarButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  activeDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B6B',
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
  },
  clearFilterText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  // Quick Filters
  quickFiltersContainer: {
    paddingHorizontal: 15,
    marginTop: 5,
  },
  quickFilters: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  quickFilterButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickFilterText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  // Active Filters
  activeFiltersContainer: {
    paddingHorizontal: 15,
    marginTop: 5,
  },
  activeFilters: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
  },
  activeFilterText: {
    marginLeft: 4,
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '500',
  },
  // Products Grid
  productsGrid: {
    padding: 8,
    paddingBottom: 20,
  },
  resultsHeader: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginBottom: 5,
  },
  resultsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  productCard: {
    flex: 1,
    margin: 6,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  productCardInner: {
    flex: 1,
  },
  productImageContainer: {
    height: 140,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    borderRadius: 4,
    overflow: 'hidden',
    elevation: 2,
  },
  discountBadgeGradient: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  wishlistButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistButtonActive: {
    backgroundColor: 'rgba(255, 64, 129, 0.8)',
  },
  productInfo: {
    padding: 10,
  },
  productCategory: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    height: 32,
    lineHeight: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingStars: {
    flexDirection: 'row',
    marginRight: 5,
  },
  ratingText: {
    fontSize: 11,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginRight: 6,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  saveText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
    marginBottom: 6,
  },
  outOfStockContainer: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  outOfStockText: {
    fontSize: 10,
    color: '#C62828',
    fontWeight: '500',
  },
  deliveryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  deliveryText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 6,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  cartButton: {
    width: 36,
    backgroundColor: '#FF6B6B',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartButtonActive: {
    backgroundColor: '#FF5252',
  },
  cartQuantityContainer: {
    alignItems: 'center',
  },
  cartQuantityText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  shopButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Product Detail Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalScrollView: {
    flex: 1,
  },
  modalImageSection: {
    height: 300,
    position: 'relative',
  },
  modalImageGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '70%',
    height: '70%',
    borderRadius: 15,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    left: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalWishlistButton: {
    position: 'absolute',
    top: 40,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalDiscountContainer: {
    position: 'absolute',
    bottom: 15,
    left: 15,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 4,
  },
  modalDiscountGradient: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  modalDiscountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalDetailsSection: {
    padding: 20,
    paddingBottom: 100,
  },
  brandCategoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  categoryTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  categoryTagText: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '500',
  },
  modalProductName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    lineHeight: 28,
  },
  modalRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalRatingStars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  modalRatingText: {
    fontSize: 14,
    color: '#666',
  },
  modalPriceSection: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalCurrentPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginRight: 10,
  },
  modalOriginalPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingsText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 6,
  },
  descriptionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  specsSection: {
    marginBottom: 20,
  },
  specsGrid: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  specLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  specValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 15,
  },
  modalActions: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 15,
    paddingBottom: 25,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    elevation: 8,
  },
  buyNowButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 4,
  },
  buyNowGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  buyNowText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  addToCartModalButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 4,
  },
  addToCartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  modalCartQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCartQuantityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  addToCartModalText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});