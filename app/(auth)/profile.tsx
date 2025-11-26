import { database } from '@/config/firebase';
import { getCurrentUser } from '@/utils/auth';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ref, set } from 'firebase/database';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Set email from current user on mount
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser?.email) {
      setEmail(currentUser.email);
    }
  }, []);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height + 10);
    });
    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height + 10);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleSaveProfile = async () => {
    console.log('🚀 [Profile] handleSaveProfile called');
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.error('❌ [Profile] No current user found');
      Alert.alert('Error', 'You must be logged in to save profile');
      return;
    }

    console.log('✅ [Profile] Current user:', currentUser.uid, currentUser.email);

    // Validation
    if (!fullName.trim()) {
      console.warn('⚠️ [Profile] Full name validation failed');
      Alert.alert('Validation Error', 'Please enter your full name');
      return;
    }

    if (!email.trim()) {
      console.warn('⚠️ [Profile] Email validation failed');
      Alert.alert('Validation Error', 'Please enter your email');
      return;
    }

    console.log('💾 [Profile] Starting to save profile...');
    setIsSaving(true);

    try {
      // Save profile data to Firebase
      const personalInfoRef = ref(database, `users/${currentUser.uid}/personalInfo`);
      
      const personalInfo = {
        email: email.trim(),
        fullName: fullName.trim(),
        country: country.trim(),
        city: city.trim(),
        address: address.trim(),
        updatedAt: new Date().toISOString(),
        timestamp: Date.now(),
      };

      console.log('💾 [Profile] Saving to Firebase:', personalInfoRef.key);
      await set(personalInfoRef, personalInfo);
      
      console.log('✅ [Profile] Profile saved successfully for user:', currentUser.uid);
      console.log('✅ [Profile] Full name saved:', fullName.trim());

      setIsSaving(false);

      // Navigate to home screen (articles tab)
      const rootStackNav = navigation.getParent();

      if (rootStackNav) {
        rootStackNav.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: '(home)' as never }],
          })
        );
      } else {
        navigation.navigate('(home)' as never);
      }
    } catch (error: any) {
      console.error('❌ [Profile] Error saving profile:', error);
      setIsSaving(false);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </Pressable>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: keyboardHeight }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        
        {/* Profile Picture */}
      <View style={styles.profilePictureContainer}>
            <Image
              source={require('@/assets/images/profileimage.png')}
              style={styles.profileImage}
              resizeMode="cover"
            />
            </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Email Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="at" size={20} color="#323232" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                placeholderTextColor="#999999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={false}
              />
            </View>
          </View>

          {/* Full Name Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Image
                source={require('@/assets/images/user.png')}
                style={styles.inputIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#999999"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Country Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Country</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Country"
                placeholderTextColor="#999999"
                value={country}
                onChangeText={setCountry}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* City Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>City</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="City"
                placeholderTextColor="#999999"
                value={city}
                onChangeText={setCity}
                autoCapitalize="words"
              />
              <Ionicons name="chevron-down" size={20} color="#323232" style={styles.dropdownIcon} />
            </View>
          </View>

          {/* Address Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Address</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Address"
                placeholderTextColor="#999999"
                value={address}
                onChangeText={setAddress}
                autoCapitalize="words"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Next Button */}
      <View style={styles.buttonContainer}>
        <Pressable 
          style={[styles.nextButton, isSaving && styles.nextButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.nextButtonText}>Next</Text>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  backButton: {
    padding: 4,
    width: 32,
  },
  backButtonPlaceholder: {
    width: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  profilePictureCircle: {
   
    justifyContent: 'center',
    alignItems: 'center',
  
  },
  profileImage: {
    width: 120,
    height: 120,
  },
  cameraIconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
    height: 50,
  },
  cameraDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    top: '50%',
    left: '50%',
    marginTop: -5,
    marginLeft: -5,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
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
    borderRadius: 8,
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
  dropdownIcon: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 20,
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    backgroundColor: '#06ABEB',
    borderRadius: 120,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
});

