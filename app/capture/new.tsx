import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useLocalSearchParams, router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { config } from '../../config';

export default function CaptureScreen() {
  // Use local params to get the parameters
  const localParams = useLocalSearchParams();
  
  // Try to get spaceId from multiple possible keys
  const spaceId = 
    localParams.spaceId || 
    localParams.spaceid || 
    localParams.space_id;
  
  const spaceName = localParams.spaceName || 'Space';
  
  const { token } = useAuth();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const API_BASE_URL = config.backendApiUrl;
  
  // Debug the parameters
  useEffect(() => {
    console.log('Local Params:', JSON.stringify(localParams));
    console.log('Space ID:', spaceId);
    console.log('Space Name:', spaceName);
  }, [localParams, spaceId, spaceName]);

  const pickImageFromGallery = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }
    
    // Open image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhotoWithCamera = async () => {
    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Sorry, we need camera permissions to make this work!');
      return;
    }
    
    // Open camera
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please select or capture an image first');
      return;
    }
    
    if (!spaceId) {
      Alert.alert(
        'Missing Space ID', 
        'No space ID was found. Do you want to continue with a test upload?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Continue Anyway',
            onPress: () => performUpload('test-space-123')
          }
        ]
      );
      return;
    }
    
    if (!token) {
      Alert.alert('Error', 'You are not authenticated. Please log in again.');
      return;
    }

    performUpload(spaceId.toString());
  };
  
  const performUpload = async (id: string) => {
    setUploading(true);

    try {
      // Create a FormData object to hold the multipart form data
      const formData = new FormData();
      
      // Add the space_id as a string
      formData.append('space_id', id);
      
      // Add the image file
      // Get the file name from the URI
      const fileName = imageUri!.split('/').pop() || 'image.jpg';
      // Infer the MIME type (assuming it's a JPEG if we can't determine it)
      const match = /\.(\w+)$/.exec(fileName);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      // Append the image file to the form data
      formData.append('image', {
        uri: imageUri,
        name: fileName,
        type,
      } as any);
      
      console.log("Uploading to:", `${API_BASE_URL}/space/logs/upload-image`);
      console.log("Space ID being sent:", id);
      
      const response = await fetch(`${API_BASE_URL}/space/logs/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Remove explicit Content-Type as it's set automatically by FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('Server error:', errorText);
        throw new Error(`Failed to upload image: ${response.status} ${response.statusText}`);
      }

      // Success! Navigate back to the space page
      Alert.alert(
        'Success',
        'Image uploaded successfully!',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate back to the space page, ensuring spaceId is used properly
              router.replace(id ? `/space/${id}` : '/');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Rendering logic based on state
  if (uploading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.uploadingText}>
            Analyzing image for your safety...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (imageUri) {
    return (
      <ThemedView style={styles.container}>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.preview}
          />
          <ThemedText style={styles.previewText}>
            Review the image before submission
          </ThemedText>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#F44336' }]}
            onPress={() => setImageUri(null)}
          >
            <MaterialIcons name="close" size={20} color="#FFFFFF" />
            <ThemedText style={styles.buttonText}>Retake</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#4CAF50' }]}
            onPress={uploadImage}
          >
            <MaterialIcons name="check" size={20} color="#FFFFFF" />
            <ThemedText style={styles.buttonText}>Submit</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.uploadContainer}>
        <View style={styles.optionsHeader}>
          <MaterialIcons name="add-a-photo" size={40} color="#007AFF" />
          <ThemedText style={styles.title}>
            Choose an option
          </ThemedText>
          <ThemedText style={styles.description}>
            Select an image from your gallery or capture a new photo for upload.
          </ThemedText>
        </View>
        
        <TouchableOpacity 
          style={styles.optionButton}
          onPress={takePhotoWithCamera}
        >
          <View style={styles.optionIconContainer}>
            <MaterialIcons name="camera-alt" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.optionTextContainer}>
            <ThemedText style={styles.optionTitle}>Take Photo</ThemedText>
            <ThemedText style={styles.optionDescription}>Capture a new image with your camera</ThemedText>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.optionButton}
          onPress={pickImageFromGallery}
        >
          <View style={styles.optionIconContainer}>
            <MaterialIcons name="photo-library" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.optionTextContainer}>
            <ThemedText style={styles.optionTitle}>Choose from Gallery</ThemedText>
            <ThemedText style={styles.optionDescription}>Select an existing image from your device</ThemedText>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#F9F9F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    maxWidth: '80%',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 30,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  preview: {
    width: '100%',
    height: '70%',
    borderRadius: 12,
  },
  imageContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  previewText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  uploadContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    justifyContent: 'center',
  },
  optionsHeader: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  uploadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  uploadingText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 10,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIconContainer: {
    backgroundColor: '#007AFF',
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
  },
}); 