import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { dealerAPI } from '../../services/api';
import { DealerStatus } from '../../types';

export default function ProfileScreen() {
  const [dealerStatus, setDealerStatus] = useState<DealerStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkDealerStatus();
  }, []);

  const checkDealerStatus = async () => {
    try {
      setLoading(true);
      const status = await dealerAPI.canOrder();
      setDealerStatus(status);
    } catch (err: any) {
      console.error('Error checking dealer status:', err);
      // Set default status if API fails
      setDealerStatus({ can_order: true });
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    {
      id: '1',
      title: 'My Orders',
      icon: 'receipt-outline',
      onPress: () => router.push('/orders'),
    },
    {
      id: '2',
      title: 'Wishlist',
      icon: 'heart-outline',
      onPress: () => Alert.alert('Wishlist', 'Wishlist feature coming soon!'),
    },
    {
      id: '3',
      title: 'Settings',
      icon: 'settings-outline',
      onPress: () => Alert.alert('Settings', 'Settings feature coming soon!'),
    },
    {
      id: '4',
      title: 'Customer Support',
      icon: 'headset-outline',
      onPress: () => Alert.alert('Support', 'Customer support feature coming soon!'),
    },
    {
      id: '5',
      title: 'About',
      icon: 'information-circle-outline',
      onPress: () => Alert.alert('About', 'SmartG5 App v1.0.0'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Dealer Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={dealerStatus?.can_order ? "checkmark-circle" : "close-circle"} 
              size={40} 
              color={dealerStatus?.can_order ? "#4CAF50" : "#B12704"} 
            />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {dealerStatus?.can_order ? 'Order Status: Active' : 'Order Status: Blocked'}
              </Text>
              {loading && (
                <ActivityIndicator size="small" color="#FF9900" style={styles.statusLoader} />
              )}
            </View>
          </View>
          
          {!dealerStatus?.can_order && dealerStatus?.reason && (
            <View style={styles.reasonContainer}>
              <Text style={styles.reasonText}>{dealerStatus.reason}</Text>
              {dealerStatus.blocked_until && (
                <Text style={styles.blockedUntil}>
                  Blocked until: {new Date(dealerStatus.blocked_until).toLocaleDateString()}
                </Text>
              )}
            </View>
          )}
          
          {dealerStatus?.message && (
            <Text style={styles.statusMessage}>{dealerStatus.message}</Text>
          )}

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={checkDealerStatus}
            disabled={loading}
          >
            <Ionicons name="refresh-outline" size={20} color="#FF9900" />
            <Text style={styles.refreshButtonText}>Refresh Status</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <Ionicons name={item.icon as any} size={24} color="#131921" />
              <Text style={styles.menuItemText}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>SmartG5 App</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
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
    backgroundColor: '#131921',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusInfo: {
    marginLeft: 15,
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#131921',
  },
  statusLoader: {
    marginTop: 5,
  },
  reasonContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  reasonText: {
    fontSize: 14,
    color: '#c62828',
    marginBottom: 5,
  },
  blockedUntil: {
    fontSize: 12,
    color: '#666',
  },
  statusMessage: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    padding: 10,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF9900',
  },
  refreshButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9900',
  },
  menuSection: {
    backgroundColor: '#fff',
    margin: 15,
    marginTop: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#131921',
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  appInfoText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  appInfoVersion: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
});

