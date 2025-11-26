import { auth } from '@/config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { sendPasswordResetEmail } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Keyboard event listeners
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

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      // Navigate to forgot password confirmation screen with email
      navigation.navigate('forgot-password', { email: email.trim() });
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardHeight }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#06ABEB" />
          </Pressable>
          <View style={styles.logoPlaceholder} />
        </View>

        {/* Title and Instructions */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.instruction}>
            Please enter your email account to reset your password.
          </Text>
        </View>

        {/* Email Input Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.inputWrapper}>
            <Image
              source={require('@/assets/images/email1.png')}
              style={styles.inputIcon}
              resizeMode="contain"
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Submit Button */}
        <Pressable 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          <Text style={styles.submitButtonText}>
            {loading ? 'Sending...' : 'Submit'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  instruction: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  inputContainer: {
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 17,
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: '#323232',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  chevronIcon: {
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#06ABEB',
    borderRadius: 120,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
});

