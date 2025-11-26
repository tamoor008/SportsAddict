import { database } from '@/config/firebase';
import { getCurrentUser } from '@/utils/auth';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { push, ref, set } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

export default function AddArticlesScreen() {
  const navigation = useNavigation<any>();
  const [title, setTitle] = useState('');
  const [sportsCategory, setSportsCategory] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [secondaryHeadline, setSecondaryHeadline] = useState('');
  const [secondaryDescription, setSecondaryDescription] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }
      return () => {
        const parentNav = navigation.getParent();
        if (parentNav) {
          parentNav.setOptions({
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#E0E0E0',
              height: Platform.OS === 'ios' ? 88 : 64,
              paddingBottom: Platform.OS === 'ios' ? 24 : 8,
              paddingTop: 8,
            },
          });
        }
      };
    }, [navigation])
  );

  const handleCategorySelect = (category: string) => {
    setSportsCategory(category);
    setShowDropdown(false);
  };

  const handlePostArticle = async () => {
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
      Alert.alert('Validation Error', 'Please enter at least one description');
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to post an article');
      return;
    }

    setIsPosting(true);

    try {
      // Create article data
      const authorName =
        currentUser.displayName?.trim() ||
        currentUser.email?.split('@')[0] ||
        'Author';

      const articleData = {
        title: title.trim(),
        category: sportsCategory,
        description: description.trim(),
        ...(headline.trim() && { headline: headline.trim() }),
        ...(secondaryHeadline.trim() && { secondaryHeadline: secondaryHeadline.trim() }),
        ...(secondaryDescription.trim() && { secondaryDescription: secondaryDescription.trim() }),
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
        authorId: currentUser.uid,
        authorEmail: currentUser.email || 'Unknown',
        authorName,
      };

      // Save to Firebase Realtime Database - both global and user-specific
      const articlesRef = ref(database, 'articles');
      const newArticleRef = push(articlesRef);
      const articleId = newArticleRef.key;
      
      // Save to global articles node
      await set(newArticleRef, articleData);
      
      // Also save to user-specific articles node
      if (articleId) {
        const userArticlesRef = ref(database, `users/${currentUser.uid}/articles/${articleId}`);
        await set(userArticlesRef, articleData);
      }

      Alert.alert('Success', 'Article posted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            // Clear form
            setTitle('');
            setSportsCategory('');
            setHeadline('');
            setDescription('');
            setSecondaryHeadline('');
            setSecondaryDescription('');
            // Navigate back
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error posting article:', error);
      Alert.alert('Error', 'Failed to post article. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </Pressable>
        <Text style={styles.headerTitle}>Add New Articles</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardHeight || 20 }]}
        showsVerticalScrollIndicator={false}>
        
        {/* Image Placeholder */}
        <View style={styles.imageContainer}>
          <Image
            source={require('@/assets/images/image1.png')}
            style={styles.articleImage}
            resizeMode="cover"
          />
        </View>

        {/* Title Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter title"
            placeholderTextColor="#999999"
          />
        </View>

        {/* Sports Category Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Sports Category</Text>
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

        {/* Article Content Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Article Content</Text>
          
          {/* Headline */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Headline</Text>
            <TextInput
              style={styles.textInput}
              value={headline}
              onChangeText={setHeadline}
              placeholder="Enter headline"
              placeholderTextColor="#999999"
            />
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter description"
              placeholderTextColor="#999999"
              multiline
              textAlignVertical="top"
            />
          </View>



          {/* Secondary Headline */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Headline</Text>
            <TextInput
              style={styles.textInput}
              value={secondaryHeadline}
              onChangeText={setSecondaryHeadline}
              placeholder="Enter headline"
              placeholderTextColor="#999999"
            />
          </View>

          {/* Secondary Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textArea}
              value={secondaryDescription}
              onChangeText={setSecondaryDescription}
              placeholder="Enter description"
              placeholderTextColor="#999999"
              multiline
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Post Now Button */}
        <View style={styles.buttonContainer}>
          <Pressable 
            style={[styles.postButton, isPosting && styles.postButtonDisabled]}
            onPress={handlePostArticle}
            disabled={isPosting}>
            {isPosting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.postButtonText}>Post Now</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  articleImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#F0F0F0',
  },
  inputContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
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
  sectionContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
    marginHorizontal: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    minHeight: 150,
    lineHeight: 22,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 20,
    marginVertical: 12,
  },
  buttonContainer: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 20,
    paddingTop: 12,
    borderTopColor: '#E0E0E0',
  },
  postButton: {
    backgroundColor: '#06ABEB',
    borderRadius: 120,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#06ABEB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 12,
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

