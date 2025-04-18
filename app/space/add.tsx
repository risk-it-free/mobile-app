import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useAuth } from '../../hooks/useAuth';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { config } from '../../config';

export default function AddSpaceScreen() {
  const { user, token } = useAuth();
  const [spaceName, setSpaceName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const API_BASE_URL = config.backendApiUrl;
  
  const handleSubmit = async () => {
    if (!spaceName.trim()) {
      Alert.alert('Error', 'Please enter a name for your space');
      return;
    }
    
    if (!token || !user) {
      Alert.alert('Error', 'You need to be logged in to create a space');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/space/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          space_name: spaceName,
          user_id: user.id,
          description: description.trim() || undefined
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create space');
      }
      
      const data = await response.json();
      
      Alert.alert(
        'Success', 
        `Space "${spaceName}" created successfully!`,
        [
          {
            text: 'OK',
            onPress: () => router.replace('/tabs')
          }
        ]
      );
    } catch (error) {
      console.error('Error creating space:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create space. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <MaterialIcons name="room-preferences" size={60} color="#007AFF" />
            <ThemedText style={styles.title}>Add New Space</ThemedText>
            <ThemedText style={styles.subtitle}>
              Create a new living space to monitor for hazards and obstacles
            </ThemedText>
          </View>
          
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Space Name *</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Living Room, Bedroom, etc."
                value={spaceName}
                onChangeText={setSpaceName}
                placeholderTextColor="#999"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Description (Optional)</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add details about this space..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
            </View>
            
            <TouchableOpacity 
              style={[
                styles.button,
                (!spaceName.trim() || isLoading) && styles.buttonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!spaceName.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcons name="add" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.buttonText}>Create Space</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    maxWidth: '80%',
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 100,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 