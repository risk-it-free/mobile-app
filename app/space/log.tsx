import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useAuth } from '../../hooks/useAuth';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { config } from '../../config';

// Define interfaces for data types
interface Space {
  _id: string;
  space_name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface SpaceLog {
  _id: string;
  space_id: string;
  image_data: string;
  score: number;
  bounding_box_info: {
    objects: {
      type: string;
      confidence: number;
      bbox: number[];
    }[];
  };
  recommendations: string[];
  hazard_list: {
    high_priority: string[];
    medium_priority: string[];
    low_priority: string[];
  };
  comments: string;
  metadata: {
    analyzed_by: string;
    processing_time: string;
  };
  created_at: string;
  updated_at: string;
}

export default function SpaceDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const [space, setSpace] = useState<Space | null>(null);
  const [logs, setLogs] = useState<SpaceLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  const API_BASE_URL = config.backendApiUrl;
  
  useEffect(() => {
    const fetchSpaceDetails = async () => {
      if (!token || !id) return;
      
      try {
        setLoading(true);
        
        // Fetch space details
        const spaceResponse = await fetch(`${API_BASE_URL}/space/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!spaceResponse.ok) {
          throw new Error('Failed to fetch space details');
        }
        
        const spaceData = await spaceResponse.json();
        setSpace(spaceData);
        
        // Fetch space logs
        const logsResponse = await fetch(`${API_BASE_URL}/space/logs/space/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!logsResponse.ok) {
          throw new Error('Failed to fetch space logs');
        }
        
        const logsData = await logsResponse.json();
        setLogs(logsData);
      } catch (error) {
        console.error('Error fetching space details:', error);
        Alert.alert('Error', 'Failed to load space details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSpaceDetails();
  }, [id, token]);
  
  const handleAddAssessment = () => {
    if (space) {
      router.push(`/capture/new?spaceId=${space._id}&spaceName=${encodeURIComponent(space.space_name)}`);
    }
  };
  
  const handleLogPress = (log: SpaceLog) => {
    router.push(`/space/log/${log._id}`);
  };
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get hazard count
  const getHazardCount = (log: SpaceLog) => {
    const highCount = log.hazard_list.high_priority?.length || 0;
    const mediumCount = log.hazard_list.medium_priority?.length || 0;
    const lowCount = log.hazard_list.low_priority?.length || 0;
    return highCount + mediumCount + lowCount;
  };
  
  // Get safety color based on score
  const getSafetyColor = (score: number) => {
    if (score >= 80) return '#4CAF50'; // Green for high safety
    if (score >= 60) return '#FF9800'; // Orange for medium safety
    return '#F44336'; // Red for low safety
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={headerStyles.header}>
          <TouchableOpacity 
            style={headerStyles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <ThemedText style={headerStyles.title}>Loading...</ThemedText>
          <View style={headerStyles.rightPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>Loading space details...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {space && (
          <View style={styles.spaceHeaderContainer}>
            <View style={styles.spaceIconContainer}>
              <MaterialIcons name="room" size={32} color="#007AFF" />
            </View>
            <View style={styles.spaceHeaderDetails}>
              <ThemedText style={styles.spaceName}>{space.space_name}</ThemedText>
              <ThemedText style={styles.spaceDescription}>{space.description || 'No description'}</ThemedText>
              <ThemedText style={styles.spaceDate}>Created: {formatDate(space.created_at)}</ThemedText>
            </View>
          </View>
        )}
        
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Safety Assessment History</ThemedText>
        </View>
        
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={60} color="#CCCCCC" />
            <ThemedText style={styles.emptyStateText}>
              No safety assessments have been performed yet.
            </ThemedText>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={handleAddAssessment}
            >
              <ThemedText style={styles.emptyStateButtonText}>Perform First Assessment</ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          logs.map((log) => (
            <TouchableOpacity 
              key={log._id} 
              style={styles.logCard}
              onPress={() => handleLogPress(log)}
            >
              <View style={styles.logHeader}>
                <View style={styles.logDateContainer}>
                  <MaterialIcons name="event" size={16} color="#666666" />
                  <ThemedText style={styles.logDate}>{formatDate(log.created_at)}</ThemedText>
                </View>
                <View style={[styles.scoreBadge, { backgroundColor: getSafetyColor(log.score) }]}>
                  <ThemedText style={styles.scoreText}>{Math.round(log.score)}</ThemedText>
                </View>
              </View>
              
              {log.image_data && (
                <Image 
                  source={{ uri: `data:image/jpeg;base64,${log.image_data}` }}
                  style={styles.logImage}
                  resizeMode="cover"
                />
              )}
              
              <View style={styles.logStats}>
                <View style={styles.statItem}>
                  <MaterialIcons name="warning" size={16} color="#F44336" />
                  <ThemedText style={styles.statText}>
                    {getHazardCount(log)} Hazards
                  </ThemedText>
                </View>
                <View style={styles.statItem}>
                  <MaterialIcons name="lightbulb" size={16} color="#4CAF50" />
                  <ThemedText style={styles.statText}>
                    {log.recommendations.length} Tips
                  </ThemedText>
                </View>
              </View>
              
              {log.recommendations.length > 0 && (
                <View style={styles.recommendationsContainer}>
                  <ThemedText style={styles.recommendationsTitle}>Key Recommendations:</ThemedText>
                  {log.recommendations.slice(0, 2).map((rec, index) => (
                    <View key={index} style={styles.recommendationItem}>
                      <MaterialIcons name="check-circle" size={14} color="#4CAF50" />
                      <ThemedText style={styles.recommendationText}>{rec}</ThemedText>
                    </View>
                  ))}
                  {log.recommendations.length > 2 && (
                    <ThemedText style={styles.moreRecommendations}>
                      +{log.recommendations.length - 2} more...
                    </ThemedText>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      
      {/* Add Assessment FAB */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddAssessment}
      >
        <MaterialIcons name="add-a-photo" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  spaceHeaderContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  spaceIconContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
    alignSelf: 'flex-start',
  },
  spaceHeaderDetails: {
    flex: 1,
  },
  spaceName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  spaceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  spaceDate: {
    fontSize: 12,
    color: '#888',
  },
  sectionHeader: {
    marginBottom: 16,
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
    marginTop: 16,
    marginBottom: 20,
    color: '#666',
    fontSize: 16,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logDate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  scoreBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
  },
  logStats: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  recommendationsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 12,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  recommendationText: {
    fontSize: 14,
    color: '#444',
    marginLeft: 8,
    flex: 1,
  },
  moreRecommendations: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

// Add header styles
const headerStyles = StyleSheet.create({
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rightPlaceholder: {
    width: 40,
  },
}); 