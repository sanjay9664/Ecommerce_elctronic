// app/tabs/cart.tsx - POORA FILE YEH USE KAREIN
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CART_STORAGE_KEY = '@smartg5_cart';

// Safe Image Component for cart
const SafeImage = ({ source, style, placeholder }: any) => {
  const [imageError, setImageError] = useState(false);

  if (!source?.uri || imageError) {
    return (
      <View style={[style, styles.imagePlaceholder]}>
        <Ionicons name="image-outline" size={30} color="#ccc" />
        <Text style={styles.placeholderText}>{placeholder || 'No Image'}</Text>
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={style}
      resizeMode="cover"
      onError={() => setImageError(true)}
    />
  );
};

export default function CartScreen() {
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCart();
  }, []);

  // Load cart from storage
  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        console.log('Loaded cart:', parsedCart.length, 'items');
        setCart(parsedCart);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      Alert.alert('Error', 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  // Save cart to storage
  const saveCart = async (updatedCart: any[]) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updatedCart));
      console.log('Cart saved to storage:', updatedCart.length, 'items');
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    Alert.alert(
      'Remove Item',
      `Remove ${productName} from cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeFromCart(productId),
        },
      ]
    );
  };

  const removeFromCart = (productId: string) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    saveCart(updatedCart);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const updatedCart = cart.map(item =>
      item.id === productId
        ? { ...item, quantity }
        : item
    );
    setCart(updatedCart);
    saveCart(updatedCart);
  };

  const handleUpdateQuantity = (productId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    updateCartQuantity(productId, newQuantity);
  };

 
const handleClearCart = () => {
  if (cart.length === 0) return;
  
  Alert.alert(
    'Clear Cart',
    'Remove all items from cart?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          try {
            // Clear both state and storage
            setCart([]);
            await AsyncStorage.removeItem(CART_STORAGE_KEY);
            console.log('Cart cleared successfully');
            
            // Optional: Show success message
            Alert.alert('Success', 'Cart cleared successfully!');
            
            // Go back to home or refresh
            router.push('/(tabs)');
          } catch (error) {
            console.error('Error clearing cart:', error);
            Alert.alert('Error', 'Failed to clear cart');
          }
        },
      },
    ]
  );
};

  const handleViewProduct = (productId: string) => {
    router.push(`/product/${productId}`);
  };

  const getDisplayPrice = (item: any) => {
    return item.offer_price > 0 ? item.offer_price : item.price;
  };

  const renderCartItem = ({ item }: any) => {
    if (!item) return null;

    const displayPrice = getDisplayPrice(item);
    const itemTotal = displayPrice * (item.quantity || 1);
    const hasDiscount = item.discount_percentage > 0 || (item.price > item.offer_price && item.offer_price > 0);
    const discountPercentage = hasDiscount && item.price 
      ? Math.round((1 - displayPrice / item.price) * 100)
      : 0;

    return (
      <View style={styles.cartItem}>
        <TouchableOpacity 
          style={styles.itemContent}
          onPress={() => handleViewProduct(item.id)}
        >
          <SafeImage
            source={{ uri: item.image || item.images?.[0] }}
            style={styles.itemImage}
            placeholder="Product"
          />
          
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.name || item.title || 'Product'}
            </Text>
            
            {item.description && (
              <Text style={styles.itemDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            
            <View style={styles.priceContainer}>
              <Text style={styles.itemPrice}>₹{displayPrice?.toFixed(2)} each</Text>
              {hasDiscount && item.price && (
                <Text style={styles.originalPrice}>
                  ₹{item.price?.toFixed(2)}
                </Text>
              )}
            </View>
            
            {hasDiscount && discountPercentage > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>
                  {discountPercentage}% OFF
                </Text>
              </View>
            )}
            
            <View style={styles.quantityContainer}>
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => handleUpdateQuantity(item.id, item.quantity || 1, -1)}
              >
                <Ionicons name="remove" size={20} color="#666" />
              </TouchableOpacity>
              
              <Text style={styles.quantityText}>{item.quantity || 1}</Text>
              
              <TouchableOpacity 
                style={styles.quantityButton}
                onPress={() => handleUpdateQuantity(item.id, item.quantity || 1, 1)}
              >
                <Ionicons name="add" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.itemTotal}>Total: ₹{itemTotal.toFixed(2)}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemoveItem(item.id, item.name || item.title || 'Product')}
        >
          <Ionicons name="trash-outline" size={20} color="#B12704" />
        </TouchableOpacity>
      </View>
    );
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.offer_price > 0 ? item.offer_price : item.price;
      return total + (price * (item.quantity || 1));
    }, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const cartTotal = getCartTotal();
  const itemCount = getCartItemCount();
  const shipping = cart.length > 0 ? 5.99 : 0;
  const tax = cartTotal * 0.08;
  const grandTotal = cartTotal + shipping + tax;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9900" />
          <Text style={styles.loadingText}>Loading cart...</Text>
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
        <Text style={styles.headerTitle}>My Cart ({itemCount})</Text>
        {cart.length > 0 && (
          <TouchableOpacity onPress={handleClearCart}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cart Items */}
      <FlatList
        data={cart}
        renderItem={renderCartItem}
        keyExtractor={(item) => item?.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.cartList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bag-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>
              Add items to get started
            </Text>
            <TouchableOpacity 
              style={styles.shopButton}
              onPress={() => router.push('/(tabs)')}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Order Summary */}
      {cart.length > 0 && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items ({itemCount}):</Text>
            <Text style={styles.summaryValue}>₹{cartTotal.toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping:</Text>
            <Text style={styles.summaryValue}>₹{shipping.toFixed(2)}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax (8%):</Text>
            <Text style={styles.summaryValue}>₹{tax.toFixed(2)}</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.checkoutButton}
            onPress={() => {
              Alert.alert(
                'Proceed to Checkout',
                `Total: ₹${grandTotal.toFixed(2)}`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Checkout',
                    onPress: () => {
                      Alert.alert('Order Placed', 'Your order has been placed successfully!');
                    },
                  },
                ]
              );
            }}
          >
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.continueText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#131921',
  },
  clearText: {
    fontSize: 14,
    color: '#B12704',
    fontWeight: '600',
  },
  cartList: {
    padding: 10,
  },
  cartItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemContent: {
    flexDirection: 'row',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemPrice: {
    fontSize: 14,
    color: '#B12704',
    fontWeight: '600',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  discountBadge: {
    backgroundColor: '#B12704',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  discountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 15,
    minWidth: 20,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#131921',
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
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
  summaryContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#f8f9fa',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#131921',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B12704',
  },
  checkoutButton: {
    backgroundColor: '#FF9900',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  continueText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  imagePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  placeholderText: {
    color: '#999',
    fontSize: 10,
    marginTop: 2,
  },
});