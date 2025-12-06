import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
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
import { orderAPI } from '../../services/api';

export default function CartScreen() {
  const { cart, cartData, removeFromCart, fetchCart, loading } = useAppContext();

  useEffect(() => {
    fetchCart();
  }, []);

  const subtotal = cartData?.subtotal || cart.reduce((total, item) => {
    const price = item.product?.price || item.price || 0;
    const qty = item.quantity || 1;
    return total + (price * qty);
  }, 0);
  const shipping = cartData?.shipping || 0;
  const total = cartData?.total || (subtotal + shipping);

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={100} color="#ddd" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => router.push('/(tabs)/all-products')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart ({cart.length})</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading.cart ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FFA41C" />
          <Text style={styles.loadingText}>Loading cart...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {cart.map((item, index) => {
            const product = item.product || item;
            const productId = product.id || item.product_id || item.id;
            const productName = product.name || product.title || 'Product';
            const productImage = product.image || product.images?.[0] || null;
            const productPrice = product.price || item.price || 0;
            const quantity = item.quantity || 1;

            return (
              <View key={productId || index} style={styles.cartItem}>
                <SafeImage 
                  source={{ uri: productImage }} 
                  style={styles.itemImage}
                  showPlaceholder={true}
                />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName}>{productName}</Text>
                  <Text style={styles.itemPrice}>${productPrice.toFixed(2)}</Text>
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantity}>Qty: {quantity}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={async () => {
                    try {
                      await removeFromCart(productId);
                      Alert.alert('Success', 'Product removed from cart');
                    } catch (err: any) {
                      Alert.alert('Error', err.message || 'Failed to remove product');
                    }
                  }}
                >
                  <Ionicons name="trash-outline" size={20} color="#B12704" />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <View style={styles.totalContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Shipping:</Text>
            <Text style={styles.totalValue}>${shipping.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.grandTotalLabel}>Total:</Text>
            <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.checkoutButton}
          onPress={async () => {
            try {
              const order = await orderAPI.create();
              Alert.alert('Success', 'Order created successfully!', [
                { text: 'OK', onPress: () => router.push(`/orders/${order.id || order.order_id}`) }
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to create order');
            }
          }}
        >
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: '#FFA41C',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#131921',
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
  content: {
    flex: 1,
    padding: 15,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B12704',
    marginBottom: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    color: '#666',
  },
  deleteButton: {
    padding: 5,
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalContainer: {
    marginBottom: 15,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 8,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B12704',
  },
  checkoutButton: {
    backgroundColor: '#FFA41C',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutText: {
    fontSize: 18,
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
});