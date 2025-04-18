import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { ThemedText } from '../../../components/ThemedText';
import { ThemedView } from '../../../components/ThemedView';
import { useAuth } from '../../../hooks/useAuth';
import { useLocalSearchParams, router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { config } from '../../../config';

// Define interface for SpaceLog
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

export default function LogDetailScreen() {
  const { logId } = useLocalSearchParams();
  const { token } = useAuth();
  const [log, setLog] = useState<SpaceLog | null>(null);
  const [loading, setLoading] = useState(true);
  
  const API_BASE_URL = config.backendApiUrl;
  
  useEffect(() => {
    const fetchLogDetails = async () => {
      if (!token || !logId) return;
      
      try {
        setLoading(true);
        
        // Fetch log details
        const logResponse = await fetch(`${API_BASE_URL}/space/logs/${logId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!logResponse.ok) {
          throw new Error('Failed to fetch log details');
        }
        
        const logData = await logResponse.json();
        setLog(logData);
      } catch (error) {
        console.error('Error fetching log details:', error);
        Alert.alert('Error', 'Failed to load assessment details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLogDetails();
  }, [logId, token]);
  
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
  
  // Get safety color based on score
  const getSafetyColor = (score: number) => {
    if (score >= 80) return '#4CAF50'; // Green for high safety
    if (score >= 60) return '#FF9800'; // Orange for medium safety
    return '#F44336'; // Red for low safety
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>Loading assessment details...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!log) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={60} color="#F44336" />
          <ThemedText style={styles.errorText}>Assessment not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* <View style={headerStyles.header}>
        <TouchableOpacity 
          style={headerStyles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <ThemedText style={headerStyles.title}>Assessment Details</ThemedText>
        <View style={headerStyles.rightPlaceholder} />
      </View> */}
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>Safety Assessment</ThemedText>
          <ThemedText style={styles.date}>{formatDate(log.created_at)}</ThemedText>
        </View>
        
        {log.image_data && (
          <Image 
            source={{ uri: `data:image/jpeg;base64,${log.image_data}` }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
        
        <View style={[styles.scoreCard, { backgroundColor: getSafetyColor(log.score) + '20' }]}>
          <View style={styles.scoreHeader}>
            <ThemedText style={styles.scoreTitle}>Safety Score</ThemedText>
            <View style={[styles.scoreBadge, { backgroundColor: getSafetyColor(log.score) }]}>
              <ThemedText style={styles.scoreText}>{Math.round(log.score)}</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.scoreDescription}>
            {log.score >= 80 ? 'This space is generally safe with minimal hazards.' : 
             log.score >= 60 ? 'This space has some safety concerns that should be addressed.' :
             'This space has significant safety hazards that require immediate attention.'}
          </ThemedText>
        </View>
        
        {/* Hazards Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Identified Hazards</ThemedText>
          
          {/* High Priority Hazards */}
          {log.hazard_list.high_priority && log.hazard_list.high_priority.length > 0 && (
            <View style={styles.hazardGroup}>
              <ThemedText style={[styles.hazardPriorityLabel, { color: '#F44336' }]}>
                High Priority
              </ThemedText>
              {log.hazard_list.high_priority.map((hazard, index) => (
                <View key={index} style={styles.hazardItem}>
                  <MaterialIcons name="warning" size={20} color="#F44336" />
                  <ThemedText style={styles.hazardText}>{hazard}</ThemedText>
                </View>
              ))}
            </View>
          )}
          
          {/* Medium Priority Hazards */}
          {log.hazard_list.medium_priority && log.hazard_list.medium_priority.length > 0 && (
            <View style={styles.hazardGroup}>
              <ThemedText style={[styles.hazardPriorityLabel, { color: '#FF9800' }]}>
                Medium Priority
              </ThemedText>
              {log.hazard_list.medium_priority.map((hazard, index) => (
                <View key={index} style={styles.hazardItem}>
                  <MaterialIcons name="warning" size={20} color="#FF9800" />
                  <ThemedText style={styles.hazardText}>{hazard}</ThemedText>
                </View>
              ))}
            </View>
          )}
          
          {/* Low Priority Hazards */}
          {log.hazard_list.low_priority && log.hazard_list.low_priority.length > 0 && (
            <View style={styles.hazardGroup}>
              <ThemedText style={[styles.hazardPriorityLabel, { color: '#8BC34A' }]}>
                Low Priority
              </ThemedText>
              {log.hazard_list.low_priority.map((hazard, index) => (
                <View key={index} style={styles.hazardItem}>
                  <MaterialIcons name="info" size={20} color="#8BC34A" />
                  <ThemedText style={styles.hazardText}>{hazard}</ThemedText>
                </View>
              ))}
            </View>
          )}
          
          {/* No hazards message */}
          {(!log.hazard_list.high_priority || log.hazard_list.high_priority.length === 0) &&
           (!log.hazard_list.medium_priority || log.hazard_list.medium_priority.length === 0) &&
           (!log.hazard_list.low_priority || log.hazard_list.low_priority.length === 0) && (
            <ThemedText style={styles.noHazardsText}>
              No hazards were identified in this space.
            </ThemedText>
           )}
        </View>
        
        {/* Recommendations Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Recommendations</ThemedText>
          
          {log.recommendations && log.recommendations.length > 0 ? (
            log.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <MaterialIcons name="lightbulb" size={20} color="#4CAF50" />
                <ThemedText style={styles.recommendationText}>{recommendation}</ThemedText>
              </View>
            ))
          ) : (
            <ThemedText style={styles.noRecommendationsText}>
              No specific recommendations at this time.
            </ThemedText>
          )}
        </View>
        
        {/* Comments Section */}
        {log.comments && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Notes</ThemedText>
            <View style={styles.commentsCard}>
              <ThemedText style={styles.commentsText}>{log.comments}</ThemedText>
            </View>
          </View>
        )}
        
        {/* Metadata Section */}
        <View style={styles.metadataContainer}>
          <ThemedText style={styles.metadataText}>
            Analyzed by: {log.metadata?.analyzed_by || 'AI Model'}
          </ThemedText>
          <ThemedText style={styles.metadataText}>
            Processing time: {log.metadata?.processing_time || 'N/A'}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  scoreCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  hazardGroup: {
    marginBottom: 16,
  },
  hazardPriorityLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  hazardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  hazardText: {
    fontSize: 15,
    marginLeft: 10,
    flex: 1,
  },
  noHazardsText: {
    fontSize: 15,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
  },
  recommendationText: {
    fontSize: 15,
    marginLeft: 10,
    flex: 1,
  },
  noRecommendationsText: {
    fontSize: 15,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  commentsCard: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
  },
  commentsText: {
    fontSize: 15,
    lineHeight: 22,
  },
  metadataContainer: {
    marginTop: 8,
    marginBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 16,
  },
  metadataText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
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