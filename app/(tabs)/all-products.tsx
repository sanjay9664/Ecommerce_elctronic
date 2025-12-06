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
import { router, useLocalSearchParams } from 'expo-router';
import { useAppContext } from '../context/AppContext';
import { SafeImage } from '../../components/common/SafeImage';

export default function AllProductsScreen() {
  const { id: categoryId } = useLocalSearchParams<{ id?: string }>();
  const { 
    products, 
    addToCart, 
    fetchProductsByCategory,
    loading 
  } = useAppContext();

  useEffect(() => {
    if (categoryId) {
      fetchProductsByCategory(categoryId);
    } else {
      fetchProductsByCategory();
    }
  }, [categoryId]);

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
        
        <Text style={styles.productName} numberOfLines={2}>{productName}</Text>
        {productRating > 0 && (
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{productRating.toFixed(1)}</Text>
          </View>
        )}
        <Text style={styles.productPrice}>${productPrice.toFixed(2)}</Text>
        
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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Products</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading.products ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF9900" />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsGrid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={60} color="#ccc" />
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
    backgroundColor: '#EAEDED',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
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
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B12704',
    marginBottom: 8,
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
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
    color: '#666',
  },
});