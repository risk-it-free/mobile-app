import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Image, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useAuth } from '../../hooks/useAuth';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';

// Define interface for Space
interface Space {
  _id: string;
  space_name: string;
  description: string;
  created_at: string;
}

export default function HomeScreen() {
  const { user, token } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const API_BASE_URL = 'https://2595-2603-8000-ba00-2aae-19d0-bb4a-f0eb-4b8f.ngrok-free.app';
  
  // Fetch spaces from API
  const fetchSpaces = async () => {
    if (!token || !user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/space/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch spaces');
      }
      
      const data = await response.json();
      setSpaces(data);
    } catch (error) {
      console.error('Error fetching spaces:', error);
      Alert.alert('Error', 'Failed to load your spaces. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchSpaces();
  }, [token, user]);
  
  const greeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 18) return 'Good Afternoon';
    return 'Good Evening';
  };
  
  const handleSpacePress = (spaceId: string) => {
    // Navigate to space detail screen
    router.push(`/space/${spaceId}`);
  };
  
  const handleAddSpace = () => {
    // Navigate to add space screen
    router.push("/space/add");
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.greetingText}>{greeting()}</ThemedText>
          <ThemedText style={styles.nameText}>{user?.firstName || 'User'}</ThemedText>
        </View>
        <TouchableOpacity style={styles.notificationIcon}>
          <MaterialIcons name="notifications" size={28} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* App Introduction Card */}
        <View style={styles.introCard}>
          <View style={styles.introTextContainer}>
            <ThemedText style={styles.introTitle}>SafeSpace</ThemedText>
            <ThemedText style={styles.introDescription}>
              Helping you identify and avoid hazards in your living spaces. Upload images of your rooms and get safety assessments to prevent falls and accidents.
            </ThemedText>
          </View>
          <View style={styles.introIconContainer}>
            <MaterialIcons name="health-and-safety" size={60} color="#4CAF50" />
          </View>
        </View>
        
        {/* Spaces Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Your Spaces</ThemedText>
          </View>

          {spaces.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="room" size={50} color="#CCCCCC" />
              <ThemedText style={styles.emptyStateText}>
                You haven't added any spaces yet. Add your first space to start safety assessments.
              </ThemedText>
            </View>
          ) : (
            <View style={styles.spacesGrid}>
              {spaces.map((space) => (
                <TouchableOpacity 
                  key={space._id} 
                  style={styles.spaceCard}
                  onPress={() => handleSpacePress(space._id)}
                >
                  <View style={styles.spaceIconContainer}>
                    <MaterialIcons name="room" size={32} color="#007AFF" />
                  </View>
                  <ThemedText style={styles.spaceName}>{space.space_name}</ThemedText>
                  <ThemedText style={styles.spaceDescription} numberOfLines={2}>
                    {space.description || 'No description'}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        {/* Emergency Button */}
        <TouchableOpacity style={styles.emergencyButton}>
          <MaterialIcons name="emergency" size={20} color="#fff" />
          <ThemedText style={styles.emergencyButtonText}>Emergency Contact</ThemedText>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Add Space FAB */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddSpace}
      >
        <MaterialIcons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 16,
    color: '#666',
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  introCard: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  introTextContainer: {
    flex: 3,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2A2A2A',
  },
  introDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  introIconContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  emptyStateText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#777',
    fontSize: 14,
  },
  spacesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  spaceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  spaceIconContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 10,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  spaceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  spaceDescription: {
    fontSize: 12,
    color: '#666',
  },
  emergencyButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#007AFF',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});
