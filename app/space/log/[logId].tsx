import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, Animated, ToastAndroid, Platform, Modal } from 'react-native';
import { ThemedText } from '../../../components/ThemedText';
import { ThemedView } from '../../../components/ThemedView';
import { useAuth } from '../../../hooks/useAuth';
import { useLocalSearchParams, router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { config } from '../../../config';
import * as Speech from 'expo-speech';
import ImageViewer from 'react-native-image-zoom-viewer';

// Define interface for SpaceLog
interface SpaceLog {
  _id: string;
  space_id: string;
  image_data: string;
  image_bb: string;
  score: number;
  bounding_box_info: any;
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [preparingSpeech, setPreparingSpeech] = useState(false);
  const speakerPulse = React.useRef(new Animated.Value(1)).current;
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  
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

  // Generate summary text for speech
  const generateSpeechSummary = (log: SpaceLog) => {
    if (!log) return '';
    
    // let summary = `Safety assessment from ${formatDate(log.created_at)}. `;
    
    // Add safety score
    let summary = `The safety score is ${Math.round(log.score)} out of 100, where higher scores mean better safety. `;
    
    // Add safety assessment
    if (log.score >= 80) {
      summary += 'This space is generally safe with minimal hazards. ';
    } else if (log.score >= 60) {
      summary += 'This space has some safety concerns that should be addressed. ';
    } else {
      summary += 'This space has significant safety hazards that require immediate attention. ';
    }
    
    // Add hazards
    const highPriorityHazards = log.hazard_list.high_priority || [];
    const mediumPriorityHazards = log.hazard_list.medium_priority || [];
    const lowPriorityHazards = log.hazard_list.low_priority || [];
    
    if (highPriorityHazards.length > 0) {
      summary += `High priority hazards include: ${highPriorityHazards.join(', ')}. `;
    }
    
    if (mediumPriorityHazards.length > 0) {
      summary += `Medium priority hazards include: ${mediumPriorityHazards.join(', ')}. `;
    }
    
    if (lowPriorityHazards.length > 0) {
      summary += `Low priority hazards include: ${lowPriorityHazards.join(', ')}. `;
    }
    
    if (highPriorityHazards.length === 0 && mediumPriorityHazards.length === 0 && lowPriorityHazards.length === 0) {
      summary += 'No hazards were identified in this space. ';
    }
    
    // Add recommendations
    if (log.recommendations && log.recommendations.length > 0) {
      summary += `Recommendations: ${log.recommendations.join(', ')}. `;
    }
    
    // Add comments if available
    if (log.comments) {
      summary += `Notes: ${log.comments}. `;
    }
    
    return summary;
  };
  
  // Show toast message
  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // For iOS, we use a custom toast-like UI
      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
      }
      setToastMessage(message);
      setToastVisible(true);
      
      toastTimeout.current = setTimeout(() => {
        setToastVisible(false);
      }, 2000);
    }
  };
  
  // Cancel any existing speech
  const stopSpeaking = () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      
      // Reset animation
      Animated.timing(speakerPulse, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  };
  
  // Handle component unmount or navigation
  useEffect(() => {
    return () => {
      stopSpeaking();
      
      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
      }
    };
  }, []);
  
  // Handle speech
  const handleSpeak = () => {
    if (!log) return;
    
    if (isSpeaking) {
      stopSpeaking();
      showToast('Speech stopped');
    } else {
      setPreparingSpeech(true);
      const speechText = generateSpeechSummary(log);
      
      // Check if speech is available
      Speech.isSpeakingAsync()
        .then(isSpeaking => {
          if (isSpeaking) {
            Speech.stop();
          }
          
          setIsSpeaking(true);
          setPreparingSpeech(false);
          showToast('Reading safety assessment...');
          
          // Start pulse animation
          const pulseAnimation = Animated.loop(
            Animated.sequence([
              Animated.timing(speakerPulse, {
                toValue: 1.2,
                duration: 800,
                useNativeDriver: true
              }),
              Animated.timing(speakerPulse, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true
              })
            ])
          );
          
          pulseAnimation.start();
          
          Speech.speak(speechText, {
            language: 'en',
            rate: 0.9,
            onDone: () => {
              setIsSpeaking(false);
              showToast('Finished reading');
              pulseAnimation.stop();
              Animated.timing(speakerPulse, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true
              }).start();
            },
            onError: (error) => {
              setIsSpeaking(false);
              setPreparingSpeech(false);
              showToast('Error reading assessment');
              pulseAnimation.stop();
              Animated.timing(speakerPulse, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true
              }).start();
              console.error('Speech error:', error);
            }
          });
        })
        .catch(error => {
          setPreparingSpeech(false);
          showToast('Error initializing speech');
          console.error('Speech initialization error:', error);
        });
    }
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
      {/* iOS custom toast */}
      {Platform.OS === 'ios' && toastVisible && (
        <View style={styles.iosToast}>
          <ThemedText style={styles.iosToastText}>{toastMessage}</ThemedText>
        </View>
      )}
      
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
          {/* <ThemedText style={styles.title}>Safety Assessment</ThemedText> */}
          <View style={styles.dateContainer}>
            <ThemedText style={styles.date}>{formatDate(log.created_at)}</ThemedText>
            <View style={styles.speakerContainer}>
              <TouchableOpacity 
                style={[styles.speakerButton, isSpeaking && styles.speakerButtonActive]} 
                onPress={handleSpeak}
                activeOpacity={0.7}
                disabled={preparingSpeech}
                accessibilityLabel={isSpeaking ? "Stop reading assessment" : "Read assessment aloud"}
                accessibilityRole="button"
                accessibilityState={{ busy: preparingSpeech, selected: isSpeaking }}
                accessibilityHint="Double tap to have the safety assessment read aloud"
              >
                {preparingSpeech ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                  <Animated.View style={{ transform: [{ scale: speakerPulse }] }}>
                    <MaterialIcons 
                      name={isSpeaking ? "volume-up" : "volume-off"} 
                      size={24} 
                      color={isSpeaking ? "#4CAF50" : "#007AFF"} 
                    />
                  </Animated.View>
                )}
              </TouchableOpacity>
              {!isSpeaking && !preparingSpeech && (
                <ThemedText style={styles.speakerHint}>Listen</ThemedText>
              )}
            </View>
          </View>
        </View>
        
        {log.image_bb && (
          <>
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => setImageViewerVisible(true)}
              accessibilityLabel="Safety assessment image, tap to zoom"
              accessibilityHint="Opens a fullscreen view where you can zoom and pan the image"
            >
              <Image 
                source={{ uri: log.image_bb }}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.zoomHintContainer}>
                <MaterialIcons name="zoom-in" size={20} color="#FFFFFF" />
                <ThemedText style={styles.zoomHintText}>Tap to zoom</ThemedText>
              </View>
            </TouchableOpacity>

            <Modal visible={imageViewerVisible} transparent={true} onRequestClose={() => setImageViewerVisible(false)}>
              <ImageViewer
                imageUrls={[{ url: log.image_bb }]}
                enableSwipeDown={true}
                onSwipeDown={() => setImageViewerVisible(false)}
                onClick={() => setImageViewerVisible(false)}
                // renderIndicator={() => null}
                backgroundColor="rgba(0, 0, 0, 0.9)"
                renderHeader={() => (
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setImageViewerVisible(false)}
                  >
                    <MaterialIcons name="close" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              />
            </Modal>
          </>
        )}
        
        <View style={[styles.scoreCard, { backgroundColor: getSafetyColor(log.score) + '20' }]}>
          <View style={styles.scoreHeader}>
            <View style={styles.scoreTitleContainer}>
              <ThemedText style={styles.scoreTitle}>Safety Score</ThemedText>
              <ThemedText style={styles.scoreScale}>(Higher is safer)</ThemedText>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: getSafetyColor(log.score) }]}>
              <ThemedText style={styles.scoreText}>{Math.round(log.score)}</ThemedText>
            </View>
          </View>

          <View style={styles.scoreRangeContainer}>
            <View style={styles.scoreRangeBar}>
              <View style={[styles.scoreRangeFill, { width: `${log.score}%`, backgroundColor: getSafetyColor(log.score) }]} />
            </View>
            <View style={styles.scoreRangeLabels}>
              <ThemedText style={styles.scoreRangeLabel}>0</ThemedText>
              <ThemedText style={[styles.scoreRangeLabel, styles.scoreRangeLabelBold]}>
                {log.score >= 80 ? 'Safe' : log.score >= 60 ? 'Caution' : 'Unsafe'}
              </ThemedText>
              <ThemedText style={styles.scoreRangeLabel}>100</ThemedText>
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
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  speakerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  speakerButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  speakerHint: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
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
  scoreTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreScale: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
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
  scoreRangeContainer: {
    marginBottom: 16,
  },
  scoreRangeBar: {
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
  },
  scoreRangeFill: {
    height: '100%',
    borderRadius: 10,
  },
  scoreRangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  scoreRangeLabel: {
    fontSize: 12,
    color: '#666',
  },
  scoreRangeLabelBold: {
    fontWeight: 'bold',
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
  iosToast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    padding: 10,
    zIndex: 1000,
    alignItems: 'center',
  },
  iosToastText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  zoomHintContainer: {
    position: 'absolute',
    bottom: 24,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  zoomHintText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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