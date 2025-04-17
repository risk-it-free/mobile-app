import { Redirect } from 'expo-router';
import React from 'react';

export default function SpaceIndex() {
  // Redirect to home since we don't need a separate spaces index
  return <Redirect href="/tabs" />;
} 