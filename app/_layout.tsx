import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from './context/AppContext';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="product/[id]" 
          options={{ 
            title: 'Product Details',
            headerStyle: { backgroundColor: '#131921' },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="orders/index" 
          options={{ 
            title: 'My Orders',
            headerStyle: { backgroundColor: '#131921' },
            headerTintColor: '#fff',
          }} 
        />
        <Stack.Screen 
          name="orders/[id]" 
          options={{ 
            title: 'Order Details',
            headerStyle: { backgroundColor: '#131921' },
            headerTintColor: '#fff',
          }} 
        />
      </Stack>
    </AppProvider>
  );
}