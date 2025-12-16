import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    orders: 0,
    wishlist: 0,
    cart: 0,
  });

  useEffect(() => {
    loadUserData();
    loadStats();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      // For now, use mock data
      const mockUser = {
        name: 'Sanjay Gupta',
        email: 'sanjay@example.com',
        phone: '+91 9876543210',
        membership: 'Gold Member',
        joinDate: '2024-01-15',
        avatar: 'https://picsum.photos/seed/user/200/200',
      };
      setUserData(mockUser);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const cart = await AsyncStorage.getItem('@cart');
      const wishlist = await AsyncStorage.getItem('@wishlist');
      const orders = await AsyncStorage.getItem('@orders');
      
      setStats({
        cart: cart ? JSON.parse(cart).length : 0,
        wishlist: wishlist ? JSON.parse(wishlist).length : 0,
        orders: orders ? JSON.parse(orders).length : 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const menuSections = [
    {
      title: 'My Account',
      items: [
        {
          id: 'orders',
          title: 'My Orders',
          icon: 'receipt-outline',
          color: '#FF9900',
          onPress: () => router.push('/orders'),
        },
        {
          id: 'wishlist',
          title: 'Wishlist',
          icon: 'heart-outline',
          color: '#FF6B6B',
          onPress: () => router.push('/wishlist'),
        },
        {
          id: 'address',
          title: 'My Addresses',
          icon: 'location-outline',
          color: '#4CAF50',
          onPress: () => Alert.alert('Addresses', 'Address management coming soon!'),
        },
        {
          id: 'payments',
          title: 'Payment Methods',
          icon: 'card-outline',
          color: '#2196F3',
          onPress: () => Alert.alert('Payments', 'Payment methods coming soon!'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help Center',
          icon: 'help-circle-outline',
          color: '#9C27B0',
          onPress: () => Alert.alert('Help', 'Help center coming soon!'),
        },
        {
          id: 'support',
          title: 'Customer Support',
          icon: 'headset-outline',
          color: '#FF9800',
          onPress: () => Alert.alert('Support', 'Customer support: +91-XXXXXXXXXX'),
        },
        {
          id: 'about',
          title: 'About Us',
          icon: 'information-circle-outline',
          color: '#607D8B',
          onPress: () => Alert.alert('About SmartG5', 'Smart Hotel & GRMS Solutions\nVersion 1.0.0'),
        },
      ],
    },
    {
      title: 'Settings',
      items: [
        {
          id: 'settings',
          title: 'App Settings',
          icon: 'settings-outline',
          color: '#795548',
          onPress: () => Alert.alert('Settings', 'App settings coming soon!'),
        },
        {
          id: 'notifications',
          title: 'Notifications',
          icon: 'notifications-outline',
          color: '#FF5722',
          onPress: () => Alert.alert('Notifications', 'Notification settings coming soon!'),
        },
        {
          id: 'logout',
          title: 'Logout',
          icon: 'log-out-outline',
          color: '#F44336',
          onPress: () => {
            Alert.alert(
              'Logout',
              'Are you sure you want to logout?',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: () => router.replace('/login') },
              ]
            );
          },
        },
      ],
    },
  ];

  const StatCard = ({ title, value, icon, color }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9900" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => Alert.alert('Edit', 'Edit profile coming soon!')}>
          <Ionicons name="create-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: userData?.avatar }}
              style={styles.avatar}
            />
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            </View>
          </View>
          
          <Text style={styles.userName}>{userData?.name}</Text>
          <Text style={styles.userEmail}>{userData?.email}</Text>
          
          <View style={styles.membershipBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#FFD700" />
            <Text style={styles.membershipText}>{userData?.membership}</Text>
          </View>
          
          <Text style={styles.joinDate}>
            Member since {new Date(userData?.joinDate).toLocaleDateString()}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <StatCard 
            title="Orders" 
            value={stats.orders} 
            icon="cube-outline" 
            color="#FF9900" 
          />
          <StatCard 
            title="Wishlist" 
            value={stats.wishlist} 
            icon="heart-outline" 
            color="#FF6B6B" 
          />
          <StatCard 
            title="Cart" 
            value={stats.cart} 
            icon="cart-outline" 
            color="#4CAF50" 
          />
          <StatCard 
            title="Saved" 
            value="₹0" 
            icon="wallet-outline" 
            color="#2196F3" 
          />
        </View>

        {/* Menu Sections */}
        {menuSections.map((section, index) => (
          <View key={index} style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuItemsContainer}>
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={item.onPress}
                >
                  <View style={[styles.menuIcon, { backgroundColor: `${item.color}20` }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.color} />
                  </View>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Image
            source={{ uri: 'https://smartg5.com/favicon.ico' }}
            style={styles.appLogo}
          />
          <Text style={styles.appName}>SmartG5</Text>
          <Text style={styles.appTagline}>Smart Hotel & GRMS Solutions</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          
          <View style={styles.socialLinks}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-facebook" size={24} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-instagram" size={24} color="#E4405F" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-linkedin" size={24} color="#0A66C2" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#131921',
    paddingHorizontal: 20,
    paddingVertical: 15,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FF9900',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#131921',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  membershipText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9900',
  },
  joinDate: {
    fontSize: 12,
    color: '#999',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 15,
    marginHorizontal: 4,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#131921',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
  },
  menuSection: {
    marginHorizontal: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#131921',
    marginBottom: 12,
    marginLeft: 5,
  },
  menuItemsContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 30,
    marginHorizontal: 15,
    marginBottom: 30,
    backgroundColor: '#fff',
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginBottom: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#131921',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: '#FF9900',
    marginBottom: 8,
    textAlign: 'center',
  },
  appVersion: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
});