import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Text, Animated, ToastAndroid, Platform, KeyboardAvoidingView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GiftedChat, IMessage, Send, Bubble, MessageText } from 'react-native-gifted-chat';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { useAuth } from '../../hooks/useAuth';
import { config } from '../../config';
import * as SecureStore from 'expo-secure-store';
import * as Speech from 'expo-speech';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

// Array of suggestion prompts for risk assessment of living spaces
const RISK_ASSESSMENT_SUGGESTIONS = [
  "How can I assess flood risks in my neighborhood?",
  "What are the key fire hazards to check in my home?",
  "How do I check for structural issues in an old building?",
  "What should I look for in a home safety inspection?",
  "Are there tools to monitor air quality in my apartment?",
  "How can I childproof my home effectively?",
];

export default function ChatScreen() {
  const { user, token } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageHistory, setMessageHistory] = useState<any>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  // Text-to-speech state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [preparingSpeech, setPreparingSpeech] = useState(false);
  const speakerPulse = useRef(new Animated.Value(1)).current;
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);

  const API_BASE_URL = config.backendApiUrl;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        Speech.stop();
      }
      
      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
      }
    };
  }, [isSpeaking]);

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
        text: 'Hello! How can I assist you today with risk assessment for your living space?',
        createdAt: new Date(),
        user: {
          _id: 'agent',
          name: 'AI Assistant',
          avatar: 'https://placehold.co/100x100/blue/white?text=AI',
        },
      },
    ]);
  }, []);

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
  const stopSpeech = async () => {
    if (isSpeaking) {
      await Speech.stop();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      
      // Reset animation
      Animated.timing(speakerPulse, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
  };

  // Start or stop text-to-speech for a message
  const toggleSpeech = async (text: string, messageId: string) => {
    // If we're already speaking this message, stop it
    if (isSpeaking && speakingMessageId === messageId) {
      await stopSpeech();
      showToast('Speech stopped');
      return;
    }
    
    // If we're speaking a different message, stop that first
    if (isSpeaking) {
      await stopSpeech();
    }
    
    // Start speaking the new message
    setPreparingSpeech(true);
    setSpeakingMessageId(messageId);
    
    try {
      // Clean the text for TTS (remove markdown, etc.)
      const cleanText = text
        // Remove formatting markers
        .replace(/\*\*/g, '') // Remove bold markers
        .replace(/•/g, ', ') // Replace bullet points with pauses
        .replace(/<[^>]*>/g, '') // Remove any HTML-like tags
        
        // Add pauses for better speech cadence
        .replace(/\.\s+/g, '. [pause] ') // Add pause after periods
        .replace(/\:\s+/g, ': [pause] ') // Add pause after colons
        .replace(/\?\s+/g, '? [pause] ') // Add pause after question marks
        
        // Replace special characters that may cause issues
        .replace(/&/g, ' and ')
        .replace(/(\d+)\.(\d+)/g, '$1 point $2') // Replace decimal points (e.g., 72.0 -> 72 point 0)
        
        // Fix common abbreviations
        .replace(/vs\./g, 'versus')
        .replace(/etc\./g, 'etcetera')
        
        // Remove excess spacing
        .replace(/\s+/g, ' ')
        .trim();
      
      // Check if speech is available
      const isSpeakingNow = await Speech.isSpeakingAsync();
      if (isSpeakingNow) {
        await Speech.stop();
      }
      
      setIsSpeaking(true);
      setPreparingSpeech(false);
      showToast('Reading message...');
      
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
      
      // Start speaking
      Speech.speak(cleanText, {
        language: 'en',
        rate: 0.9,
        pitch: 1.0,
        onDone: () => {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
          showToast('Finished reading');
          // Stop and reset animation
          pulseAnimation.stop();
          Animated.timing(speakerPulse, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }).start();
        },
        onError: () => {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
          setPreparingSpeech(false);
          showToast('Error reading message');
          // Stop and reset animation
          pulseAnimation.stop();
          Animated.timing(speakerPulse, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }).start();
        }
      });
    } catch (error) {
      console.error('Speech error:', error);
      setPreparingSpeech(false);
      setSpeakingMessageId(null);
      showToast('Error initializing speech');
    }
  };

  const startNewConversation = () => {
    // Stop any active speech
    stopSpeech();
    
    // Clear message history
    setMessageHistory([]);
    
    // Reset messages with a welcome message
    setMessages([
      {
        _id: Math.random().toString(),
        text: 'Hello! How can I assist you today with risk assessment for your living space?',
        createdAt: new Date(),
        user: {
          _id: 'agent',
          name: 'AI Assistant',
          avatar: 'https://placehold.co/100x100/blue/white?text=AI',
        },
      },
    ]);
    
    // Show suggestions again
    setShowSuggestions(true);
  };

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    // Hide suggestions when user sends a message
    setShowSuggestions(false);
    
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
        user_id: userData?.id || user?.id,
        history: messageHistory,
      };
      if (messageHistory.length == 0) {
        queryMessage.history = [];
      }
      console.log('userMessage', JSON.stringify({
        query: userMessage,
        user_id: userData?.id || user?.id,
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
          user_id: userData?.id || user?.id,
          history: messageHistory,
        })
      });

      const data = await response.json();

      // Add the agent's response to the messages
      if (response.ok && data.response) {
        setMessageHistory(data.history);
        
        // Process the response for better formatting
        const processedResponse = processAgentResponse(data.response);
        
        const messageId = Math.random().toString();
        const agentMessage: IMessage = {
          _id: messageId,
          text: processedResponse,
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
  }, [messages, user, token, API_BASE_URL, messageHistory]);

  const onSuggestionPress = (suggestion: string) => {
    onSend([{
      _id: Math.random().toString(),
      text: suggestion,
      createdAt: new Date(),
      user: {
        _id: user?.id || '1',
        name: user ? `${user.firstName} ${user.lastName}` : 'You',
      },
    }]);
  };

  // Process agent response text to ensure proper formatting
  const processAgentResponse = (responseText: string) => {
    // Ensure bullet points have proper spacing
    let processedText = responseText;
    
    // Convert asterisk bullet points to bullet character
    processedText = processedText.replace(/^\s*\*\s+/gm, '• ');
    processedText = processedText.replace(/\n\s*\*\s+/gm, '\n• ');
    
    // Make sure there's a space after bullet points if not already present
    processedText = processedText.replace(/•(?!\s)/g, '• ');
    
    // Convert numbered lists with improper spacing
    processedText = processedText.replace(/(\d+\.)(?!\s)/g, '$1 ');
    
    // Handle Markdown-style headers (e.g., # Header, ## Subheader)
    processedText = processedText.replace(/^#\s+(.+)$/gm, (match, p1) => {
      return p1 + ':'; // Add colon to format as header
    });
    
    // Ensure sections are properly separated
    processedText = processedText.replace(/([.:;!?])\n(?!\n)/g, '$1\n\n');
    
    // Fix trailing asterisks
    processedText = processedText.replace(/\n\*$/gm, '');
    processedText = processedText.replace(/\*$/g, '');
    
    return processedText;
  };

  // Custom render for message bubbles with text-to-speech button
  const renderBubble = (props: any) => {
    const { currentMessage } = props;
    const isAgent = currentMessage.user._id === 'agent';
    const messageId = currentMessage._id.toString();
    
    // Only show speaker icon for agent messages
    const showSpeaker = isAgent;
    const isThisMessageSpeaking = isSpeaking && speakingMessageId === messageId;
    
    return (
      <View style={{ marginBottom: 5 }}>
        <Bubble
          {...props}
          wrapperStyle={{
            left: {
              backgroundColor: '#F5F5F7',
              padding: 2,
              paddingBottom: showSpeaker ? 10 : 2, // Add slight padding at the bottom
              marginBottom: 0,
              borderRadius: 16,
            },
            right: {
              backgroundColor: '#007AFF',
              padding: 2,
              marginBottom: 0,
              borderRadius: 16,
            },
          }}
        />
        
        {/* Place speaker button outside the bubble for better touchability */}
        {showSpeaker && (
          <TouchableOpacity
            onPress={() => toggleSpeech(currentMessage.text, messageId)}
            style={[
              styles.speakerButtonExternal,
              isThisMessageSpeaking && styles.speakerButtonActive
            ]}
            disabled={preparingSpeech}
            activeOpacity={0.7}
            accessibilityLabel={isThisMessageSpeaking ? "Stop reading message" : "Read message aloud"}
            accessibilityRole="button"
            accessibilityHint="Tap to have this message read aloud"
          >
            {preparingSpeech && speakingMessageId === messageId ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Animated.View style={{ transform: [{ scale: isThisMessageSpeaking ? speakerPulse : 1 }] }}>
                <MaterialIcons 
                  name={isThisMessageSpeaking ? "record-voice-over" : "volume-up"} 
                  size={22} 
                  color={isThisMessageSpeaking ? "#4CAF50" : "#007AFF"} 
                />
              </Animated.View>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

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

  // Custom render for message text to handle formatting
  const renderMessageText = (props: any) => {
    // Check if this is an agent message (on the left)
    const isAgentMessage = props.currentMessage.user._id === 'agent';
    
    // Base text style for all messages
    const baseTextStyle = {
      left: {
        color: '#000',
        fontFamily: 'System',
        fontSize: 15,
        lineHeight: 24,
      },
      right: {
        color: '#fff',
        fontFamily: 'System',
        fontSize: 15,
        lineHeight: 22,
      },
    };
    
    // Just return default MessageText for now
    return (
      <MessageText
        {...props}
        textStyle={baseTextStyle}
        customTextStyle={{ marginVertical: 5 }}
      />
    );
  };

  // Render suggestion bubbles
  const renderSuggestions = () => {
    if (!showSuggestions) return null;
    
    return (
      <View style={styles.suggestionsContainer}>
        <ThemedText style={styles.suggestionsTitle}>
          Try asking about living space risk assessment:
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
          {RISK_ASSESSMENT_SUGGESTIONS.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionBubble}
              onPress={() => onSuggestionPress(suggestion)}
            >
              <ThemedText style={styles.suggestionText}>{suggestion}</ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* iOS custom toast */}
      {Platform.OS === 'ios' && toastVisible && (
        <View style={styles.iosToast}>
          <ThemedText style={styles.iosToastText}>{toastMessage}</ThemedText>
        </View>
      )}
      
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>AI Assistant</ThemedText>
        <TouchableOpacity 
          style={styles.newChatButton} 
          onPress={startNewConversation}
        >
          <ThemedText style={styles.newChatButtonText}>New Chat</ThemedText>
        </TouchableOpacity>
      </View>

      {renderSuggestions()}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        enabled={Platform.OS === 'ios'}
      >
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{
            _id: user?.id || '1', // Use the authenticated user's ID or a default
            name: user ? `${user.firstName} ${user.lastName}` : 'You', // Using firstName and lastName from the User interface
          }}
          renderSend={renderSend}
          renderFooter={renderFooter}
          renderBubble={renderBubble}
          renderMessageText={renderMessageText}
          listViewProps={{
            scrollEnabled: true,
            keyboardShouldPersistTaps: "handled",
            showsVerticalScrollIndicator: true,
          }}
          keyboardShouldPersistTaps="handled"
          messagesContainerStyle={styles.messagesContainer}
          bottomOffset={Platform.OS === 'ios' ? 90 : 0}
          minInputToolbarHeight={50}
          maxInputLength={1000}
          renderUsernameOnMessage
          alwaysShowSend
          scrollToBottom
          inverted={true}
        />
      </KeyboardAvoidingView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  newChatButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  newChatButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
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
    flex: 1,
  },
  suggestionsContainer: {
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
    margin: 10,
  },
  suggestionsTitle: {
    fontWeight: '600',
    marginBottom: 10,
    fontSize: 15,
  },
  suggestionsScroll: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  suggestionBubble: {
    backgroundColor: '#007AFF',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    marginBottom: 5,
  },
  suggestionText: {
    color: 'white',
    fontSize: 14,
  },
  speakerButtonExternal: {
    position: 'absolute',
    bottom: 5,
    right: 40,
    backgroundColor: '#F5F5F7',
    padding: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    zIndex: 10, // Ensure it's above other elements
    elevation: 2, // For Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    minWidth: 34, // Ensure it has a minimum width for better tapping
    minHeight: 34, // Ensure it has a minimum height for better tapping
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerButtonActive: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
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
}); 