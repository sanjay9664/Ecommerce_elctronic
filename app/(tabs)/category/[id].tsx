import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
// import { productAPI, categoryAPI, processProductData, processCategoryData } from '../../services/api';
import { productAPI, categoryAPI, processProductData, processCategoryData } from '../../../services/api';
// import { SafeImage } from '../../components/common/SafeImage';
import { SafeImage } from '../../../components/common/SafeImage';

const { width } = Dimensions.get('window');

export default function CategoryDetailScreen() {
  const { id, categoryName } = useLocalSearchParams<{ id: string; categoryName: string }>();
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (id) {
      fetchCategoryData();
    }
  }, [id]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`📋 Fetching data for category ID: ${id}`);
      
      // Try to fetch category details first
      try {
        const categoryResponse = await categoryAPI.getAll();
        if (categoryResponse.status === true && categoryResponse.data) {
          const foundCategory = categoryResponse.data.find((cat: any) => 
            cat.id.toString() === id || cat._id?.toString() === id
          );
          
          if (foundCategory) {
            const processedCategory = processCategoryData(foundCategory);
            setCategory(processedCategory);
            
            // If category has products, use them
            if (processedCategory.products && processedCategory.products.length > 0) {
              setProducts(processedCategory.products);
              setLoading(false);
              return;
            }
          }
        }
      } catch (catError) {
        console.log('⚠️ Category details not found, fetching products by category instead');
      }
      
      // If no category products or category not found, fetch products by category
      const productsResponse = await productAPI.getByCategory(id);
      
      if (productsResponse.status === true && productsResponse.data) {
        const processedProducts = productsResponse.data.map(processProductData);
        setProducts(processedProducts);
        
        // Create a mock category if not found
        if (!category) {
          setCategory({
            id,
            name: categoryName || 'Category',
            product_count: processedProducts.length,
          });
        }
      } else {
        setProducts([]);
      }
      
    } catch (err: any) {
      console.error('❌ Error fetching category data:', err);
      setError(err.message || 'Failed to load category data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategoryData();
  };

  const handleAddToCart = (product: any) => {
    const productName = product.name || product.title || 'Product';
    Alert.alert('Added to Cart', `${productName} has been added to your cart`);
  };

  const handleViewProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const renderProductGrid = ({ item }: any) => {
    const displayPrice = item.offer_price > 0 ? item.offer_price : item.price;
    const hasDiscount = item.discount_percentage > 0;
    
    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => handleViewProduct(item.id)}
      >
        <SafeImage 
          source={{ uri: item.image }}
          style={styles.productImage}
          showPlaceholder={true}
          placeholder="Product"
        />
        
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{item.discount_percentage}% OFF</Text>
          </View>
        )}
        
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        
        {item.rating > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        )}
        
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>${displayPrice.toFixed(2)}</Text>
          {hasDiscount && (
            <Text style={styles.originalPrice}>${item.price.toFixed(2)}</Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={() => handleAddToCart(item)}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderProductList = ({ item }: any) => {
    const displayPrice = item.offer_price > 0 ? item.offer_price : item.price;
    const hasDiscount = item.discount_percentage > 0;
    
    return (
      <TouchableOpacity 
        style={styles.listItem}
        onPress={() => handleViewProduct(item.id)}
      >
        <SafeImage 
          source={{ uri: item.image }}
          style={styles.listImage}
          showPlaceholder={true}
          placeholder="Product"
        />
        
        <View style={styles.listInfo}>
          <Text style={styles.listName} numberOfLines={2}>
            {item.name}
          </Text>
          
          {item.rating > 0 && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            </View>
          )}
          
          <View style={styles.listPriceContainer}>
            <Text style={styles.listPrice}>${displayPrice.toFixed(2)}</Text>
            {hasDiscount && (
              <>
                <Text style={styles.listOriginalPrice}>${item.price.toFixed(2)}</Text>
                <View style={styles.listDiscountBadge}>
                  <Text style={styles.listDiscountText}>{item.discount_percentage}% OFF</Text>
                </View>
              </>
            )}
          </View>
          
          {item.description && (
            <Text style={styles.listDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.listAddButton}
          onPress={() => handleAddToCart(item)}
        >
          <Ionicons name="cart-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9900" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#ccc" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchCategoryData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {category?.name || categoryName || 'Category'}
          </Text>
          {products.length > 0 && (
            <Text style={styles.headerSubtitle}>
              {products.length} products
            </Text>
          )}
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.viewModeButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Ionicons 
              name={viewMode === 'grid' ? 'list' : 'grid'} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Banner */}
      {category?.image && (
        <View style={styles.categoryBanner}>
          <SafeImage 
            source={{ uri: category.image }}
            style={styles.categoryImage}
            showPlaceholder={true}
            placeholder={category.name}
          />
          <View style={styles.categoryOverlay}>
            <Text style={styles.categoryBannerName}>{category.name}</Text>
            {category.description && (
              <Text style={styles.categoryBannerDescription} numberOfLines={2}>
                {category.description}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Products */}
      <FlatList
        data={products}
        renderItem={viewMode === 'grid' ? renderProductGrid : renderProductList}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        contentContainerStyle={styles.productsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No products found in this category</Text>
            <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.shopButtonText}>Browse All Products</Text>
            </TouchableOpacity>
          </View>
        }
        ListHeaderComponent={
          products.length > 0 && (
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsText}>
                Showing {products.length} product{products.length !== 1 ? 's' : ''}
              </Text>
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => Alert.alert('Filter', 'Filter options coming soon!')}
              >
                <Ionicons name="filter" size={20} color="#666" />
                <Text style={styles.filterText}>Filter</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#131921',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewModeButton: {
    padding: 5,
  },
  categoryBanner: {
    position: 'relative',
    height: 150,
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
  },
  categoryBannerName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  categoryBannerDescription: {
    color: '#FF9900',
    fontSize: 14,
    marginTop: 5,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  productsList: {
    padding: 10,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    margin: 5,
    maxWidth: (width - 30) / 2,
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
  discountBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#B12704',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
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
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  addToCartButton: {
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
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  listPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  listPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B12704',
  },
  listOriginalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  listDiscountBadge: {
    backgroundColor: '#B12704',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  listDiscountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  listAddButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FF9900',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#FF9900',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  shopButton: {
    marginTop: 20,
    backgroundColor: '#FF9900',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});