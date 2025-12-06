import React from 'react';
import { Image, View, Text, StyleSheet, ImageStyle, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SafeImageProps {
  source: { uri: string | null | undefined } | number | null | undefined;
  style?: ImageStyle | ViewStyle;
  placeholder?: string;
  showPlaceholder?: boolean;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

export const SafeImage: React.FC<SafeImageProps> = ({
  source,
  style,
  placeholder = 'No Image',
  showPlaceholder = true,
  resizeMode = 'cover',
}) => {
  // Handle null, undefined, or empty image
  const imageUri = 
    typeof source === 'object' && source !== null && 'uri' in source 
      ? source.uri 
      : null;

  if (!imageUri || imageUri === 'null' || imageUri === '') {
    if (!showPlaceholder) {
      return null;
    }
    
    return (
      <View style={[styles.placeholderContainer, style]}>
        <Ionicons name="image-outline" size={40} color="#ccc" />
        {placeholder && (
          <Text style={styles.placeholderText}>{placeholder}</Text>
        )}
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUri }}
      style={style}
      resizeMode={resizeMode}
      defaultSource={require('../../assets/images/icon.png')}
      onError={() => {
        // Image failed to load, but we'll let the placeholder handle it
      }}
    />
  );
};

const styles = StyleSheet.create({
  placeholderContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

