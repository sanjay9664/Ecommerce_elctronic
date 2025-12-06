import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppContext } from '../context/AppContext';
import { SafeImage } from '../../components/common/SafeImage';
import { productAPI } from '../../services/api';
import { Product } from '../../../types';

const { width } = Dimensions.get('window');

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { products, addToCart, wishlist, addToWishlist, removeFromWishlist } = useAppContext();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // First try to find in local products
    const localProduct = products.find(p => p.id === id);
    if (localProduct) {
      setProduct(localProduct);
      setLoading(false);
    } else {
      // If not found, you might want to fetch from API
      // For now, we'll use the first product as fallback
      setProduct(products[0] || null);
      setLoading(false);
    }
  }, [id, products]);

  const toggleWishlist = () => {
    if (!product) return;
    const productName = product.name || product.title || 'Product';
    if (wishlist.find(item => item.id === product.id)) {
      removeFromWishlist(product.id);
      Alert.alert('Removed', `${productName} removed from wishlist`);
    } else {
      addToWishlist(product);
      Alert.alert('Added', `${productName} added to wishlist`);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart(product);
      const productName = product.name || product.title || 'Product';
      Alert.alert('Success', `${productName} added to cart!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add product to cart');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF9900" />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#ccc" />
          <Text style={styles.errorText}>Product not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const productName = product.name || product.title || 'Product';
  const productImage = product.image || product.images?.[0] || null;
  const productDescription = product.description || 'No description available';
  const productRating = product.rating || 0;
  const productPrice = product.price || 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Details</Text>
          <TouchableOpacity onPress={toggleWishlist}>
            <Ionicons 
              name={wishlist.find(p => p.id === product.id) ? "heart" : "heart-outline"} 
              size={24} 
              color={wishlist.find(p => p.id === product.id) ? "red" : "#000"} 
            />
          </TouchableOpacity>
        </View>

        {/* Product Image */}
        <View style={styles.imageContainer}>
          <SafeImage 
            source={{ uri: productImage }} 
            style={styles.productImage}
            showPlaceholder={true}
            resizeMode="contain"
          />
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{productName}</Text>
          
          {productRating > 0 && (
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {[1,2,3,4,5].map((star) => (
                  <Ionicons 
                    key={star} 
                    name="star" 
                    size={20} 
                    color={star <= Math.floor(productRating) ? '#FFD700' : '#ddd'} 
                  />
                ))}
              </View>
              <Text style={styles.ratingText}>{productRating.toFixed(1)}</Text>
            </View>
          )}

          <Text style={styles.price}>${productPrice.toFixed(2)}</Text>
          <Text style={styles.description}>{productDescription}</Text>

          {/* Features */}
          <View style={styles.features}>
            <View style={styles.feature}>
              <MaterialIcons name="local-shipping" size={24} color="#0066c0" />
              <Text style={styles.featureText}>
                {product.fastDelivery ? 'Free delivery tomorrow' : 'Delivery in 3-4 days'}
              </Text>
            </View>
            <View style={styles.feature}>
              <MaterialIcons name="assignment-return" size={24} color="#0066c0" />
              <Text style={styles.featureText}>30-day return policy</Text>
            </View>
            <View style={styles.feature}>
              <MaterialIcons name="verified-user" size={24} color="#0066c0" />
              <Text style={styles.featureText}>1-year warranty</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.buyNowButton} onPress={handleAddToCart}>
          <Text style={styles.buyNowText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addToCartButton}>
          <Text style={styles.addToCartText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  imageContainer: {
    padding: 20,
  },
  productImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  infoContainer: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#131921',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 10,
  },
  ratingText: {
    color: '#0066c0',
    fontSize: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#B12704',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#565959',
    marginBottom: 20,
  },
  features: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#131921',
  },
  actionBar: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#FFD814',
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#FFA41C',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#131921',
  },
  buyNowText: {
    fontSize: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    marginTop: 20,
    fontSize: 18,
    color: '#666',
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#FFA41C',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#131921',
    fontSize: 16,
    fontWeight: '600',
  },
});