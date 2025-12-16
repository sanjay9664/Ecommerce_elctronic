// components/common/SmartG5Header.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SmartG5HeaderProps {
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const SmartG5Header: React.FC<SmartG5HeaderProps> = ({ 
  showBackButton = false, 
  onBackPress 
}) => {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [showWishlistProducts, setShowWishlistProducts] = useState(false);

  // Menu options (same as HomeScreen)
  const menuOptions = [
    { id: '1', name: 'My Profile', icon: 'person', route: '/(tabs)/profile' },
    { id: '2', name: 'My Orders', icon: 'receipt', route: '/orders' },
    { id: '3', name: 'Settings', icon: 'settings', route: null },
    { id: '4', name: 'Customer Support', icon: 'headset', route: null },
  ];

  // Calculate cart item count
  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  // Handle heart icon click
  const handleHeartIconClick = () => {
    setShowWishlistProducts(!showWishlistProducts);
  };

  const cartItemCount = getCartItemCount();

  return (
    <SafeAreaView style={styles.container}>
      {/* Beautiful Header - Same as HomeScreen */}
      <View style={styles.header}>
        {/* Back Button or Menu Button */}
        {showBackButton ? (
          <TouchableOpacity onPress={onBackPress || (() => router.back())}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setIsMenuVisible(true)}>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        
        {/* Enhanced Logo - Same as HomeScreen */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🏨</Text>
          <Text style={styles.logoText}>SmartG5</Text>
        </View>
        
        {/* Header Icons - Same as HomeScreen */}
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleHeartIconClick}
          >
            <Ionicons 
              name={showWishlistProducts ? "heart" : "heart-outline"} 
              size={24} 
              color="#fff" 
            />
            {wishlist.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{wishlist.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => router.push('/(tabs)/cart')}
          >
            <Ionicons name="cart-outline" size={24} color="#fff" />
            {cartItemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Modal - Same as HomeScreen */}
      <Modal
        visible={isMenuVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setIsMenuVisible(false)}
          activeOpacity={1}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Menu</Text>
            {menuOptions.map(option => (
              <TouchableOpacity 
                key={option.id}
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuVisible(false);
                  if (option.route) {
                    router.push(option.route as any);
                  } else {
                    Alert.alert(option.name, `${option.name} feature coming soon!`);
                  }
                }}
              >
                <Ionicons name={option.icon as any} size={24} color="#131921" />
                <Text style={styles.menuItemText}>{option.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    fontSize: 24,
    marginRight: 8,
  },
  logoText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 20,
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
  },
  menuContainer: {
    backgroundColor: '#fff',
    marginTop: 50,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 25,
    textAlign: 'center',
    color: '#1a1a2e',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 18,
    marginLeft: 20,
    color: '#1a1a2e',
    fontWeight: '500',
  },
});

export default SmartG5Header;