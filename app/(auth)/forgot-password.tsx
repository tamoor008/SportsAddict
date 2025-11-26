import { auth } from '@/config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const email = route.params?.email || '';
  const [loading, setLoading] = useState(false);

  // Mask email for display (e.g., muqsit@gmail.com -> mu***@email.com)
  const maskEmail = (email: string) => {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return email;
    
    const maskedLocal = localPart.length > 2 
      ? localPart.substring(0, 2) + '***'
      : localPart.charAt(0) + '***';
    
    return `${maskedLocal}@${domain}`;
  };

  const handleResendLink = async () => {
    if (!email) {
      Alert.alert('Error', 'Email address not found');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Success', 'Reset link has been sent again to your email.');
    } catch (error: any) {
      console.error('Error resending password reset email:', error);
      let errorMessage = 'Failed to resend reset email. Please try again.';
      
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
      <View 
        style={styles.scrollView}>
        
      
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
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.instruction}>
            We send you the link to {maskEmail(email)}, please check and click it to reset your password.
          </Text>
        </View>

        {/* Resend Button */}
        <Pressable 
          style={[styles.resendButton, loading && styles.resendButtonDisabled]}
          onPress={handleResendLink}
          disabled={loading}>
          <Text style={styles.resendButtonText}>
            {loading ? 'Sending...' : 'Resend The Link'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    paddingHorizontal:30,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    paddingRight: 4,
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  titleContainer: {
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 24,
  },
  instruction: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  resendButton: {
    backgroundColor: '#06ABEB',
    borderRadius: 120,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  resendButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resendButtonDisabled: {
    opacity: 0.6,
  },
});

