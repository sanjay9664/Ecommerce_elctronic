import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function ProductScreen() {
  const { id } = useLocalSearchParams();
  const { products, addToCart, wishlist, addToWishlist, removeFromWishlist } = useAppContext();

  const product = products.find(p => p.id === id) || products[0];

  const toggleWishlist = () => {
    if (wishlist.find(item => item.id === product.id)) {
      removeFromWishlist(product.id);
      Alert.alert('Removed', 'Product removed from wishlist');
    } else {
      addToWishlist(product);
      Alert.alert('Added', 'Product added to wishlist');
    }
  };

  const handleAddToCart = () => {
    addToCart(product);
    Alert.alert('Success', 'Product added to cart!');
  };

  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Product not found</Text>
      </SafeAreaView>
    );
  }

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
          <Image source={{ uri: product.image }} style={styles.productImage} />
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          
          <View style={styles.ratingContainer}>
            <View style={styles.stars}>
              {[1,2,3,4,5].map((star) => (
                <Ionicons 
                  key={star} 
                  name="star" 
                  size={20} 
                  color={star <= Math.floor(product.rating) ? '#FFD700' : '#ddd'} 
                />
              ))}
            </View>
            <Text style={styles.ratingText}>{product.rating} • {Math.floor(Math.random() * 1000) + 100} ratings</Text>
          </View>

          <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          <Text style={styles.description}>{product.description}</Text>

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
});