import { Stack } from 'expo-router';
import React from 'react';

export default function CaptureLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="new" 
        options={{ 
          title: 'Capture Space',
          headerShown: true,
        }} 
      />
    </Stack>
  );
} 