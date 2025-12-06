import { Stack } from 'expo-router';

export default function ProductLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Product Details',
          headerStyle: { backgroundColor: '#131921' },
          headerTintColor: '#fff',
        }} 
      />
    </Stack>
  );
}

