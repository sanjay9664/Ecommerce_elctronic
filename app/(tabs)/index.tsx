import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Dimensions,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { 
    products, 
    cart, 
    wishlist, 
    searchQuery, 
    setSearchQuery, 
    addToCart, 
    addToWishlist, 
    removeFromWishlist 
  } = useAppContext();

  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const categories = [
    { id: '1', name: 'Electronics', icon: 'laptop', value: 'electronics' },
    { id: '2', name: 'Fashion', icon: 'shirt', value: 'fashion' },
    { id: '3', name: 'Home', icon: 'home', value: 'home' },
    { id: '4', name: 'Books', icon: 'book', value: 'books' },
  ];

  // Header Menu Options
  const menuOptions = [
    { id: '1', name: 'My Profile', icon: 'person' },
    { id: '2', name: 'My Orders', icon: 'receipt' },
    { id: '3', name: 'Wishlist', icon: 'heart' },
    { id: '4', name: 'Settings', icon: 'settings' },
    { id: '5', name: 'Customer Support', icon: 'headset' },
  ];

  // Search Functionality
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.length > 0) {
      setIsSearching(true);
      const results = products.filter(product =>
        product.name.toLowerCase().includes(text.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  // Add to Cart with Alert
  const handleAddToCart = (product: any) => {
    addToCart(product);
    Alert.alert('Success', `${product.name} added to cart!`);
  };

  // Toggle Wishlist
  const toggleWishlist = (product: any) => {
    if (wishlist.find(item => item.id === product.id)) {
      removeFromWishlist(product.id);
      Alert.alert('Removed', `${product.name} removed from wishlist`);
    } else {
      addToWishlist(product);
      Alert.alert('Added', `${product.name} added to wishlist`);
    }
  };

  // Render Category
  const renderCategory = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.categoryItem}
      onPress={() => Alert.alert('Category', `${item.name} category clicked!`)}
    >
      <MaterialIcons name={item.icon as any} size={24} color="#FF9900" />
      <Text style={styles.categoryText}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Render Product Card
  const renderProduct = ({ item }: any) => (
    <TouchableOpacity 
      style={styles.productCard}
      onPress={() => router.push(`/product/${item.id}`)}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      
      {/* Wishlist Button */}
      <TouchableOpacity 
        style={styles.wishlistButton}
        onPress={() => toggleWishlist(item)}
      >
        <Ionicons 
          name={wishlist.find(p => p.id === item.id) ? "heart" : "heart-outline"} 
          size={20} 
          color={wishlist.find(p => p.id === item.id) ? "red" : "#666"} 
        />
      </TouchableOpacity>

      <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={16} color="#FFD700" />
        <Text style={styles.rating}>{item.rating}</Text>
      </View>
      <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
      
      {/* Fast Delivery Badge */}
      {item.fastDelivery && (
        <View style={styles.fastDeliveryBadge}>
          <Text style={styles.fastDeliveryText}>Fast Delivery</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.addToCartBtn}
        onPress={() => handleAddToCart(item)}
      >
        <Text style={styles.addToCartText}>Add to Cart</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Menu Button */}
        <TouchableOpacity onPress={() => setIsMenuVisible(true)}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        
        {/* Logo */}
        <Text style={styles.logo}>🏠 SmartG5 Home</Text>
        
        {/* Header Icons */}
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => Alert.alert('Wishlist', 'Wishlist feature coming soon!')}
          >
            <Ionicons name="heart-outline" size={24} color="#fff" />
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
            {cart.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {cart.reduce((total, item) => total + item.quantity, 0)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Search Results */}
      {isSearching && searchResults.length > 0 && (
        <View style={styles.searchResultsContainer}>
          <Text style={styles.searchResultsTitle}>Search Results</Text>
          {searchResults.map(product => (
            <TouchableOpacity 
              key={product.id} 
              style={styles.searchResultItem}
              onPress={() => {
                router.push(`/product/${product.id}`);
                setIsSearching(false);
                setSearchQuery('');
              }}
            >
              <Image source={{ uri: product.image }} style={styles.searchResultImage} />
              <View style={styles.searchResultInfo}>
                <Text style={styles.searchResultName}>{product.name}</Text>
                <Text style={styles.searchResultPrice}>${product.price.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!isSearching && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Banner */}
          <View style={styles.banner}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=400' }}
              style={styles.bannerImage}
            />
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerTitle}>Tech Fest Sale</Text>
              <Text style={styles.bannerSubtitle}>Up to 50% off on Electronics</Text>
            </View>
          </View>

          {/* Categories */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shop by Category</Text>
            <FlatList
              data={categories}
              renderItem={renderCategory}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          </View>

          {/* Featured Products */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Products</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/all-products')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={products.slice(0, 4)}
              renderItem={renderProduct}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsList}
            />
          </View>

          {/* Today's Deals */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Deals</Text>
              <TouchableOpacity onPress={() => Alert.alert('Filters', 'Filters coming soon!')}>
                <Text style={styles.seeAllText}>Filters</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dealsGrid}>
              {products.slice(0, 4).map(product => (
                <TouchableOpacity 
                  key={product.id} 
                  style={styles.dealCard}
                  onPress={() => router.push(`/product/${product.id}`)}
                >
                  <Image source={{ uri: product.image }} style={styles.dealImage} />
                  <View style={styles.dealBadge}>
                    <Text style={styles.dealBadgeText}>20% OFF</Text>
                  </View>
                  <Text style={styles.dealPrice}>${product.price.toFixed(2)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Menu Modal */}
      <Modal
        visible={isMenuVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setIsMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Menu</Text>
            {menuOptions.map(option => (
              <TouchableOpacity 
                key={option.id}
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuVisible(false);
                  Alert.alert(option.name, `${option.name} feature coming soon!`);
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
    backgroundColor: '#131921',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  logo: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 15,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF9900',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  searchButton: {
    padding: 5,
  },
  searchResultsContainer: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 8,
    padding: 10,
    maxHeight: 300,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 10,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchResultPrice: {
    fontSize: 14,
    color: '#B12704',
    fontWeight: 'bold',
  },
  banner: {
    marginHorizontal: 15,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: 200,
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    color: '#FF9900',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginVertical: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#131921',
    paddingHorizontal: 15,
  },
  seeAllText: {
    color: '#0066c0',
    fontWeight: '500',
  },
  categoriesList: {
    paddingHorizontal: 10,
  },
  categoryItem: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    marginTop: 5,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  productsList: {
    paddingHorizontal: 10,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 5,
    width: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  wishlistButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 15,
    padding: 5,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    height: 36,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rating: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B12704',
    marginBottom: 8,
  },
  fastDeliveryBadge: {
    backgroundColor: '#FFD814',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  fastDeliveryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#131921',
  },
  addToCartBtn: {
    backgroundColor: '#FFD814',
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#131921',
  },
  dealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  dealCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: (width - 40) / 2,
    marginBottom: 10,
    padding: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dealImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  dealBadge: {
    position: 'absolute',
    top: 15,
    left: 15,
    backgroundColor: '#B12704',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dealBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dealPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B12704',
    marginTop: 8,
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
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#131921',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#131921',
  },
});