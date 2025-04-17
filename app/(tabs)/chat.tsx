import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { useAuth } from '../../hooks/useAuth';

// Define the chat item type
interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
}

// Mock chat data - replace with actual chat data from API
const mockChats: ChatItem[] = [
  {
    id: '1',
    name: 'Dr. Smith',
    lastMessage: 'How are you feeling today?',
    time: '10:30 AM',
  },
  {
    id: '2',
    name: 'Nurse Johnson',
    lastMessage: 'Remember to take your medication at noon',
    time: 'Yesterday',
  },
  {
    id: '3',
    name: 'Dr. Williams',
    lastMessage: 'Your test results look good!',
    time: 'Monday',
  },
  {
    id: '4',
    name: 'Caregiver Support',
    lastMessage: 'Is there anything you need help with?',
    time: 'Tuesday',
  },
];

export default function ChatScreen() {
  const { user } = useAuth();

  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <View style={styles.chatItem}>
      <View style={styles.avatar}>
        <ThemedText style={styles.avatarText}>{item.name.charAt(0)}</ThemedText>
      </View>
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <ThemedText style={styles.chatName}>{item.name}</ThemedText>
          <ThemedText style={styles.chatTime}>{item.time}</ThemedText>
        </View>
        <ThemedText style={styles.chatMessage} numberOfLines={1}>
          {item.lastMessage}
        </ThemedText>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Messages</ThemedText>
      </View>

      {mockChats.length > 0 ? (
        <FlatList
          data={mockChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No messages yet</ThemedText>
        </View>
      )}
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
  listContainer: {
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  chatName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  chatTime: {
    fontSize: 12,
    color: '#888',
  },
  chatMessage: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
  },
}); 