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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { productAPI, categoryAPI, processProductData, processCategoryData } from '../../../services/api';
import { SafeImage } from '../../../components/common/SafeImage';

const { width } = Dimensions.get('window');

export default function CategoryDetailScreen() {
  const { id, categoryName } = useLocalSearchParams<{ id: string; categoryName: string }>();
  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high' | 'rating'>('name');
  const [filterRating, setFilterRating] = useState(0);
  const [showOnlyDiscounted, setShowOnlyDiscounted] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCategoryData();
    }
  }, [id]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [products, sortBy, filterRating, showOnlyDiscounted]);

  const fetchCategoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
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

  const applyFiltersAndSort = () => {
    let filtered = [...products];

    // Apply rating filter
    if (filterRating > 0) {
      filtered = filtered.filter(product => (product.rating || 0) >= filterRating);
    }

    // Apply discount filter
    if (showOnlyDiscounted) {
      filtered = filtered.filter(product => (product.discount_percentage || 0) > 0);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => {
          const priceA = a.offer_price > 0 ? a.offer_price : a.price;
          const priceB = b.offer_price > 0 ? b.offer_price : b.price;
          return priceA - priceB;
        });
        break;
      case 'price-high':
        filtered.sort((a, b) => {
          const priceA = a.offer_price > 0 ? a.offer_price : a.price;
          const priceB = b.offer_price > 0 ? b.offer_price : b.price;
          return priceB - priceA;
        });
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'name':
      default:
        filtered.sort((a, b) => 
          (a.name || a.title || '').localeCompare(b.name || b.title || '')
        );
        break;
    }

    setFilteredProducts(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategoryData();
  };

  const handleAddToCart = (product: any) => {
    const productName = product.name || product.title || 'Product';
    Alert.alert('Added to Cart', `${productName} added to your cart`);
  };

  const handleViewProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const renderProductGrid = ({ item }: any) => {
    if (!item) return null;
    
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
    if (!item) return null;
    
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

  // Sort Modal
  const SortModal = () => (
    <Modal
      visible={sortModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setSortModalVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        onPress={() => setSortModalVisible(false)}
        activeOpacity={1}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Sort By</Text>
          
          {[
            { key: 'name', label: 'Name (A-Z)' },
            { key: 'price-low', label: 'Price: Low to High' },
            { key: 'price-high', label: 'Price: High to Low' },
            { key: 'rating', label: 'Rating' },
          ].map(option => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.modalOption,
                sortBy === option.key && styles.modalOptionSelected
              ]}
              onPress={() => {
                setSortBy(option.key as any);
                setSortModalVisible(false);
              }}
            >
              <Text style={[
                styles.modalOptionText,
                sortBy === option.key && styles.modalOptionTextSelected
              ]}>
                {option.label}
              </Text>
              {sortBy === option.key && (
                <Ionicons name="checkmark" size={20} color="#FF9900" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Filter Modal
  const FilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setFilterModalVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        onPress={() => setFilterModalVisible(false)}
        activeOpacity={1}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filter Options</Text>
          
          <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
          <View style={styles.ratingFilterContainer}>
            {[0, 1, 2, 3, 4, 5].map(rating => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.ratingOption,
                  filterRating === rating && styles.ratingOptionSelected
                ]}
                onPress={() => setFilterRating(rating)}
              >
                <Text style={styles.ratingOptionText}>
                  {rating === 0 ? 'All' : `${rating}+ ⭐`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSectionTitle}>Other Filters</Text>
          <TouchableOpacity
            style={styles.filterOption}
            onPress={() => setShowOnlyDiscounted(!showOnlyDiscounted)}
          >
            <Ionicons 
              name={showOnlyDiscounted ? "checkbox" : "square-outline"} 
              size={24} 
              color="#FF9900" 
            />
            <Text style={styles.filterOptionText}>Show only discounted items</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => {
              setFilterRating(0);
              setShowOnlyDiscounted(false);
              setFilterModalVisible(false);
            }}
          >
            <Text style={styles.modalButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

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
          {filteredProducts.length > 0 && (
            <Text style={styles.headerSubtitle}>
              {filteredProducts.length} products
            </Text>
          )}
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons name="filter" size={24} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setSortModalVisible(true)}
          >
            <Ionicons name="swap-vertical" size={24} color="#666" />
          </TouchableOpacity>
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
        data={filteredProducts}
        renderItem={viewMode === 'grid' ? renderProductGrid : renderProductList}
        keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
        numColumns={viewMode === 'grid' ? 2 : 1}
        contentContainerStyle={styles.productsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No products found</Text>
            <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/(tabs)')}>
              <Text style={styles.shopButtonText}>Browse All Products</Text>
            </TouchableOpacity>
          </View>
        }
        ListHeaderComponent={
          filteredProducts.length > 0 && (
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsText}>
                Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </Text>
              {(filterRating > 0 || showOnlyDiscounted) && (
                <View style={styles.activeFilters}>
                  {filterRating > 0 && (
                    <View style={styles.filterChip}>
                      <Text style={styles.filterChipText}>{filterRating}+ ⭐</Text>
                      <TouchableOpacity onPress={() => setFilterRating(0)}>
                        <Ionicons name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {showOnlyDiscounted && (
                    <View style={styles.filterChip}>
                      <Text style={styles.filterChipText}>On Sale</Text>
                      <TouchableOpacity onPress={() => setShowOnlyDiscounted(false)}>
                        <Ionicons name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          )
        }
      />

      {/* Modals */}
      <SortModal />
      <FilterModal />
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
  headerButton: {
    padding: 8,
    marginLeft: 5,
  },
  viewModeButton: {
    padding: 8,
    marginLeft: 5,
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
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9900',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  filterChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionSelected: {
    backgroundColor: '#fff3e0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#131921',
  },
  modalOptionTextSelected: {
    color: '#FF9900',
    fontWeight: '600',
  },
  modalButton: {
    backgroundColor: '#FF9900',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
  },
  ratingFilterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  ratingOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  ratingOptionSelected: {
    backgroundColor: '#FF9900',
    borderColor: '#FF9900',
  },
  ratingOptionText: {
    fontSize: 14,
    color: '#666',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#131921',
  },
});