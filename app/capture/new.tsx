import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useLocalSearchParams, router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { config } from '../../config';

export default function CaptureScreen() {
  const { spaceId, spaceName } = useLocalSearchParams();
  const { token } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const API_BASE_URL = config.backendApiUrl;
  
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
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setImage(result.assets[0].base64 || null);
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
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setImage(result.assets[0].base64 || null);
    }
  };

  const uploadImage = async () => {
    if (!image || !spaceId || !token) {
      Alert.alert('Error', 'Missing image data or space information');
      return;
    }

    setUploading(true);

    try {
      // This would normally be a real AI analysis, but for demo purposes
      // we're just creating a random safety assessment
      const mockAnalysis = generateMockAnalysis();
      
      const payload = {
        space_id: spaceId,
        image_data: image,
        score: mockAnalysis.score,
        bounding_box_info: mockAnalysis.bounding_box_info,
        recommendations: mockAnalysis.recommendations,
        hazard_list: mockAnalysis.hazard_list,
        comments: `Safety assessment for ${spaceName}`,
      };

      const response = await fetch(`${API_BASE_URL}/space/logs/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to upload image and create assessment');
      }

      // Success! Navigate back to the space page
      Alert.alert(
        'Success',
        'Safety assessment created successfully!',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate back to the space page
              router.replace(`/space/${spaceId}`);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image and create assessment. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Helper function to generate mock analysis data for demo purposes
  const generateMockAnalysis = () => {
    const score = Math.floor(Math.random() * 40) + 60; // Random score between 60-99
    
    const possibleHazards = {
      high_priority: ['Exposed wiring', 'Wet floor without sign', 'Blocked emergency exit'],
      medium_priority: ['Cluttered pathway', 'Poor lighting', 'Loose carpeting', 'Uneven flooring'],
      low_priority: ['Dim lighting', 'Furniture placement', 'Cable management needed']
    };
    
    const possibleRecommendations = [
      'Move furniture to create wider pathways',
      'Secure loose cables along walls',
      'Install better lighting in dark areas',
      'Add grab bars near stairs and in bathrooms',
      'Remove trip hazards from walkways',
      'Use non-slip mats in wet areas',
      'Store frequently used items within easy reach',
      'Consider motion-activated night lights'
    ];
    
    // Randomly select hazards
    const hazardList = {
      high_priority: score < 70 ? [possibleHazards.high_priority[Math.floor(Math.random() * possibleHazards.high_priority.length)]] : [],
      medium_priority: score < 85 ? [possibleHazards.medium_priority[Math.floor(Math.random() * possibleHazards.medium_priority.length)]] : [],
      low_priority: [possibleHazards.low_priority[Math.floor(Math.random() * possibleHazards.low_priority.length)]]
    };
    
    // Randomly select 2-4 recommendations
    const recommendations: string[] = [];
    const numRecommendations = Math.floor(Math.random() * 3) + 2; // 2-4
    for (let i = 0; i < numRecommendations; i++) {
      const rec = possibleRecommendations[Math.floor(Math.random() * possibleRecommendations.length)];
      if (!recommendations.includes(rec)) {
        recommendations.push(rec);
      }
    }
    
    return {
      score,
      bounding_box_info: {
        objects: [
          {
            type: 'furniture',
            confidence: 0.92,
            bbox: [50, 80, 200, 300]
          }
        ]
      },
      recommendations,
      hazard_list: hazardList
    };
  };

  // Rendering logic based on state
  if (uploading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.uploadingText}>
            Analyzing image and creating safety assessment...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (image) {
    return (
      <ThemedView style={styles.container}>

        <View style={styles.imageContainer}>
          <Image
            source={{ uri: `data:image/jpeg;base64,${image}` }}
            style={styles.preview}
          />
          <ThemedText style={styles.previewText}>
            Review the image before submission
          </ThemedText>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#F44336' }]}
            onPress={() => setImage(null)}
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
            Select an image from your gallery or capture a new photo for AI safety assessment.
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