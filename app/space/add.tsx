import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Keyboard, 
  TouchableWithoutFeedback,
  Dimensions
} from 'react-native';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useAuth } from '../../hooks/useAuth';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { config } from '../../config';

// Define Patient interface
interface Patient {
  _id: string;
  patient_name: string;
  patient_condition: string;
  patient_age: number;
  medical_history?: string;
}

export default function AddSpaceScreen() {
  const { user, token } = useAuth();
  const [spaceName, setSpaceName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const { height: windowHeight } = Dimensions.get('window');
  
  const API_BASE_URL = config.backendApiUrl;
  
  // Add keyboard listeners to detect when keyboard appears/disappears
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);
  
  // Fetch all patients
  useEffect(() => {
    const fetchPatients = async () => {
      if (!token) return;
      
      try {
        setLoadingPatients(true);
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
      } catch (error) {
        console.error('Error fetching patients:', error);
        Alert.alert('Error', 'Failed to load patients. Please try again later.');
      } finally {
        setLoadingPatients(false);
      }
    };
    
    fetchPatients();
  }, [token, API_BASE_URL]);
  
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
  
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Handler for when input focus changes
  const handleFocus = (yPosition: number) => {
    // Wait a bit for the keyboard to appear
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: yPosition,
        animated: true
      });
    }, 300);
  };
  
  const handleSubmit = async () => {
    dismissKeyboard();
    
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
          description: description.trim() || undefined,
          patient_ids: selectedPatientIds.length > 0 ? selectedPatientIds : undefined
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          removeClippedSubviews={false}
          bounces={true}
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
                returnKeyType="next"
                onFocus={() => handleFocus(100)}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <ThemedText style={styles.label}>Description (Optional)</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add details about this space..."
                value={description}
                onChangeText={setDescription}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#999"
                onFocus={() => handleFocus(200)}
              />
            </View>
            
            {/* Patient selection section */}
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
              <View style={styles.inputContainer}>
                <ThemedText style={styles.label}>Care Circle</ThemedText>
                <ThemedText style={styles.helpText}>Select members who walk into this space:</ThemedText>
                
                {loadingPatients ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <ThemedText style={styles.loadingText}>Loading members...</ThemedText>
                  </View>
                ) : allPatients.length === 0 ? (
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
                        activeOpacity={0.7}
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
            </TouchableWithoutFeedback>
            
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
            
            {/* Extra space at the bottom to ensure everything is scrollable */}
            <View style={{ height: keyboardHeight > 0 ? keyboardHeight : 100 }} />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginVertical: 20,
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
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
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
    marginBottom: 20,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
  },
  noContentText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
    fontStyle: 'italic',
  },
  patientsSelectionContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 10,
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
}); 