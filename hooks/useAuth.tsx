import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  phoneNumber?: string;
  emergencyContact?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (userData: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserInfo: (userData: UpdateUserData) => Promise<void>;
}

interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneNumber: string;
  password: string;
}

interface UpdateUserData {
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  emergency_contact?: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Update API URL to use IP address instead of localhost for mobile devices
// const API_BASE_URL = 'http://localhost:8000';
// const API_BASE_URL = 'http://10.0.2.2:4000'; // Use 10.0.2.2 for Android emulator
const API_BASE_URL = 'https://2595-2603-8000-ba00-2aae-19d0-bb4a-f0eb-4b8f.ngrok-free.app'; // Use 10.0.2.2 for Android emulator
// For iOS simulator, use your computer's local IP address if needed
// For physical devices, use your development machine's actual local network IP

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on startup
    const loadToken = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('userToken');
        const storedUser = await SecureStore.getItemAsync('userData');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to load auth token', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadToken();
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      console.log('Login response:', response);
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data: LoginResponse = await response.json();
      console.log('Login response:', data);
      // Fetch user data using the token
      const userResponse = await fetch(`${API_BASE_URL}/user/me`, {
        headers: {
          'Authorization': `Bearer ${data.access_token}`
        }
      });
      
      if (!userResponse.ok) {
        throw new Error('Failed to get user data');
      }
      
      const userData = await userResponse.json();
      
      // Format user data to match our User interface
      const formattedUser: User = {
        id: userData._id,
        email: userData.email,
        username: userData.username,
        firstName: userData.first_name,
        lastName: userData.last_name,
        phoneNumber: userData.phone_number,
        emergencyContact: userData.emergency_contact,
      };
      
      // Store the token and user data
      await SecureStore.setItemAsync('userToken', data.access_token);
      await SecureStore.setItemAsync('userData', JSON.stringify(formattedUser));
      
      setToken(data.access_token);
      setUser(formattedUser);
    } catch (error) {
      Alert.alert('Error', 'Failed to sign in. Please check your credentials.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (userData: SignUpData) => {
    try {
      setIsLoading(true);
      
      // Format data for backend API
      const formattedData = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        first_name: userData.firstName,
        last_name: userData.lastName,
      };
      
      const response = await fetch(`${API_BASE_URL}/user/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
      }
      
      // On successful sign-up, do not auto-login
      // Redirect will happen from the signup component
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create account. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserInfo = async (userData: UpdateUserData) => {
    if (!user || !token) {
      throw new Error('User not authenticated');
    }

    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/user/${user.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Update failed');
      }
      
      // Update local user data
      const updatedUser: User = {
        ...user,
        email: userData.email,
        firstName: userData.first_name || user.firstName,
        lastName: userData.last_name || user.lastName,
        phoneNumber: userData.phone_number,
        emergencyContact: userData.emergency_contact,
      };
      
      await SecureStore.setItemAsync('userData', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await SecureStore.deleteItemAsync('userToken');
      await SecureStore.deleteItemAsync('userData');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Error signing out', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signUp, signOut, updateUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 