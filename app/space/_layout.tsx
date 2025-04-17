import { Stack } from 'expo-router';
import React from 'react';

export default function SpaceLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Spaces',
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="log" 
        options={{ 
          title: 'Space Details',
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="add" 
        options={{ 
          title: 'Add New Space',
          headerShown: true,
        }} 
      />
      <Stack.Screen
        name="log/[logId]"
        options={{
          title: 'Assessment Details',
          headerShown: true,
        }}
      />
    </Stack>
  );
} 