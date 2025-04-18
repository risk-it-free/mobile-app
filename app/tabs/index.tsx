import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, ScrollView, Image, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useAuth } from '../../hooks/useAuth';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { config } from '../../config';

// Define interface for Space
interface Space {
  _id: string;
  space_name: string;
  description: string;
  created_at: string;
}

// Define interface for Patient
interface Patient {
  _id: string;
  patient_name: string;
  patient_condition: string;
  patient_age: number;
  medical_history?: string;
}

export default function HomeScreen() {
  const { user, token } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPatientModalVisible, setIsPatientModalVisible] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientCondition, setPatientCondition] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  
  const API_BASE_URL = config.backendApiUrl;
  
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

  // Fetch patients from API
  const fetchPatients = async () => {
    if (!token || !user) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/patient`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      
      const data = await response.json();
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      Alert.alert('Error', 'Failed to load your patients. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchSpaces();
    fetchPatients();
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

  // Patient management functions
  const handleAddPatient = () => {
    setCurrentPatient(null);
    setPatientName('');
    setPatientCondition('');
    setPatientAge('');
    setMedicalHistory('');
    setIsPatientModalVisible(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setCurrentPatient(patient);
    setPatientName(patient.patient_name);
    setPatientCondition(patient.patient_condition);
    setPatientAge(patient.patient_age.toString());
    setMedicalHistory(patient.medical_history || '');
    setIsPatientModalVisible(true);
  };

  const handleDeletePatient = async (patientId: string) => {
    if (!token) return;
    
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to remove this patient?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_BASE_URL}/patient/${patientId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (!response.ok) {
                throw new Error('Failed to delete patient');
              }
              
              // Refresh patients list
              fetchPatients();
              setIsPatientModalVisible(false);
              Alert.alert('Success', 'Patient removed successfully');
            } catch (error) {
              console.error('Error deleting patient:', error);
              Alert.alert('Error', 'Failed to delete patient. Please try again later.');
            }
          }
        }
      ]
    );
  };

  const handleSavePatient = async () => {
    if (!token || !patientName.trim() || !patientCondition.trim() || !patientAge.trim()) {
      Alert.alert('Error', 'Name, condition and age are required');
      return;
    }

    try {
      const patientData = {
        patient_name: patientName.trim(),
        patient_condition: patientCondition.trim(),
        patient_age: parseInt(patientAge),
        medical_history: medicalHistory.trim() || undefined
      };

      let response;
      
      if (currentPatient) {
        // Update existing patient
        response = await fetch(`${API_BASE_URL}/patient/${currentPatient._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(patientData)
        });
      } else {
        // Create new patient
        response = await fetch(`${API_BASE_URL}/patient`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(patientData)
        });
      }
      
      if (!response.ok) {
        throw new Error('Failed to save patient');
      }
      
      // Close modal and refresh patients list
      setIsPatientModalVisible(false);
      fetchPatients();
      Alert.alert('Success', currentPatient ? 'Patient updated successfully' : 'Patient added successfully');
    } catch (error) {
      console.error('Error saving patient:', error);
      Alert.alert('Error', 'Failed to save patient. Please try again later.');
    }
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
        
        {/* Care Circle Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Your Care Circle</ThemedText>
          </View>

          {patients.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="people" size={50} color="#CCCCCC" />
              <ThemedText style={styles.emptyStateText}>
                You haven't added any patients to your care circle yet.
              </ThemedText>
            </View>
          ) : (
            <View style={styles.patientsList}>
              {patients.map((patient) => (
                <TouchableOpacity 
                  key={patient._id} 
                  style={styles.patientCard}
                  onPress={() => handleEditPatient(patient)}
                >
                  <View style={styles.patientInfo}>
                    <View style={styles.patientIconContainer}>
                      <MaterialIcons name="person" size={24} color="#007AFF" />
                    </View>
                    <View style={styles.patientDetails}>
                      <ThemedText style={styles.patientName}>{patient.patient_name}</ThemedText>
                      <ThemedText style={styles.patientSubInfo}>Age: {patient.patient_age} | Condition: {patient.patient_condition}</ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        
        {/* Emergency Button */}
        {/* <TouchableOpacity style={styles.emergencyButton}>
          <MaterialIcons name="emergency" size={20} color="#fff" />
          <ThemedText style={styles.emergencyButtonText}>Emergency Contact</ThemedText>
        </TouchableOpacity> */}
      </ScrollView>
      
      {/* Add Space FAB */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddSpace}
      >
        <MaterialIcons name="add-home" size={30} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* Add Patient FAB */}
      <TouchableOpacity 
        style={[styles.addButton, styles.addPatientButton]}
        onPress={handleAddPatient}
      >
        <MaterialIcons name="person-add" size={26} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* Patient Modal */}
      <Modal
        visible={isPatientModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsPatientModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {currentPatient ? 'Edit Patient' : 'Add New Patient'}
              </ThemedText>
              <TouchableOpacity onPress={() => setIsPatientModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#999" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Name*</ThemedText>
                <TextInput
                  style={styles.input}
                  value={patientName}
                  onChangeText={setPatientName}
                  placeholder="Enter patient name"
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Condition*</ThemedText>
                <TextInput
                  style={styles.input}
                  value={patientCondition}
                  onChangeText={setPatientCondition}
                  placeholder="Enter patient condition"
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Age*</ThemedText>
                <TextInput
                  style={styles.input}
                  value={patientAge}
                  onChangeText={setPatientAge}
                  placeholder="Enter age"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                />
              </View>
              
              <View style={styles.inputContainer}>
                <ThemedText style={styles.inputLabel}>Medical History</ThemedText>
                <TextInput
                  style={[styles.input, styles.notesInput]}
                  value={medicalHistory}
                  onChangeText={setMedicalHistory}
                  placeholder="Enter medical history"
                  placeholderTextColor="#999"
                  multiline={true}
                  numberOfLines={3}
                />
              </View>
              
              <View style={styles.modalButtonContainer}>
                {currentPatient && (
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeletePatient(currentPatient._id)}
                  >
                    <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={handleSavePatient}
                >
                  <ThemedText style={styles.saveButtonText}>Save Patient</ThemedText>
                </TouchableOpacity>
              </View>
              
              {/* Add padding at the bottom to ensure everything is visible */}
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
  addPatientButton: {
    bottom: 100,
    backgroundColor: '#5AC8FA',
  },
  patientsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 5,
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
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    flex: 1,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
