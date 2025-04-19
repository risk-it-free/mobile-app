import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
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
  patient_ids?: string[];
  created_at: string;
  updated_at: string;
}

interface Patient {
  _id: string;
  patient_name: string;
  patient_condition: string;
  patient_age: number;
  medical_history?: string;
}

interface SpaceLog {
  _id: string;
  space_id: string;
  image_data: string;
  image_bb: string;
  score: number;
  bounding_box_info: any;
  recommendations: string[];
  hazard_list: any;
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
  const [refreshing, setRefreshing] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [spaceName, setSpaceName] = useState('');
  const [spaceDescription, setSpaceDescription] = useState('');
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [spacePatients, setSpacePatients] = useState<Patient[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  
  const API_BASE_URL = config.backendApiUrl;
  
  // Fetch all patients and filter based on provided space data
  const fetchPatients = useCallback(async (spaceData?: Space) => {
    if (!token) return;
    
    try {
      // Fetch all patients
      const allPatientsResponse = await fetch(`${API_BASE_URL}/patient`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!allPatientsResponse.ok) {
        throw new Error('Failed to fetch patients');
      }
      
      const allPatientsData = await allPatientsResponse.json();
      setAllPatients(allPatientsData);
      
      // Use the passed spaceData if available, otherwise use the state
      const currentSpace = spaceData || space;
      
      // Filter space patients if we have space data
      if (currentSpace && currentSpace.patient_ids && currentSpace.patient_ids.length > 0) {
        const spacePatientsList = allPatientsData.filter((patient: Patient) => 
          currentSpace.patient_ids?.includes(patient._id)
        );
        setSpacePatients(spacePatientsList);
      } else {
        setSpacePatients([]);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      Alert.alert('Error', 'Failed to load patients. Please try again later.');
    }
  }, [token, API_BASE_URL]); // Removed 'space' from the dependency array to break the circular dependency
  
  const fetchSpaceDetails = useCallback(async () => {
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
      spaceData.id = id;
      setSpace(spaceData);
      setSpaceName(spaceData.space_name);
      setSpaceDescription(spaceData.description || '');
      setSelectedPatientIds(spaceData.patient_ids || []);
      
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
      
      // Fetch patients with the newly fetched space data
      await fetchPatients(spaceData);
    } catch (error) {
      console.error('Error fetching space details:', error);
      Alert.alert('Error', 'Failed to load space details. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, token, API_BASE_URL, fetchPatients]);
  
  // Only fetch space details once on component mount
  useEffect(() => {
    fetchSpaceDetails();
  }, [fetchSpaceDetails]);
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSpaceDetails();
  }, [fetchSpaceDetails]);
  
  const handleEditSpace = () => {
    if (space) {
      // Update form values
      setSpaceName(space.space_name);
      setSpaceDescription(space.description || '');
      setSelectedPatientIds(space.patient_ids || []);
      
      // No need to fetch patients again here, we can use the already fetched data
      // This was causing additional re-renders
      setIsEditModalVisible(true);
    }
  };
  
  const handleSaveSpace = async () => {
    if (!token || !id || !spaceName.trim()) {
      Alert.alert('Error', 'Space name is required');
      return;
    }
    
    try {
      const spaceData = {
        space_name: spaceName.trim(),
        description: spaceDescription.trim() || undefined,
        patient_ids: selectedPatientIds
      };
      
      const response = await fetch(`${API_BASE_URL}/space/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(spaceData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update space');
      }
      
      // Close modal and refresh space details
      setIsEditModalVisible(false);
      fetchSpaceDetails();
      Alert.alert('Success', 'Space updated successfully');
    } catch (error) {
      console.error('Error updating space:', error);
      Alert.alert('Error', 'Failed to update space. Please try again later.');
    }
  };
  
  const handleDeleteSpace = async () => {
    if (!token || !id) {
      Alert.alert('Error', 'Authorization required');
      return;
    }
    
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this space? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/space/${id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (!response.ok) {
                throw new Error('Failed to delete space');
              }
              
              // Close modal and navigate back to main page
              setIsEditModalVisible(false);
              router.replace('/tabs');
              Alert.alert('Success', 'Space deleted successfully');
            } catch (error) {
              console.error('Error deleting space:', error);
              Alert.alert('Error', 'Failed to delete space. Please try again later.');
            }
          }
        }
      ]
    );
  };
  
  const togglePatientSelection = (patientId: string) => {
    setSelectedPatientIds(prevSelected => {
      if (prevSelected.includes(patientId)) {
        return prevSelected.filter(id => id !== patientId);
      } else {
        return [...prevSelected, patientId];
      }
    });
  };
  
  const isPatientSelected = (patientId: string) => {
    return selectedPatientIds.includes(patientId);
  };
  
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

  if (loading && !refreshing) {
    return (
      <ThemedView style={styles.container}>
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {space && (
          <View style={styles.spaceHeaderContainer}>
            <View style={styles.spaceIconContainer}>
              <MaterialIcons name="room" size={32} color="#007AFF" />
            </View>
            <View style={styles.spaceHeaderDetails}>
              <View style={styles.spaceNameRow}>
                <ThemedText style={styles.spaceName}>{space.space_name}</ThemedText>
                <TouchableOpacity onPress={handleEditSpace}>
                  <MaterialIcons name="edit" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
              <ThemedText style={styles.spaceDescription}>{space.description || 'No description'}</ThemedText>
              <ThemedText style={styles.spaceDate}>Created: {formatDate(space.created_at)}</ThemedText>
              
              {/* Display patient names in the space card */}
              {spacePatients.length > 0 && (
                <View style={styles.spacePatientContainer}>
                  <View style={styles.spacePatientHeader}>
                    <MaterialIcons name="people" size={14} color="#007AFF" />
                    <ThemedText style={styles.spacePatientLabel}>
                      Members: {spacePatients.length}
                    </ThemedText>
                  </View>
                  <View style={styles.spacePatientList}>
                    {spacePatients.map((patient, index) => (
                      <View key={patient._id} style={styles.spacePatientBadge}>
                        <ThemedText style={styles.spacePatientName}>
                          {patient.patient_name}
                          {index < spacePatients.length - 1 ? ", " : ""}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
        
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Safety Assessment History</ThemedText>
          <TouchableOpacity onPress={onRefresh}>
            <MaterialIcons name="refresh" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.scoreLegend}>
          <ThemedText style={styles.scoreLegendText}>Safety Score: </ThemedText>
          <View style={styles.scoreLegendItem}>
            <View style={[styles.scoreLegendDot, { backgroundColor: '#4CAF50' }]} />
            <ThemedText style={styles.scoreLegendItemText}>80-100 (Safe)</ThemedText>
          </View>
          <View style={styles.scoreLegendItem}>
            <View style={[styles.scoreLegendDot, { backgroundColor: '#FF9800' }]} />
            <ThemedText style={styles.scoreLegendItemText}>60-79 (Caution)</ThemedText>
          </View>
          <View style={styles.scoreLegendItem}>
            <View style={[styles.scoreLegendDot, { backgroundColor: '#F44336' }]} />
            <ThemedText style={styles.scoreLegendItemText}>0-59 (Unsafe)</ThemedText>
          </View>
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
                <View style={styles.scoreContainer}>
                  <View style={styles.scoreLabel}>
                    <MaterialIcons name="verified" size={16} color={getSafetyColor(log.score)} />
                    <ThemedText style={[styles.scoreHint, {color: getSafetyColor(log.score)}]}>
                      {log.score >= 80 ? 'Safe' : log.score >= 60 ? 'Caution' : 'Unsafe'}
                    </ThemedText>
                  </View>
                  <View style={[styles.scoreBadge, { backgroundColor: getSafetyColor(log.score) }]}>
                    <ThemedText style={styles.scoreText}>{Math.round(log.score)}</ThemedText>
                  </View>
                </View>
              </View>
              
              {log.image_data && (
                <Image 
                  source={{ uri: log.image_bb }}
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
      
      {/* Edit Space Modal with integrated patient management */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Edit Space</ThemedText>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Name*</ThemedText>
                <TextInput
                  style={styles.input}
                  value={spaceName}
                  onChangeText={setSpaceName}
                  placeholder="Enter space name"
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Description</ThemedText>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  value={spaceDescription}
                  onChangeText={setSpaceDescription}
                  placeholder="Enter space description"
                  placeholderTextColor="#999"
                  multiline={true}
                  numberOfLines={3}
                />
              </View>
              
              {/* Patient selection section */}
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Care Circle</ThemedText>
                <ThemedText style={styles.inputHelpText}>Select members who walk into this space:</ThemedText>
                
                {allPatients.length === 0 ? (
                  <ThemedText style={styles.noContentText}>No members available</ThemedText>
                ) : (
                  <View style={styles.patientsSelectionContainer}>
                    {allPatients.map((patient) => (
                      <TouchableOpacity 
                        key={patient._id} 
                        style={[
                          styles.patientSelectCard,
                          isPatientSelected(patient._id) && styles.patientSelectCardActive
                        ]}
                        onPress={() => togglePatientSelection(patient._id)}
                      >
                        <View style={styles.patientSelectInfo}>
                          <MaterialIcons 
                            name="person" 
                            size={20} 
                            color={isPatientSelected(patient._id) ? "#FFFFFF" : "#666666"} 
                          />
                          <ThemedText 
                            style={[
                              styles.patientSelectName,
                              isPatientSelected(patient._id) && styles.patientSelectNameActive
                            ]}
                          >
                            {patient.patient_name}
                          </ThemedText>
                        </View>
                        <MaterialIcons 
                          name={isPatientSelected(patient._id) ? "check-circle" : "radio-button-unchecked"} 
                          size={22} 
                          color={isPatientSelected(patient._id) ? "#FFFFFF" : "#CCCCCC"} 
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={handleDeleteSpace}
                >
                  <ThemedText style={styles.deleteButtonText}>Delete Space</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSaveSpace}
                >
                  <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBottomPadding}></View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  spaceNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  spaceName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  spaceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  spaceDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  spacePatientContainer: {
    marginTop: 4,
  },
  spacePatientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  spacePatientLabel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  spacePatientList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  spacePatientBadge: {
    marginRight: 2,
  },
  spacePatientName: {
    fontSize: 12,
    color: '#555',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginBottom: 20,
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
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  scoreHint: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold',
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
  patientsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 5,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patientIconContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  patientSubInfo: {
    fontSize: 12,
    color: '#666',
  },
  deleteIcon: {
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalScrollContent: {
    flexGrow: 0,
  },
  modalBottomPadding: {
    height: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
    fontWeight: 'bold',
  },
  inputHelpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  patientsSelectionContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    padding: 10,
    marginBottom: 10,
  },
  patientSelectCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  patientSelectCardActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  patientSelectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientSelectName: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  patientSelectNameActive: {
    color: '#FFFFFF',
  },
  noContentText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
    fontStyle: 'italic',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginTop: 20,
  },
  saveButton: {
    width: '45%',
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    width: '45%',
    backgroundColor: '#dc3545',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scoreLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  scoreLegendText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 6,
  },
  scoreLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  scoreLegendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  scoreLegendItemText: {
    fontSize: 12,
    color: '#666',
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