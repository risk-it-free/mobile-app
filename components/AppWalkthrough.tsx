import React, { useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  FlatList, 
  TouchableOpacity, 
  Image,
  Animated,
  Modal,
  FlatListProps
} from 'react-native';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Define the walkthrough item interface
interface WalkthroughItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
}

// Define props interface
interface AppWalkthroughProps {
  visible: boolean;
  onClose: () => void;
}

// Walkthrough data with steps explaining app features
const walkthroughData: WalkthroughItem[] = [
  {
    id: '1',
    title: 'Welcome to SafeSpace',
    description: 'We help you identify and prevent hazards to keep your loved ones safe.',
    icon: 'health-and-safety',
    iconColor: '#4CAF50'
  },
  {
    id: '2',
    title: 'Add to Your Care Circle',
    description: 'Add family members or patients you want to keep safe. Track their medical conditions and needs.',
    icon: 'people',
    iconColor: '#5AC8FA'
  },
  {
    id: '3',
    title: 'Create Safety Spaces',
    description: 'Add rooms or areas where your loved ones spend time. We\'ll help monitor these spaces for safety.',
    icon: 'room',
    iconColor: '#007AFF'
  },
  {
    id: '4',
    title: 'Capture & Analyze',
    description: 'We\'ll periodically scan photos of these spaces to identify potential hazards and suggest safety measures.',
    icon: 'camera-alt',
    iconColor: '#FF9500'
  },
  {
    id: '5',
    title: 'AI Safety Assistant',
    description: 'Our AI chatbot summarizes safety feedback and alerts you about potential concerns across all spaces.',
    icon: 'chat',
    iconColor: '#FF3B30'
  }
];

// Walkthrough Key for AsyncStorage
const WALKTHROUGH_KEY = 'safespace_walkthrough_completed';

const AppWalkthrough: React.FC<AppWalkthroughProps> = ({ visible, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<WalkthroughItem>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Handle completing the walkthrough
  const handleComplete = async () => {
    try {
      await AsyncStorage.setItem(WALKTHROUGH_KEY, 'true');
      onClose();
    } catch (error) {
      console.error('Error saving walkthrough status:', error);
    }
  };

  // Function to handle skipping the tutorial
  const handleSkip = () => {
    console.log('Skip button pressed');
    handleComplete();
  };

  // Function to go to the next slide
  const goToNextSlide = () => {
    if (currentIndex < walkthroughData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last slide, complete walkthrough
      handleComplete();
    }
  };

  // Render individual walkthrough slide
  const renderItem = ({ item }: { item: WalkthroughItem }) => {
    return (
      <View style={styles.slide}>
        <View style={[styles.iconContainer, { backgroundColor: `${item.iconColor}20` }]}>
          <MaterialIcons name={item.icon as any} size={60} color={item.iconColor} />
        </View>
        <ThemedText style={styles.title}>{item.title}</ThemedText>
        <ThemedText style={styles.description}>{item.description}</ThemedText>
      </View>
    );
  };

  // Pagination dots at the bottom
  const renderPagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {walkthroughData.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];
          
          const dotOpacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 16, 8],
            extrapolate: 'clamp',
          });
          
          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                { 
                  opacity: dotOpacity,
                  width: dotWidth,
                  backgroundColor: currentIndex === index ? '#007AFF' : '#CCCCCC'
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
    >
      <ThemedView style={styles.container}>
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          testID="skip-button"
        >
          <ThemedText style={styles.skipText}>Skip</ThemedText>
        </TouchableOpacity>
        
        <FlatList
          ref={flatListRef}
          data={walkthroughData}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(
              event.nativeEvent.contentOffset.x / width
            );
            setCurrentIndex(newIndex);
          }}
        />
        
        {renderPagination()}
        
        <TouchableOpacity 
          style={styles.nextButton} 
          onPress={goToNextSlide}
        >
          <ThemedText style={styles.nextButtonText}>
            {currentIndex === walkthroughData.length - 1 ? 'Get Started' : 'Next'}
          </ThemedText>
          <MaterialIcons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </ThemedView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  slide: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  paginationDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(163, 163, 163, 0.95)',
    borderRadius: 15,
    zIndex: 1000,
  },
  skipText: {
    fontSize: 16,
    color: '#666',
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default AppWalkthrough; 