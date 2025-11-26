import { database } from '@/config/firebase';
import { getCurrentUser } from '@/utils/auth';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { push, ref, set } from 'firebase/database';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SPORTS_CATEGORIES = [
  'NFL',
  'NBA',
  'MLB',
  'NHL',
  'Soccer',
  'Tennis',
  'Golf',
  'MMA',
  'Boxing',
  'NASCAR',
  'Olympics',
  'College Football',
  'College Basketball',
];

export default function AddPodcastScreen() {
  const navigation = useNavigation<any>();
  const [title, setTitle] = useState('My Podcast');
  const [sportsCategory, setSportsCategory] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [description, setDescription] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const handleCategorySelect = (category: string) => {
    setSportsCategory(category);
    setShowDropdown(false);
  };

  const handlePostPodcast = async () => {
    // Validate required fields
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title');
      return;
    }
    if (!sportsCategory) {
      Alert.alert('Validation Error', 'Please select a sports category');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description');
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to post a podcast');
      return;
    }

    setIsPosting(true);

    try {
      // Create podcast data
      const podcastData = {
        title: title.trim(),
        category: sportsCategory,
        description: description.trim(),
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
        authorId: currentUser.uid,
        authorEmail: currentUser.email || 'Unknown',
      };

      // Save to Firebase Realtime Database - both global and user-specific
      const podcastsRef = ref(database, 'podcasts');
      const newPodcastRef = push(podcastsRef);
      const podcastId = newPodcastRef.key;
      
      // Save to global podcasts node
      await set(newPodcastRef, podcastData);
      
      // Also save to user-specific podcasts node
      if (podcastId) {
        const userPodcastsRef = ref(database, `users/${currentUser.uid}/podcasts/${podcastId}`);
        await set(userPodcastsRef, podcastData);
      }

      Alert.alert('Success', 'Podcast posted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Clear form
            setTitle('My Podcast');
            setSportsCategory('');
            setDescription('');
            // Navigate back
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error posting podcast:', error);
      Alert.alert('Error', 'Failed to post podcast. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  // Hide tab bar when this screen is focused
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }
      return () => {
        if (parent) {
          parent.setOptions({
            tabBarStyle: undefined,
          });
        }
      };
    }, [navigation])
  );

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
        <Text style={styles.title}>Add New Podcast</Text>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        
        {/* Podcast Cover Image */}
        <View style={styles.imageContainer}>
          <Image
            source={require('@/assets/images/image1.png')}
            style={styles.coverImage}
            resizeMode="cover"
          />
        </View>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Title Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Title</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Title"
                placeholderTextColor="#999999"
                value={title}
                onChangeText={setTitle}
              />
            </View>
          </View>

          {/* Sports Category Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Sports Category</Text>
            <Pressable 
              style={styles.dropdownContainer} 
              onPress={() => setShowDropdown(!showDropdown)}>
              <Text style={[styles.dropdownText, !sportsCategory && styles.placeholderText]}>
                {sportsCategory || 'Select category'}
              </Text>
              <Ionicons 
                name={showDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#000000" 
              />
            </Pressable>
            {showDropdown && (
              <ScrollView 
                style={styles.dropdownList}
                nestedScrollEnabled
                showsVerticalScrollIndicator={false}>
                {SPORTS_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.dropdownItem,
                      sportsCategory === category && styles.dropdownItemSelected,
                    ]}
                    onPress={() => handleCategorySelect(category)}>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        sportsCategory === category && styles.dropdownItemTextSelected,
                      ]}>
                      {category}
                    </Text>
                    {sportsCategory === category && (
                      <Ionicons name="checkmark" size={18} color="#06ABEB" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Descriptions Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Descriptions</Text>
            <View style={styles.textAreaWrapper}>
              <TextInput
                style={styles.textArea}
                placeholder="Descriptions"
                placeholderTextColor="#999999"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Add More Media Section */}
          <View style={styles.mediaSection}>
            <Text style={styles.mediaSectionTitle}>Add more media</Text>
            <Pressable style={styles.uploadButton}>
              <Text style={styles.uploadButtonText}>Upload</Text>
            </Pressable>
            <Text style={styles.fileFormatText}>(png,jpg,jpeg)</Text>
          </View>

          {/* Post Now Button */}
          <View style={styles.buttonContainer}>
            <Pressable 
              style={[styles.postButton, isPosting && styles.postButtonDisabled]}
              onPress={handlePostPodcast}
              disabled={isPosting}>
              {isPosting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.postButtonText}>Post Now</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F4F5F6',
  },
  coverImage: {
    width: '100%',
    height: 200,
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
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F5F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 17,
    borderColor: '#E0E0E0',
  },
  dropdownText: {
    fontSize: 16,
    color: '#000000',
  },
  placeholderText: {
    color: '#999999',
  },
  dropdownList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemSelected: {
    backgroundColor: '#F5F9FF',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000000',
  },
  dropdownItemTextSelected: {
    color: '#06ABEB',
    fontWeight: '600',
  },
  textAreaWrapper: {
    backgroundColor: '#F4F5F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 17,
    borderColor: '#E0E0E0',
    minHeight: 100,
  },
  textArea: {
    fontSize: 16,
    color: '#000000',
    minHeight: 80,
  },
  mediaSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  mediaSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 12,
  },
  uploadButton: {
    backgroundColor: '#F4F5F6',
    borderRadius: 800,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    borderColor: '#E0E0E0',
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#06ABEB',
  },
  fileFormatText: {
    fontSize: 12,
    color: '#999999',
    textAlign:'center',
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  postButton: {
    backgroundColor: '#06ABEB',
    borderRadius: 120,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  postButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
});

