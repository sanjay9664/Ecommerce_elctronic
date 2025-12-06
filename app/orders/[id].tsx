import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
// FIXED IMPORTS - use proper paths based on your structure
import { orderAPI } from '@/services/api';
import { Order, OrderDocument } from '@/types';
import { SafeImage } from '@/components/common/SafeImage';

// Note: Install expo-document-picker if needed: npx expo install expo-document-picker
// import * as DocumentPicker from 'expo-document-picker';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<OrderDocument[]>([]);

  useEffect(() => {
    if (id) {
      fetchOrderDetails();
      fetchDocuments();
    }
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching order details for ID:', id);
      const data = await orderAPI.getById(id);
      console.log('Order data received:', data);
      setOrder(data);
    } catch (err: any) {
      console.error('Full error details:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      console.log('Fetching documents for order:', id);
      const data = await orderAPI.getDocuments(id);
      console.log('Documents data:', data);
      // Handle different response structures
      let docs: OrderDocument[] = [];
      if (Array.isArray(data)) {
        docs = data;
      } else if (data && data.documents && Array.isArray(data.documents)) {
        docs = data.documents;
      } else if (data && Array.isArray(data)) {
        docs = data;
      }
      console.log('Processed documents:', docs.length);
      setDocuments(docs);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      // Don't show error for documents since they might be optional
    }
  };

  const handleUploadPaymentProof = async () => {
    Alert.alert(
      'Upload Payment Proof',
      'This feature requires file picker integration.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: () => {
            // You can implement file picker here when ready
            // For now, show a mock success message
            Alert.alert(
              'Mock Upload',
              'In a real implementation, you would select a file here.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const handleConfirmArrival = async () => {
    Alert.alert(
      'Confirm Arrival',
      'Have you received and inspected this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await orderAPI.confirmArrival(id);
              Alert.alert('Success', 'Order arrival confirmed!');
              fetchOrderDetails();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to confirm arrival');
            }
          },
        },
      ]
    );
  };

  const handleDownloadDocument = (doc: OrderDocument) => {
    if (doc.file_url) {
      Linking.openURL(doc.file_url).catch(err => {
        Alert.alert('Error', 'Could not open document: ' + err.message);
      });
    } else {
      Alert.alert('Error', 'No document URL available');
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return '#666';
    
    switch (status.toLowerCase()) {
      case 'pending':
      case 'processing':
        return '#FFA41C';
      case 'confirmed':
      case 'paid':
        return '#0066c0';
      case 'shipped':
      case 'shipping':
        return '#4CAF50';
      case 'delivered':
      case 'completed':
        return '#4CAF50';
      case 'cancelled':
      case 'refunded':
        return '#B12704';
      default:
        return '#666';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF9900" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#ccc" />
          <Text style={styles.errorText}>{error || 'Order not found'}</Text>
          <Text style={styles.errorSubtext}>Order ID: {id}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.backButton, styles.retryButton]}
            onPress={fetchOrderDetails}
          >
            <Text style={styles.backButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = order.status || 'pending';
  const orderNumber = order.order_number || order.id;
  const items = order.items || [];
  const paymentStatus = order.payment_status || 'pending';
  const paymentProof = order.payment_proof;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Status */}
        <View style={styles.statusCard}>
          <View>
            <Text style={styles.orderNumber}>Order #{orderNumber}</Text>
            <Text style={styles.orderDate}>
              {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
            <Text style={styles.statusText}>{status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Items ({items.length})</Text>
          {items.length > 0 ? (
            items.map((item, index) => {
              const product = item.product || item;
              const productName = product.name || product.title || 'Product';
              const productImage = product.image || product.images?.[0] || null;
              const productPrice = product.price || item.price || 0;
              const quantity = item.quantity || 1;
              const subtotal = item.subtotal || productPrice * quantity;

              return (
                <View key={index} style={styles.itemCard}>
                  <SafeImage
                    source={{ uri: productImage }}
                    style={styles.itemImage}
                    showPlaceholder={true}
                  />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{productName}</Text>
                    <Text style={styles.itemPrice}>${productPrice.toFixed(2)} each</Text>
                    <View style={styles.itemInfoRow}>
                      <Text style={styles.itemQuantity}>Qty: {quantity}</Text>
                      <Text style={styles.itemSubtotal}>${subtotal.toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No items in this order</Text>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>${(order.subtotal || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping:</Text>
            <Text style={styles.summaryValue}>${(order.shipping || 0).toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>${(order.total || 0).toFixed(2)}</Text>
          </View>
          
          {/* Payment Status */}
          {paymentStatus && (
            <View style={[styles.summaryRow, { marginTop: 10 }]}>
              <Text style={styles.summaryLabel}>Payment:</Text>
              <View style={[
                styles.paymentStatusBadge,
                { backgroundColor: paymentStatus === 'paid' ? '#4CAF50' : '#FFA41C' }
              ]}>
                <Text style={styles.paymentStatusText}>{paymentStatus.toUpperCase()}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Documents Section */}
        {documents.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documents ({documents.length})</Text>
            {documents.map((doc, index) => (
              <TouchableOpacity
                key={index}
                style={styles.documentCard}
                onPress={() => handleDownloadDocument(doc)}
              >
                <Ionicons name="document-text-outline" size={24} color="#0066c0" />
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>
                    {doc.type || 'Document'} {doc.file_name ? `- ${doc.file_name}` : ''}
                  </Text>
                  {doc.created_at && (
                    <Text style={styles.documentDate}>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </Text>
                  )}
                </View>
                <Ionicons name="download-outline" size={24} color="#0066c0" />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Documents</Text>
            <Text style={styles.emptyText}>No documents available for this order</Text>
          </View>
        )}

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          {paymentStatus !== 'paid' && !paymentProof && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleUploadPaymentProof}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Upload Payment Proof</Text>
            </TouchableOpacity>
          )}
          
          {paymentProof && (
            <View style={styles.paymentProofContainer}>
              <Text style={styles.paymentProofLabel}>Payment Proof Uploaded</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL(paymentProof)}
                style={styles.viewProofButton}
              >
                <Text style={styles.viewProofText}>View Proof</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {status === 'shipped' || status === 'delivered' ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.confirmButton]}
              onPress={handleConfirmArrival}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Confirm Arrival</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.actionNote}>
              Arrival confirmation available when order is shipped
            </Text>
          )}
        </View>
      </ScrollView>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#B12704',
    textAlign: 'center',
  },
  errorSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#FFA41C',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#0066c0',
    marginTop: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 15,
    margin: 15,
    marginBottom: 10,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#131921',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#131921',
    marginBottom: 15,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    padding: 10,
  },
  itemCard: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#131921',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  itemInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemSubtotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B12704',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B12704',
  },
  paymentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  paymentStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 10,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 15,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#131921',
  },
  documentDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: '#FFA41C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionNote: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 10,
  },
  paymentProofContainer: {
    backgroundColor: '#f0f9ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  paymentProofLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0066c0',
    marginBottom: 10,
  },
  viewProofButton: {
    backgroundColor: '#0066c0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  viewProofText: {
    color: '#fff',
    fontWeight: '600',
  },
});