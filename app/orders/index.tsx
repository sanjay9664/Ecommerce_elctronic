import React, { useEffect, useState } from 'react';
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
import { orderAPI } from '../../services/api';
import { Order } from '../../types';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderAPI.getAll();
      const ordersList = Array.isArray(data) ? data : (data.orders || []);
      setOrders(ordersList);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#FFA41C';
      case 'confirmed':
        return '#0066c0';
      case 'shipped':
        return '#4CAF50';
      case 'delivered':
        return '#4CAF50';
      case 'cancelled':
        return '#B12704';
      default:
        return '#666';
    }
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const orderNumber = item.order_number || item.id;
    const status = item.status || 'pending';
    const total = item.total || 0;
    const itemCount = item.items?.length || 0;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push(`/orders/${item.id}`)}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>Order #{orderNumber}</Text>
            <Text style={styles.orderDate}>
              {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
            <Text style={styles.statusText}>{status.toUpperCase()}</Text>
          </View>
        </View>
        
        <View style={styles.orderInfo}>
          <Text style={styles.itemCount}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
          <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
        </View>

        <View style={styles.orderActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push(`/orders/${item.id}`)}
          >
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF9900" />
          <Text style={styles.loadingText}>Loading orders...</Text>
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
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchOrders} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No orders yet</Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => router.push('/(tabs)/all-products')}
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        }
      />
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
    backgroundColor: '#ffebee',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    padding: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#131921',
  },
  orderDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B12704',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    backgroundColor: '#FFA41C',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#131921',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
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
});

