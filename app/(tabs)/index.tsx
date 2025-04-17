import React from 'react';
import { StyleSheet, TouchableOpacity, View, Image, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemedText } from '../../components/ThemedText';
import { ThemedView } from '../../components/ThemedView';
import { useAuth } from '../../hooks/useAuth';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Define valid icon types
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

// Mock data for health metrics
const healthMetrics = [
  {
    id: 'steps',
    title: 'Daily Steps',
    value: '2,456',
    icon: 'directions-walk' as MaterialIconName,
    color: '#4CAF50',
  },
  {
    id: 'heart',
    title: 'Heart Rate',
    value: '72 bpm',
    icon: 'favorite' as MaterialIconName,
    color: '#F44336',
  },
  {
    id: 'sleep',
    title: 'Sleep',
    value: '7.5 hrs',
    icon: 'nightlight' as MaterialIconName,
    color: '#673AB7',
  },
];

// Mock data for upcoming appointments
const appointments = [
  {
    id: '1',
    doctorName: 'Dr. Smith',
    specialty: 'Cardiologist',
    date: 'Mon, Oct 10',
    time: '10:30 AM',
  },
  {
    id: '2',
    doctorName: 'Dr. Johnson',
    specialty: 'Physical Therapist',
    date: 'Wed, Oct 12',
    time: '2:00 PM',
  },
];

// Mock data for medications
const medications = [
  {
    id: '1',
    name: 'Lisinopril',
    dosage: '10mg',
    schedule: 'Daily, 8:00 AM',
    remaining: '15 pills',
  },
  {
    id: '2',
    name: 'Metformin',
    dosage: '500mg',
    schedule: 'Twice daily',
    remaining: '22 pills',
  },
  {
    id: '3',
    name: 'Vitamin D',
    dosage: '1000 IU',
    schedule: 'Daily, with meal',
    remaining: '30 pills',
  },
];

export default function HomeScreen() {
  const { user } = useAuth();
  
  const greeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 18) return 'Good Afternoon';
    return 'Good Evening';
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
        <View style={styles.metricsContainer}>
          {healthMetrics.map((metric) => (
            <TouchableOpacity key={metric.id} style={styles.metricCard}>
              <View style={[styles.metricIconContainer, { backgroundColor: `${metric.color}20` }]}>
                <MaterialIcons name={metric.icon} size={24} color={metric.color} />
              </View>
              <ThemedText style={styles.metricValue}>{metric.value}</ThemedText>
              <ThemedText style={styles.metricTitle}>{metric.title}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Upcoming Appointments</ThemedText>
            <TouchableOpacity>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
            </TouchableOpacity>
          </View>

          {appointments.map((appointment) => (
            <TouchableOpacity key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentIconContainer}>
                <MaterialIcons name="event" size={24} color="#007AFF" />
              </View>
              <View style={styles.appointmentDetails}>
                <ThemedText style={styles.doctorName}>{appointment.doctorName}</ThemedText>
                <ThemedText style={styles.appointmentInfo}>{appointment.specialty}</ThemedText>
                <ThemedText style={styles.appointmentInfo}>
                  {appointment.date} • {appointment.time}
                </ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Medications</ThemedText>
            <TouchableOpacity>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
            </TouchableOpacity>
          </View>

          {medications.map((medication) => (
            <TouchableOpacity key={medication.id} style={styles.medicationCard}>
              <View style={styles.medicationIconContainer}>
                <MaterialIcons name="medication" size={24} color="#FF9800" />
              </View>
              <View style={styles.medicationDetails}>
                <ThemedText style={styles.medicationName}>
                  {medication.name} • {medication.dosage}
                </ThemedText>
                <ThemedText style={styles.medicationInfo}>{medication.schedule}</ThemedText>
                <ThemedText style={styles.medicationInfo}>Remaining: {medication.remaining}</ThemedText>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.emergencyButton}>
          <MaterialIcons name="emergency" size={20} color="#fff" />
          <ThemedText style={styles.emergencyButtonText}>Emergency Contact</ThemedText>
        </TouchableOpacity>
      </ScrollView>
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
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  metricCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    width: '31%',
    alignItems: 'center',
  },
  metricIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
  seeAllText: {
    color: '#007AFF',
    fontSize: 14,
  },
  appointmentCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    marginBottom: 10,
  },
  appointmentIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  appointmentDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appointmentInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  medicationCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    marginBottom: 10,
  },
  medicationIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  medicationDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  medicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  medicationInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  emergencyButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    borderRadius: 25,
    marginTop: 10,
    marginBottom: 20,
  },
  emergencyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
