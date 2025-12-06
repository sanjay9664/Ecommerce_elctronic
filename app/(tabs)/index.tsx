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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Fixed imports - use relative paths
import { productAPI, categoryAPI } from '../../services/api';
import { SafeImage } from '../../components/common/SafeImage';

const { width } = Dimensions.get('window');

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

  // Header Menu Options
  const menuOptions = [
    { id: '1', name: 'My Profile', icon: 'person', route: '/(tabs)/profile' },
    { id: '2', name: 'My Orders', icon: 'receipt', route: '/orders' },
    { id: '3', name: 'Wishlist', icon: 'heart', route: null },
    { id: '4', name: 'Settings', icon: 'settings', route: null },
    { id: '5', name: 'Customer Support', icon: 'headset', route: null },
  ];

  // Fetch data on mount
  useEffect(() => {
    console.log('🚀 HomeScreen mounted - fetching real data from API...');
    fetchDataFromAPI();
  }, []);

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
        
        if (categoriesResponse.status === true && categoriesResponse.data) {
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
                // Build full image URL
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
                  id: product.id.toString(),
                  name: product.name || 'Product',
                  title: product.name || 'Product',
                  price: parseFloat(product.price || 0),
                  offer_price: parseFloat(product.offer_price || product.price || 0),
                  image: mainImage,
                  images: galleryImages.length > 0 ? galleryImages : (mainImage ? [mainImage] : []),
                  category: category.name,
                  category_id: category.id,
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
          // Build full image URL for category
          const categoryImage = category.image 
            ? `https://smartg5.com/${category.image}`
            : null;
          
          return {
            id: category.id.toString(),
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
          
          if (productsResponse.status === true && productsResponse.data) {
            productsArray = productsResponse.data;
          } else if (Array.isArray(productsResponse)) {
            productsArray = productsResponse;
          }
          
          // Process products if found
          if (productsArray.length > 0) {
            const processedProducts = productsArray.map((product: any) => {
              // Build full image URL
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
    if (product.offer_price && product.offer_price > 0) {
      return product.offer_price;
    }
    return product.price || 0;
  };

  // Search Functionality
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.length > 0) {
      setIsSearching(true);
      const results = products.filter(product => {
        const name = product.name || product.title || '';
        return name.toLowerCase().includes(text.toLowerCase());
      });
      setSearchResults(results);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  // Add to Cart with Alert
  const handleAddToCart = async (product: any) => {
    try {
      const productName = product.name || product.title || 'Product';
      Alert.alert('Success', `${productName} added to cart!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add product to cart');
    }
  };

  // Toggle Wishlist
  const toggleWishlist = (product: any) => {
    const productName = product.name || product.title || 'Product';
    if (wishlist.find(item => item.id === product.id)) {
      setWishlist(prev => prev.filter(item => item.id !== product.id));
      Alert.alert('Removed', `${productName} removed from wishlist`);
    } else {
      setWishlist(prev => [...prev, product]);
      Alert.alert('Added', `${productName} added to wishlist`);
    }
  };

  // Render Category
  const renderCategory = ({ item }: any) => {
    // Map category names to icons
    const getCategoryIcon = (categoryName: string) => {
      const name = categoryName.toLowerCase();
      if (name.includes('medical') || name.includes('equipment')) return 'medical-services';
      if (name.includes('hotel') || name.includes('smart')) return 'hotel';
      if (name.includes('supply') || name.includes('tool')) return 'build';
      if (name.includes('pharmacy') || name.includes('drug')) return 'local-pharmacy';
      if (name.includes('lab') || name.includes('test')) return 'science';
      if (name.includes('surgical') || name.includes('surgery')) return 'healing';
      if (name.includes('diagnostic')) return 'biotech';
      return 'folder';
    };
    
    const categoryIcon = getCategoryIcon(item.name);
    const productCount = item.product_count || 0;
    
    return (
      <TouchableOpacity 
        style={styles.categoryItem}
        onPress={() => router.push({
  pathname: '/(tabs)/category/[id]',
  params: { 
    id: item.id,
    categoryName: item.name 
  }
})}
      >
        {item.image ? (
          <SafeImage 
            source={{ uri: item.image }}
            style={styles.categoryIconImage}
            showPlaceholder={true}
            placeholder={item.name}
          />
        ) : (
          <MaterialIcons name={categoryIcon as any} size={32} color="#FF9900" />
        )}
        <Text style={styles.categoryText} numberOfLines={2}>{item.name}</Text>
        {productCount > 0 && (
          <Text style={styles.categoryCount}>{productCount} items</Text>
        )}
      </TouchableOpacity>
    );
  };

  // Render Product Card
  const renderProduct = ({ item }: any) => {
    const productName = item.name || item.title || 'Product';
    const productImage = item.image || item.images?.[0] || null;
    const productRating = item.rating || 0;
    const displayPrice = getDisplayPrice(item);
    const regularPrice = item.price || 0;
    const discount = item.discount_percentage || item.discount || 0;
    const hasDiscount = discount > 0 && displayPrice < regularPrice;
    
    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <SafeImage 
          source={{ uri: productImage }} 
          style={styles.productImage}
          showPlaceholder={true}
          placeholder="Product Image"
        />
        
        {/* Wishlist Button */}
        <TouchableOpacity 
          style={styles.wishlistButton}
          onPress={() => toggleWishlist(item)}
        >
          <Ionicons 
            name={wishlist.find(p => p.id === item.id) ? "heart" : "heart-outline"} 
            size={20} 
            color={wishlist.find(p => p.id === item.id) ? "red" : "#666"} 
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
        {item.fastDelivery && (
          <View style={styles.fastDeliveryBadge}>
            <Text style={styles.fastDeliveryText}>🚚 Fast Delivery</Text>
          </View>
        )}
        
        {/* Category Badge */}
        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.addToCartBtn}
          onPress={() => handleAddToCart(item)}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Menu Button */}
        <TouchableOpacity onPress={() => setIsMenuVisible(true)}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        
        {/* Logo */}
        <Text style={styles.logo}>🏠 SmartG5 Store</Text>
        
        {/* Header Icons */}
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => Alert.alert('Wishlist', 'Wishlist feature coming soon!')}
          >
            <Ionicons name="heart-outline" size={24} color="#fff" />
            {wishlist.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{wishlist.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/(tabs)/cart')}
          >
            <Ionicons name="cart-outline" size={24} color="#fff" />
            {cart.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {cart.reduce((total, item) => total + (item.quantity || 0), 0)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Refresh Button */}
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={fetchDataFromAPI}
      >
        <Ionicons name="refresh" size={20} color="#fff" />
        <Text style={styles.refreshButtonText}>Refresh Data</Text>
      </TouchableOpacity>

      {/* Search Results */}
      {isSearching && searchResults.length > 0 && (
        <View style={styles.searchResultsContainer}>
          <Text style={styles.searchResultsTitle}>Search Results ({searchResults.length})</Text>
          {searchResults.map(product => {
            const productName = product.name || product.title || 'Product';
            const productImage = product.image || product.images?.[0] || null;
            const displayPrice = getDisplayPrice(product);
            return (
              <TouchableOpacity 
                key={product.id} 
                style={styles.searchResultItem}
                onPress={() => {
                  router.push(`/product/${product.id}`);
                  setIsSearching(false);
                  setSearchQuery('');
                }}
              >
                <SafeImage 
                  source={{ uri: productImage }} 
                  style={styles.searchResultImage}
                  showPlaceholder={true}
                />
                <View style={styles.searchResultInfo}>
                  <Text style={styles.searchResultName}>{productName}</Text>
                  <Text style={styles.searchResultPrice}>${formatPrice(displayPrice)}</Text>
                  {product.category && (
                    <Text style={styles.searchResultCategory}>{product.category}</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {!isSearching && (
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

          {/* Data Status */}
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              📱 {products.length} products in {categories.length} categories
            </Text>
            {(loading.products || loading.categories) && (
              <ActivityIndicator size="small" color="#FF9900" style={{ marginLeft: 10 }} />
            )}
          </View>

          {/* Banner */}
          <View style={styles.banner}>
            <SafeImage
              source={{ uri: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=400' }}
              style={styles.bannerImage}
              showPlaceholder={false}
            />
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerTitle}>SmartG5 Products</Text>
              <Text style={styles.bannerSubtitle}>Smart Hotel & GRMS Solutions</Text>
            </View>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            {loading.categories ? (
              <ActivityIndicator size="large" color="#FF9900" style={styles.loader} />
            ) : (
              <FlatList
                data={categories}
                renderItem={renderCategory}
                keyExtractor={item => item.id}
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
              <Text style={styles.sectionTitle}>Featured Products</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/all-products')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {loading.products ? (
              <ActivityIndicator size="large" color="#FF9900" style={styles.loader} />
            ) : (
              <FlatList
                data={products.slice(0, 4)}
                renderItem={renderProduct}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.productsList}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="cube-outline" size={40} color="#ccc" />
                    <Text style={styles.emptyText}>No products available</Text>
                    <Text style={styles.emptySubtext}>Pull down to refresh</Text>
                  </View>
                }
              />
            )}
          </View>

          {/* Today's Deals */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Deals</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/sale')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {loading.products ? (
              <ActivityIndicator size="large" color="#FF9900" style={styles.loader} />
            ) : (
              <View style={styles.dealsGrid}>
                {products
                  .filter(p => p.discount_percentage > 0 || p.discount > 0)
                  .slice(0, 4)
                  .map(product => {
                    const productImage = product.image || product.images?.[0] || null;
                    const displayPrice = getDisplayPrice(product);
                    const discount = product.discount_percentage || product.discount || 0;
                    return (
                      <TouchableOpacity 
                        key={product.id} 
                        style={styles.dealCard}
                        onPress={() => router.push(`/product/${product.id}`)}
                      >
                        <SafeImage 
                          source={{ uri: productImage }} 
                          style={styles.dealImage}
                          showPlaceholder={true}
                        />
                        {discount > 0 && (
                          <View style={styles.dealBadge}>
                            <Text style={styles.dealBadgeText}>{discount}% OFF</Text>
                          </View>
                        )}
                        <Text style={styles.dealName} numberOfLines={2}>
                          {product.name || product.title}
                        </Text>
                        <View style={styles.dealPriceContainer}>
                          <Text style={styles.dealPrice}>${formatPrice(displayPrice)}</Text>
                          {discount > 0 && product.price && (
                            <Text style={styles.dealOriginalPrice}>${formatPrice(product.price)}</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                {products.filter(p => p.discount_percentage > 0 || p.discount > 0).length === 0 && (
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
    backgroundColor: '#EAEDED',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#131921',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  logo: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 15,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF9900',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  searchButton: {
    padding: 5,
  },
  searchResultsContainer: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 8,
    padding: 10,
    maxHeight: 300,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchResultPrice: {
    fontSize: 14,
    color: '#B12704',
    fontWeight: 'bold',
  },
  searchResultCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  banner: {
    marginHorizontal: 15,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
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
    padding: 15,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    color: '#FF9900',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#131921',
    paddingHorizontal: 15,
  },
  seeAllText: {
    color: '#0066c0',
    fontWeight: '500',
  },
  categoriesList: {
    paddingHorizontal: 10,
  },
  categoryItem: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    minWidth: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIconImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 5,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: 80,
  },
  categoryCount: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  productsList: {
    paddingHorizontal: 10,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 5,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  wishlistButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    padding: 5,
  },
  discountBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#B12704',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    height: 36,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B12704',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  fastDeliveryBadge: {
    backgroundColor: '#FFD814',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  fastDeliveryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#131921',
  },
  categoryBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: '#666',
  },
  addToCartBtn: {
    backgroundColor: '#FFD814',
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: '600',
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
    borderRadius: 12,
    width: (width - 40) / 2,
    marginBottom: 10,
    padding: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dealImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  dealBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#B12704',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dealBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dealName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    height: 36,
  },
  dealPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dealPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B12704',
  },
  dealOriginalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 6,
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
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#131921',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#131921',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  retryText: {
    color: '#0066c0',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 10,
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
    marginTop: 10,
    fontSize: 16,
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#999',
    marginTop: 5,
    fontSize: 14,
  },
});