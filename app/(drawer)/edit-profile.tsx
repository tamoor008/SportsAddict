import { database } from '@/config/firebase';
import { getCurrentUser } from '@/utils/auth';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { off, onValue, ref, set } from 'firebase/database';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslate = useRef(new Animated.Value(20)).current;

  // Load profile data from Firebase
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to view profile');
      navigation.goBack();
      return;
    }

    // Set email from current user
    if (currentUser.email) {
      setEmail(currentUser.email);
    }

    // Load profile data from Firebase
    const personalInfoRef = ref(database, `users/${currentUser.uid}/personalInfo`);
    
    const unsubscribe = onValue(personalInfoRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setFullName(data.fullName || '');
        setCountry(data.country || '');
        setCity(data.city || '');
        setAddress(data.address || '');
        // Don't override email if it's already set from auth
        if (data.email && !currentUser.email) {
          setEmail(data.email || '');
        }
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Error loading profile data:', error);
      setIsLoading(false);
    });

    return () => {
      off(personalInfoRef);
    };
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

  const showToast = useCallback(() => {
    setIsToastVisible(true);
    toastOpacity.stopAnimation();
    toastTranslate.stopAnimation();
    toastOpacity.setValue(0);
    toastTranslate.setValue(20);

    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslate, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          delay: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(toastTranslate, {
          toValue: 20,
          duration: 300,
          delay: 2500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsToastVisible(false);
      });
    });
  }, [toastOpacity, toastTranslate]);

  const handleSaveProfile = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to save profile');
      return;
    }

    // Validation
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your full name');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email');
      return;
    }

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

      await set(personalInfoRef, personalInfo);

      setIsSaving(false);
      showToast();
    } catch (error: any) {
      console.error('Error saving profile:', error);
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
        <Text style={styles.title}>Edit Profile</Text>
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
          disabled={isSaving || isLoading}>
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.nextButtonText}>Next</Text>
          )}
        </Pressable>
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#06ABEB" />
        </View>
      )}

      {/* Success Toast */}
      {isToastVisible && (
        <Animated.View
          style={[
            styles.toastContainer,
            { opacity: toastOpacity, transform: [{ translateY: toastTranslate }] },
          ]}>
          <View style={styles.toastIconWrapper}>
            <Ionicons name="checkmark" size={12} color="#1FC569" />
          </View>
          <View style={styles.toastTextWrapper}>
            <Text style={styles.toastTitle}>Profile Updated!</Text>
            <Text style={styles.toastSubtitle}>Successfully updated</Text>
          </View>
        </Animated.View>
      )}
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  toastIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E6FFF4',
    justifyContent: 'center',
    borderColor: '#5DD8D0',
    borderWidth: 13,
    alignItems: 'center',
    marginRight: 16,
  },
  toastTextWrapper: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
  },
  toastSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
});

