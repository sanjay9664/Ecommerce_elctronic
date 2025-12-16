import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productAPI } from '../../services/api';
import { SafeImage } from '../../components/common/SafeImage';

const { width } = Dimensions.get('window');

const SORT_OPTIONS = [
  { id: 'discount_high', label: 'Highest Discount', icon: 'trending-down' },
  { id: 'price_low', label: 'Price: Low to High', icon: 'arrow-up' },
  { id: 'price_high', label: 'Price: High to Low', icon: 'arrow-down' },
  { id: 'newest', label: 'Newest First', icon: 'new-releases' },
  { id: 'popular', label: 'Most Popular', icon: 'trending-up' },
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

  useEffect(() => {
    fetchSaleProducts();
    loadCartAndWishlist();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [products, sortBy, minPrice, maxPrice]);

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
        // Process sale products
        const processedProducts = response.data
          .filter((product: any) => product)
          .map((product: any) => ({
            id: product.id?.toString() || Math.random().toString(),
            name: product.name || product.title || 'Sale Product',
            description: product.description || product.desc || 'Premium quality product at discounted price',
            price: parseFloat(product.price || 0),
            offer_price: parseFloat(product.offer_price || product.price || 0),
            image: product.main_image ? `https://smartg5.com/${product.main_image}` : 
                   product.image ? `https://smartg5.com/${product.image}` : null,
            category: product.category || product.category_name || 'Sale',
            discount_percentage: product.offer_price && product.price 
              ? Math.round((1 - parseFloat(product.offer_price) / parseFloat(product.price)) * 100)
              : Math.floor(Math.random() * 50) + 10, // Fallback 10-60% discount
            rating: parseFloat(product.rating || product.review_rating || (Math.random() * 4 + 1).toFixed(1)),
            review_count: product.review_count || Math.floor(Math.random() * 100),
            in_stock: product.in_stock !== undefined ? product.in_stock : true,
            fast_delivery: product.fast_delivery || Math.random() > 0.3,
            specifications: product.specifications || product.features || 'Premium quality',
            brand: product.brand || 'SmartG5',
            sku: product.sku || `SG5-${Math.floor(Math.random() * 10000)}`,
            warranty: product.warranty || '1 Year',
            return_policy: product.return_policy || '30 Days Return',
            quantity_in_cart: 0,
            is_in_wishlist: false,
          }));
        
        setProducts(processedProducts);
        setFilteredProducts(processedProducts);
      } else {
        // Fallback mock data
        const mockProducts = Array.from({ length: 20 }).map((_, index) => ({
          id: `sale-${index}`,
          name: `Super Sale Product ${index + 1}`,
          description: 'Premium quality product with amazing discount. Limited time offer!',
          price: 1000 + Math.random() * 4000,
          offer_price: 500 + Math.random() * 2000,
          image: `https://picsum.photos/seed/sale${index}/400/300`,
          category: ['Electronics', 'Home', 'Fashion', 'Health'][index % 4],
          discount_percentage: 30 + Math.floor(Math.random() * 40),
          rating: (Math.random() * 4 + 1).toFixed(1),
          review_count: Math.floor(Math.random() * 500),
          in_stock: Math.random() > 0.1,
          fast_delivery: Math.random() > 0.3,
          specifications: 'High quality materials | Durable | Energy efficient',
          brand: ['SmartG5', 'Premium', 'Elite', 'Pro'][index % 4],
          sku: `SG5-SALE-${1000 + index}`,
          warranty: '1 Year',
          return_policy: '30 Days Return',
          quantity_in_cart: 0,
          is_in_wishlist: false,
        }));
        
        setProducts(mockProducts);
        setFilteredProducts(mockProducts);
      }
    } catch (error) {
      console.error('Error fetching sale products:', error);
      Alert.alert('Error', 'Failed to load sale products. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...products];

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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSaleProducts();
  };

  const handleAddToCart = async (product: any) => {
    try {
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
        '🎉 Added to Cart',
        `${product.name} has been added to your cart`,
        [{ text: 'OK', onPress: () => {} }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add product to cart');
    }
  };

  const handleToggleWishlist = async (product: any) => {
    try {
      const isInWishlist = wishlist.some(item => item.id === product.id);
      let newWishlist;
      
      if (isInWishlist) {
        newWishlist = wishlist.filter(item => item.id !== product.id);
        Alert.alert('Removed', `${product.name} removed from wishlist`);
      } else {
        newWishlist = [...wishlist, product];
        Alert.alert('❤️ Added to Wishlist', `${product.name} added to your wishlist`);
      }
      
      setWishlist(newWishlist);
      await AsyncStorage.setItem('@wishlist', JSON.stringify(newWishlist));
      
      // Update product in list
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, is_in_wishlist: !isInWishlist } : p
      ));
    } catch (error) {
      Alert.alert('Error', 'Failed to update wishlist');
    }
  };

  const handleViewProduct = (product: any) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleClearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSortBy('discount_high');
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
          style={styles.productImageContainer}
        >
          <SafeImage 
            source={{ uri: item.image }} 
            style={styles.productImage}
            showPlaceholder={true}
          />
          
          {/* Discount Badge */}
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{discount}% OFF</Text>
          </View>
          
          {/* Hot Sale Badge */}
          <View style={styles.hotBadge}>
            <Ionicons name="flame" size={14} color="#fff" />
            <Text style={styles.hotBadgeText}>HOT</Text>
          </View>
          
          {/* Wishlist Button */}
          <TouchableOpacity 
            style={styles.wishlistButton}
            onPress={() => handleToggleWishlist(item)}
          >
            <Ionicons 
              name={isInWishlist ? "heart" : "heart-outline"} 
              size={22} 
              color={isInWishlist ? "#FF6B6B" : "#fff"} 
            />
          </TouchableOpacity>
        </TouchableOpacity>
        
        <View style={styles.productInfo}>
          <Text style={styles.productCategory}>{item.category}</Text>
          
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating}</Text>
            <Text style={styles.reviewCount}>({item.review_count})</Text>
          </View>
          
          {/* Price */}
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>₹{displayPrice.toFixed(2)}</Text>
            <Text style={styles.originalPrice}>₹{originalPrice.toFixed(2)}</Text>
            <Text style={styles.saveText}>
              Save ₹{(originalPrice - displayPrice).toFixed(2)}
            </Text>
          </View>
          
          {/* Stock Status */}
          {!item.in_stock && (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            </View>
          )}
          
          {/* Fast Delivery */}
          {item.fast_delivery && (
            <View style={styles.deliveryBadge}>
              <Ionicons name="rocket" size={12} color="#4CAF50" />
              <Text style={styles.deliveryText}>Fast Delivery</Text>
            </View>
          )}
          
          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.viewButton}
              onPress={() => handleViewProduct(item)}
            >
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.cartButton,
                quantityInCart > 0 && styles.cartButtonActive
              ]}
              onPress={() => handleAddToCart(item)}
              disabled={!item.in_stock}
            >
              {quantityInCart > 0 ? (
                <View style={styles.cartQuantityContainer}>
                  <Text style={styles.cartQuantityText}>{quantityInCart}</Text>
                  <Ionicons name="cart" size={16} color="#fff" />
                </View>
              ) : (
                <Ionicons name="cart-outline" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderSortOption = ({ item }: any) => (
    <TouchableOpacity
      style={[
        styles.sortOption,
        sortBy === item.id && styles.sortOptionActive
      ]}
      onPress={() => {
        setSortBy(item.id);
        setShowSortModal(false);
      }}
    >
      <Ionicons 
        name={item.icon as any} 
        size={20} 
        color={sortBy === item.id ? '#FF9900' : '#666'} 
      />
      <Text style={[
        styles.sortOptionText,
        sortBy === item.id && styles.sortOptionTextActive
      ]}>
        {item.label}
      </Text>
      {sortBy === item.id && (
        <Ionicons name="checkmark" size={20} color="#FF9900" />
      )}
    </TouchableOpacity>
  );

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
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProductModal(false)}
      >
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowProductModal(false)}
              >
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalWishlistButton}
                onPress={() => handleToggleWishlist(selectedProduct)}
              >
                <Ionicons 
                  name={isInWishlist ? "heart" : "heart-outline"} 
                  size={26} 
                  color={isInWishlist ? "#FF6B6B" : "#fff"} 
                />
              </TouchableOpacity>
            </View>

            {/* Product Image */}
            <View style={styles.modalImageContainer}>
              <SafeImage 
                source={{ uri: selectedProduct.image }} 
                style={styles.modalImage}
                showPlaceholder={true}
              />
              <View style={styles.modalDiscountBadge}>
                <Text style={styles.modalDiscountText}>{discount}% OFF</Text>
              </View>
            </View>

            {/* Product Info */}
            <View style={styles.modalInfoContainer}>
              <Text style={styles.modalCategory}>{selectedProduct.category}</Text>
              
              <Text style={styles.modalName}>{selectedProduct.name}</Text>
              
              {/* Rating */}
              <View style={styles.modalRatingContainer}>
                <View style={styles.ratingStars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons 
                      key={star}
                      name="star" 
                      size={18} 
                      color={star <= Math.floor(selectedProduct.rating) ? "#FFD700" : "#ddd"} 
                    />
                  ))}
                </View>
                <Text style={styles.modalRatingText}>{selectedProduct.rating} • {selectedProduct.review_count} reviews</Text>
              </View>

              {/* Price */}
              <View style={styles.modalPriceContainer}>
                <Text style={styles.modalCurrentPrice}>₹{displayPrice.toFixed(2)}</Text>
                <Text style={styles.modalOriginalPrice}>₹{originalPrice.toFixed(2)}</Text>
                <View style={styles.saveBadge}>
                  <Text style={styles.saveBadgeText}>
                    Save ₹{(originalPrice - displayPrice).toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Highlights */}
              <View style={styles.highlightsContainer}>
                <Text style={styles.highlightsTitle}>Highlights</Text>
                <View style={styles.highlightItems}>
                  <View style={styles.highlightItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                    <Text style={styles.highlightText}>Authentic Product</Text>
                  </View>
                  <View style={styles.highlightItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                    <Text style={styles.highlightText}>30 Days Return</Text>
                  </View>
                  <View style={styles.highlightItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                    <Text style={styles.highlightText}>Free Shipping</Text>
                  </View>
                  <View style={styles.highlightItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
                    <Text style={styles.highlightText}>Warranty: {selectedProduct.warranty}</Text>
                  </View>
                </View>
              </View>

              {/* Description */}
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionTitle}>Description</Text>
                <Text style={styles.descriptionText}>
                  {selectedProduct.description}
                </Text>
              </View>

              {/* Specifications */}
              <View style={styles.specsContainer}>
                <Text style={styles.specsTitle}>Specifications</Text>
                <View style={styles.specsList}>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Brand</Text>
                    <Text style={styles.specValue}>{selectedProduct.brand}</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>SKU</Text>
                    <Text style={styles.specValue}>{selectedProduct.sku}</Text>
                  </View>
                  <View style={styles.specRow}>
                    <Text style={styles.specLabel}>Features</Text>
                    <Text style={styles.specValue}>{selectedProduct.specifications}</Text>
                  </View>
                  <View style={styles.specRow}>
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
                setShowProductModal(false);
                router.push('/(tabs)/cart');
              }}
              disabled={!selectedProduct.in_stock}
            >
              <Text style={styles.buyNowText}>BUY NOW</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.addToCartModalButton,
                quantityInCart > 0 && styles.addToCartModalButtonActive
              ]}
              onPress={() => handleAddToCart(selectedProduct)}
              disabled={!selectedProduct.in_stock}
            >
              {quantityInCart > 0 ? (
                <View style={styles.modalCartQuantity}>
                  <Ionicons name="cart" size={20} color="#fff" />
                  <Text style={styles.modalCartQuantityText}>{quantityInCart} in Cart</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="cart-outline" size={20} color="#fff" />
                  <Text style={styles.addToCartModalText}>ADD TO CART</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Ionicons name="flash" size={32} color="#FFD700" />
            <View style={styles.titleTextContainer}>
              <Text style={styles.headerTitle}>FLASH SALE</Text>
              <Text style={styles.headerSubtitle}>Limited Time Offers</Text>
            </View>
          </View>
          <Text style={styles.headerTimer}>⏰ Ends in 23:59:59</Text>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredProducts.length}</Text>
          <Text style={styles.statLabel}>Deals</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {Math.max(...filteredProducts.map(p => p.discount_percentage || 0))}%
          </Text>
          <Text style={styles.statLabel}>Max Discount</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            ₹{Math.min(...filteredProducts.map(p => p.offer_price || p.price || 0)).toFixed(0)}
          </Text>
          <Text style={styles.statLabel}>Lowest Price</Text>
        </View>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="filter" size={20} color="#FF9900" />
          <Text style={styles.filterButtonText}>Sort</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options" size={20} color="#FF9900" />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
        
        {(minPrice || maxPrice || sortBy !== 'discount_high') && (
          <TouchableOpacity 
            style={styles.clearFilterButton}
            onPress={handleClearFilters}
          >
            <Ionicons name="close-circle" size={18} color="#666" />
            <Text style={styles.clearFilterText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Active Filters */}
      {(minPrice || maxPrice) && (
        <View style={styles.activeFilters}>
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
      )}

      {/* Products Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading Hot Deals...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsGrid}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="flash-outline" size={80} color="#e0e0e0" />
              <Text style={styles.emptyTitle}>No Sale Products Found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your filters or check back later
              </Text>
              <TouchableOpacity 
                style={styles.shopButton}
                onPress={() => router.push('/(tabs)/products')}
              >
                <Text style={styles.shopButtonText}>Browse All Products</Text>
              </TouchableOpacity>
            </View>
          }
          ListHeaderComponent={
            filteredProducts.length > 0 && (
              <Text style={styles.resultsCount}>
                {filteredProducts.length} deals found
              </Text>
            )
          }
        />
      )}

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity 
          style={styles.sortModalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <View style={styles.sortModalContent}>
            <Text style={styles.sortModalTitle}>Sort By</Text>
            <FlatList
              data={SORT_OPTIONS}
              renderItem={renderSortOption}
              keyExtractor={(item) => item.id}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalContainer}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filter Products</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.filterModalBody}>
              {/* Price Range */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Price Range</Text>
                <View style={styles.priceInputContainer}>
                  <View style={styles.priceInput}>
                    <Text style={styles.priceLabel}>Min Price (₹)</Text>
                    <TextInput
                      style={styles.priceInputField}
                      value={minPrice}
                      onChangeText={setMinPrice}
                      keyboardType="numeric"
                      placeholder="0"
                    />
                  </View>
                  <Text style={styles.priceSeparator}>to</Text>
                  <View style={styles.priceInput}>
                    <Text style={styles.priceLabel}>Max Price (₹)</Text>
                    <TextInput
                      style={styles.priceInputField}
                      value={maxPrice}
                      onChangeText={setMaxPrice}
                      keyboardType="numeric"
                      placeholder="10000"
                    />
                  </View>
                </View>
              </View>

              {/* Quick Price Filters */}
              <View style={styles.quickFilters}>
                <TouchableOpacity 
                  style={styles.quickFilterButton}
                  onPress={() => setMinPrice('0')}
                >
                  <Text style={styles.quickFilterText}>Under ₹500</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickFilterButton}
                  onPress={() => {
                    setMinPrice('500');
                    setMaxPrice('2000');
                  }}
                >
                  <Text style={styles.quickFilterText}>₹500 - ₹2000</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickFilterButton}
                  onPress={() => setMinPrice('2000')}
                >
                  <Text style={styles.quickFilterText}>Above ₹2000</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Filter Actions */}
            <View style={styles.filterModalActions}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={handleClearFilters}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => {
                  applyFiltersAndSort();
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Product Detail Modal */}
      {renderProductModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Header Styles
  header: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleTextContainer: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 2,
    fontWeight: '600',
  },
  headerTimer: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#FFD7B5',
    marginHorizontal: 10,
  },
  // Filter Bar
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#FFE5B4',
  },
  filterButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9900',
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  clearFilterText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  // Active Filters
  activeFilters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
  },
  activeFilterTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeFilterText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  // Products Grid
  productsGrid: {
    padding: 10,
    paddingBottom: 20,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    marginBottom: 10,
    fontWeight: '500',
  },
  // Product Card
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFE5E5',
    elevation: 4,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  productImageContainer: {
    position: 'relative',
    height: 160,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    elevation: 2,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  hotBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    elevation: 2,
  },
  hotBadgeText: {
    color: '#131921',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 3,
  },
  wishlistButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 14,
  },
  productCategory: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#131921',
    marginBottom: 8,
    lineHeight: 20,
    height: 40,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
  priceContainer: {
    marginBottom: 10,
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  saveText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
    marginTop: 2,
  },
  outOfStockBadge: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  outOfStockText: {
    fontSize: 10,
    color: '#c62828',
    fontWeight: '600',
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  deliveryText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#FFE5E5',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  viewButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  cartButton: {
    width: 44,
    backgroundColor: '#FF9900',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  cartQuantityContainer: {
    alignItems: 'center',
  },
  cartQuantityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 25,
    lineHeight: 22,
  },
  shopButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 10,
    elevation: 3,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Sort Modal
  sortModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sortModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  sortModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#131921',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sortOptionActive: {
    backgroundColor: '#FFF8E1',
  },
  sortOptionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  sortOptionTextActive: {
    color: '#FF9900',
    fontWeight: '600',
  },
  // Filter Modal
  filterModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '85%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#131921',
  },
  filterModalBody: {
    padding: 25,
  },
  filterSection: {
    marginBottom: 25,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInput: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceInputField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  priceSeparator: {
    marginHorizontal: 15,
    fontSize: 16,
    color: '#666',
    marginTop: 25,
  },
  quickFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  quickFilterButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  quickFilterText: {
    fontSize: 14,
    color: '#666',
  },
  filterModalActions: {
    flexDirection: 'row',
    padding: 25,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 10,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Product Detail Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalWishlistButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImageContainer: {
    height: 350,
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalDiscountBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 4,
  },
  modalDiscountText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalInfoContainer: {
    padding: 25,
  },
  modalCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  modalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#131921',
    marginBottom: 15,
    lineHeight: 30,
  },
  modalRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingStars: {
    flexDirection: 'row',
    marginRight: 10,
  },
  modalRatingText: {
    fontSize: 14,
    color: '#666',
  },
  modalPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  modalCurrentPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginRight: 15,
  },
  modalOriginalPrice: {
    fontSize: 20,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 15,
  },
  saveBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveBadgeText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  highlightsContainer: {
    marginBottom: 25,
  },
  highlightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  highlightItems: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  highlightText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
  },
  descriptionContainer: {
    marginBottom: 25,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  specsContainer: {
    marginBottom: 100,
  },
  specsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  specsList: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  specLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  specValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    marginLeft: 20,
  },
  modalActions: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    elevation: 8,
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 10,
    elevation: 4,
  },
  buyNowText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  addToCartModalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9900',
    paddingVertical: 18,
    borderRadius: 12,
    elevation: 4,
  },
  addToCartModalButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  modalCartQuantity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalCartQuantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  addToCartModalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
});