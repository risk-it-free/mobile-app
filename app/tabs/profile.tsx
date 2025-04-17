import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { useAuth } from '../../hooks/useAuth';
import { IconSymbol } from '../../components/ui/IconSymbol';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Mock user data for profile settings
interface ProfileSectionItem {
  id: string;
  title: string;
  icon: string;
  action: () => void;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  const profileSections: { title: string, data: ProfileSectionItem[] }[] = [
    {
      title: 'Account',
      data: [
        {
          id: 'personal-info',
          title: 'Personal Information',
          icon: 'person.fill',
          action: () => Alert.alert('Personal Information', 'Edit your personal details'),
        },
        {
          id: 'health-info',
          title: 'Health Information',
          icon: 'heart.fill',
          action: () => Alert.alert('Health Information', 'View your health records'),
        },
        {
          id: 'notifications',
          title: 'Notifications',
          icon: 'bell.fill',
          action: () => Alert.alert('Notifications', 'Manage your notification settings'),
        },
      ],
    },
    {
      title: 'Support',
      data: [
        {
          id: 'help',
          title: 'Help & Support',
          icon: 'questionmark.circle.fill',
          action: () => Alert.alert('Help & Support', 'Get assistance with the app'),
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          icon: 'square.and.pencil',
          action: () => Alert.alert('Feedback', 'Share your thoughts with us'),
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          icon: 'lock.fill',
          action: () => Alert.alert('Privacy Policy', 'Read our privacy policy'),
        },
      ],
    },
  ];

  const renderProfileItem = (item: ProfileSectionItem) => (
    <TouchableOpacity key={item.id} style={styles.profileItem} onPress={item.action}>
      <View style={styles.profileItemIcon}>
        <MaterialIcons name={getIconName(item.icon)} size={24} color="#007AFF" />
      </View>
      <View style={styles.profileItemContent}>
        <ThemedText style={styles.profileItemTitle}>{item.title}</ThemedText>
        <MaterialIcons name="chevron-right" size={18} color="#999" />
      </View>
    </TouchableOpacity>
  );

  // Helper function to map icon names to MaterialIcons
  const getIconName = (icon: string): any => {
    const iconMap: Record<string, any> = {
      'person.fill': 'person',
      'heart.fill': 'favorite',
      'bell.fill': 'notifications',
      'questionmark.circle.fill': 'help',
      'square.and.pencil': 'edit',
      'lock.fill': 'lock',
      'chevron.right': 'chevron-right'
    };
    
    return iconMap[icon] || 'circle';
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Profile</ThemedText>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.userInfoContainer}>
          <View style={styles.userAvatar}>
            <ThemedText style={styles.userAvatarText}>
              {user?.firstName?.charAt(0) || 'U'}
            </ThemedText>
          </View>
          <View style={styles.userDetails}>
            <ThemedText style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </ThemedText>
            <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
          </View>
        </View>

        {profileSections.map((section, index) => (
          <View key={section.title} style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
            <View style={styles.sectionItems}>
              {section.data.map(item => renderProfileItem(item))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <ThemedText style={styles.signOutButtonText}>Sign Out</ThemedText>
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
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  userAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userAvatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  sectionItems: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileItemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileItemTitle: {
    fontSize: 16,
  },
  signOutButton: {
    backgroundColor: '#FF3B30',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 