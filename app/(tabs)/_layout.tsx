// app/tabs/_layout.tsx - POORA FILE YEH USE KAREIN
import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY = '@smartg5_cart';

export default function TabLayout() {
  const [cartItemCount, setCartItemCount] = useState(0);

  // Load cart count on mount and whenever tab changes
  useEffect(() => {
    loadCartCount();
    
    // Refresh cart count every time tabs are focused
    const interval = setInterval(loadCartCount, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const loadCartCount = async () => {
    try {
      const savedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        const count = cart.reduce((total: number, item: any) => total + (item.quantity || 1), 0);
        setCartItemCount(count);
      } else {
        setCartItemCount(0);
      }
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  // Custom Cart Icon with Badge
  const CartIcon = ({ color, size }: { color: string; size: number }) => {
    return (
      <View style={{ position: 'relative' }}>
        <Ionicons name="cart-outline" size={size} color={color} />
        {cartItemCount > 0 && (
          <View
            style={{
              position: 'absolute',
              top: -5,
              right: -8,
              backgroundColor: '#ff4757',
              borderRadius: 10,
              width: 18,
              height: 18,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#fff',
            }}
          >
            <Text
              style={{
                color: '#fff',
                fontSize: 10,
                fontWeight: 'bold',
              }}
            >
              {cartItemCount > 9 ? '9+' : cartItemCount}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF9900',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#ddd',
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false, // Remove default header
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sale"
        options={{
          title: 'Sale',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="local-offer" size={size} color={color} />
          ),
        }}
      />
      {/* IMPORTANT: Cart Tab Add Karein */}
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => (
            <CartIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}