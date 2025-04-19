import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GiftedChat, IMessage, Send } from 'react-native-gifted-chat';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { useAuth } from '../../hooks/useAuth';
import { config } from '../../config';
import * as SecureStore from 'expo-secure-store';
export default function ChatScreen() {
  const { user, token } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageHistory, setMessageHistory] = useState<any>([]);

  const API_BASE_URL = config.backendApiUrl;


  useEffect(() => {
    // Check for existing token on startup
    const loadToken = async () => {
      try {
        const storedUser = await SecureStore.getItemAsync('userData');
        
        if (storedUser) {
          setUserData(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load auth token', error);
      } finally {
        setLoading(false);
      }
    };

    loadToken();
  }, []);

  useEffect(() => {
    // Initialize with a welcome message
    setMessages([
      {
        _id: 1,
        text: 'Hello! How can I assist you today?',
        createdAt: new Date(),
        user: {
          _id: 'agent',
          name: 'AI Assistant',
          avatar: 'https://placehold.co/100x100/blue/white?text=AI',
        },
      },
    ]);
  }, []);

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    // First, update UI with the user's message
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, newMessages),
    );

    // Then, send the message to the API and get a response
    try {
      setLoading(true);
      
      // Get the text from the last message
      const userMessage = newMessages[0].text;
      
      // Make the API call
      console.log('HISTORY: ', messageHistory);
      let queryMessage: any = {
        query: userMessage,
        user_id: userData?.id,
        history: messageHistory,
      };
      if (messageHistory.length == 0) {
        queryMessage.history = [];
      }
      console.log('QUERY MESSAGE: ', JSON.stringify(queryMessage));
      console.log('userMessage', JSON.stringify({
        query: userMessage,
        user_id: userData?.id,
        history: messageHistory,
      }));
      const response = await fetch(`${API_BASE_URL}/simple_agent/simple_conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          query: userMessage,
          user_id: userData?.id,
          history: messageHistory,
        })
      });

      const data = await response.json();

      // Add the agent's response to the messages
      if (response.ok && data.response) {
        setMessageHistory(data.history);
        const agentMessage: IMessage = {
          _id: Math.random().toString(),
          text: data.response,
          createdAt: new Date(),
          user: {
            _id: 'agent',
            name: 'AI Assistant',
            avatar: 'https://placehold.co/100x100/blue/white?text=AI',
          },
        };

        setMessages(previousMessages =>
          GiftedChat.append(previousMessages, [agentMessage]),
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add an error message
      const errorMessage: IMessage = {
        _id: Math.random().toString(),
        text: 'Sorry, there was an error processing your request. Please try again.',
        createdAt: new Date(),
        user: {
          _id: 'agent',
          name: 'AI Assistant',
          avatar: 'https://placehold.co/100x100/blue/white?text=AI',
        },
      };

      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, [errorMessage]),
      );
    } finally {
      setLoading(false);
    }
  }, [messages, user, token, API_BASE_URL]);

  // Custom render for the Send button
  const renderSend = (props: any) => {
    return (
      <Send {...props} containerStyle={styles.sendContainer}>
        <View style={styles.sendButton}>
          <ThemedText style={styles.sendButtonText}>Send</ThemedText>
        </View>
      </Send>
    );
  };

  // Custom render for loading indicator
  const renderFooter = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      );
    }
    return null;
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>AI Assistant</ThemedText>
      </View>

      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{
          _id: user?.id || '1', // Use the authenticated user's ID or a default
          name: user ? `${user.firstName} ${user.lastName}` : 'You', // Using firstName and lastName from the User interface
        }}
        renderSend={renderSend}
        renderFooter={renderFooter}
        listViewProps={{
          scrollEnabled: true,
          keyboardShouldPersistTaps: "handled"
        }}
        keyboardShouldPersistTaps="handled"
        messagesContainerStyle={styles.messagesContainer}
        renderUsernameOnMessage
        alwaysShowSend
        scrollToBottom
        inverted={true}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    padding: 10,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 10,
    alignItems: 'center',
  },
  messagesContainer: {
    // Add any necessary styles for the messages container
  },
}); 