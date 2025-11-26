import { database } from '@/config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { push, ref } from 'firebase/database';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCurrentUser } from '@/utils/auth';

const sportsOptions = ['NHL', 'NBA', 'NFL', 'MLB', 'MLS'];

export default function RequestAuthorScreen() {
  const navigation = useNavigation<any>();
  const user = getCurrentUser();

  const [fullName, setFullName] = useState(user?.displayName ?? 'William Gross');
  const [selectedSport, setSelectedSport] = useState('NHL');
  const [isSportsDropdownOpen, setIsSportsDropdownOpen] = useState(false);
  const [socialLinks, setSocialLinks] = useState([
    'https://linkedin.com/profile',
    'https://instagram.com/profile',
    'https://facebook.com/profile',
  ]);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslate = useRef(new Animated.Value(20)).current;

  const primarySocialLabel = useMemo(() => 'Social', []);

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

  const handleSubmit = useCallback(async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'You must be logged in to submit a request.');
      return;
    }

    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name.');
      return;
    }

    setIsSportsDropdownOpen(false);

    try {
      // Save author request to Firebase
      const requestsRef = ref(database, 'authorRequests');
      await push(requestsRef, {
        userId: user.uid,
        fullName: fullName.trim(),
        selectedSport,
        socialLinks: socialLinks.filter(link => link.trim() !== ''),
        timestamp: Date.now(),
        status: 'pending',
        email: user.email || '',
      });

      showToast();
    } catch (error: any) {
      console.error('Error submitting author request:', error);
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    }
  }, [showToast, user, fullName, selectedSport, socialLinks]);

  const handleSelectSport = (option: string) => {
    setSelectedSport(option);
    setIsSportsDropdownOpen(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </Pressable>
          <Text style={styles.headerTitle}>Request Author Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <Image source={require('@/assets/images/user.png')} style={styles.fullNameAvatar} />
              <TextInput
                style={styles.textInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter full name"
                placeholderTextColor="#B1B9C6"
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.fieldLabel}>Sports</Text>
            <View>
              <Pressable
                style={[styles.inputWrapper, styles.dropdownTrigger]}
                onPress={() => setIsSportsDropdownOpen((prev) => !prev)}>
                <Text style={styles.textValue}>{selectedSport}</Text>
                <Ionicons
                  name={isSportsDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#7C8597"
                />
              </Pressable>
              {isSportsDropdownOpen && (
                <View style={styles.dropdown}>
                  {sportsOptions.map((option) => (
                    <Pressable
                      key={option}
                      style={styles.dropdownOption}
                      onPress={() => handleSelectSport(option)}>
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          option === selectedSport && styles.dropdownOptionTextSelected,
                        ]}>
                        {option}
                      </Text>
                      {option === selectedSport && (
                        <Ionicons name="checkmark" size={18} color="#05B1FF" />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Social Media Profile</Text>

          {socialLinks.map((link, index) => (
            <View key={index.toString()} style={styles.formGroup}>
              <Text style={styles.fieldLabel}>{primarySocialLabel}</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={link}
                  onChangeText={(text) => {
                    setSocialLinks((prev) => prev.map((value, i) => (i === index ? text : value)));
                  }}
                  placeholder="https://"
                  placeholderTextColor="#B1B9C6"
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Request as Author</Text>
          </Pressable>
        </View>
      </View>
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
            <Text style={styles.toastTitle}>Request Sent!</Text>
            <Text style={styles.toastSubtitle}>Successfully sent</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#0D1526',
  },
  headerSpacer: {
    width: 28,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  formGroup: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D1526',
    marginTop: 8,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9AA2B0',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F4F6F9',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  leadingIcon: {
    marginRight: 12,
  },
  fullNameAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0D1526',
  },
  textValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0D1526',
  },
  dropdownTrigger: {
    justifyContent: 'space-between',
  },
  dropdown: {
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E8EF',
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  dropdownOptionText: {
    fontSize: 15,
    color: '#0D1526',
    fontWeight: '500',
  },
  dropdownOptionTextSelected: {
    color: '#05B1FF',
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  submitButton: {
    backgroundColor: '#05B1FF',
    borderRadius: 40,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
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
    borderColor:'#5DD8D0',
    borderWidth:13,
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

