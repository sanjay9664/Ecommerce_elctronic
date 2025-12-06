import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppContext } from '../context/AppContext';
import { SafeImage } from '../../components/common/SafeImage';

export default function FamousScreen() {
  const { products, addToCart, fetchProductsByCategory, loading } = useAppContext();

  useEffect(() => {
    fetchProductsByCategory();
  }, []);

  // Sort by rating (famous products)
  const famousProducts = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const handleAddToCart = async (product: any) => {
    try {
      await addToCart(product);
      const productName = product.name || product.title || 'Product';
      Alert.alert('Success', `${productName} added to cart!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add product to cart');
    }
  };

  const renderProduct = ({ item }: any) => {
    const productName = item.name || item.title || 'Product';
    const productImage = item.image || item.images?.[0] || null;
    const productRating = item.rating || 0;
    const productPrice = item.price || 0;

    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <SafeImage 
          source={{ uri: productImage }} 
          style={styles.productImage}
          showPlaceholder={true}
        />
        
        <View style={styles.famousBadge}>
          <Ionicons name="trending-up" size={16} color="#fff" />
          <Text style={styles.famousBadgeText}>Popular</Text>
        </View>

        <Text style={styles.productName} numberOfLines={2}>{productName}</Text>
        
        {productRating > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{productRating.toFixed(1)}</Text>
          </View>
        )}
        
        <Text style={styles.productPrice}>${productPrice.toFixed(2)}</Text>
        
        {item.fastDelivery && (
          <View style={styles.fastDeliveryBadge}>
            <Text style={styles.fastDeliveryText}>🚚 Fast Delivery</Text>
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⭐ Famous Products</Text>
        <Text style={styles.headerSubtitle}>Most Loved by Customers</Text>
      </View>

      {loading.products ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1a237e" />
          <Text style={styles.loadingText}>Loading popular products...</Text>
        </View>
      ) : (
        <FlatList
          data={famousProducts}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsGrid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products available</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8FF',
  },
  header: {
    backgroundColor: '#1a237e',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFD700',
    marginTop: 5,
  },
  productsGrid: {
    padding: 10,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    margin: 5,
    flex: 1,
    minWidth: '45%',
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
  famousBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  famousBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    height: 36,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  rating: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  reviews: {
    fontSize: 10,
    color: '#666',
    marginLeft: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B12704',
    marginBottom: 8,
  },
  fastDeliveryBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  fastDeliveryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  addToCartBtn: {
    backgroundColor: '#FFA41C',
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#131921',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
  },
});