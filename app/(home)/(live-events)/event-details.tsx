import { database } from '@/config/firebase';
import { getCurrentUser } from '@/utils/auth';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { DataSnapshot, off, onValue, ref, remove, set } from 'firebase/database';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const defaultTabBarStyle = {
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#E0E0E0',
  height: Platform.OS === 'ios' ? 88 : 64,
  paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  paddingTop: 8,
};

const AVATAR_IMAGES = [
  require('@/assets/images/person.png'),
  require('@/assets/images/owner.png'),
  require('@/assets/images/icon.png'),
];

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  month: string;
  category?: string;
  time?: string;
  fullDate?: string;
  createdAt?: string;
  timestamp?: number;
  authorId?: string;
  authorEmail?: string;
}

interface Comment {
  id: string;
  author: string;
  date: string;
  rating: number;
  text: string;
  avatar?: any;
}

const mockComments: Comment[] = [
  {
    id: '1',
    author: 'William JR',
    date: '11 Nov, 2020',
    rating: 5,
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incidid ut labore etum dolor sit amet ...',
    avatar: require('@/assets/images/person.png'),
  },
  {
    id: '2',
    author: 'Sophia Smith',
    date: '09 Nov, 2020',
    rating: 5,
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incidid ut labore etum dolor sit amet ...',
    avatar: require('@/assets/images/owner.png'),
  },
];

export default function EventDetailsScreen() {
  const route = useRoute();
  const params = route.params as { eventId?: string };
  const normalizedEventId = params?.eventId;
  const navigation = useNavigation<any>();
  const [event, setEvent] = useState<LiveEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [toastContent, setToastContent] = useState<{ title: string; subtitle: string }>({
    title: '',
    subtitle: '',
  });
  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslate = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!normalizedEventId) {
      setIsLoading(false);
      return;
    }

    const eventRef = ref(database, `liveEvents/${normalizedEventId}`);
    
    const unsubscribe = onValue(eventRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setEvent({ id: normalizedEventId, ...data });
      } else {
        setEvent(null);
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Error loading event:', error);
      setIsLoading(false);
    });

    return () => {
      off(eventRef);
    };
  }, [normalizedEventId]);

  // Check saved status
  useEffect(() => {
    const checkSavedStatus = () => {
      const currentUser = getCurrentUser();
      if (!currentUser || !normalizedEventId) {
        setIsSaved(false);
        return;
      }

      const savedRef = ref(database, `savedItems/${currentUser.uid}/liveEvents/${normalizedEventId}`);
      const unsubscribe = onValue(savedRef, (snapshot: DataSnapshot) => {
        setIsSaved(snapshot.exists());
      });

      return () => {
        off(savedRef);
      };
    };

    const unsubscribe = checkSavedStatus();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [normalizedEventId]);

  const showToast = useCallback(
    (title: string, subtitle: string) => {
      setToastContent({ title, subtitle });
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
            delay: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(toastTranslate, {
            toValue: 20,
            duration: 300,
            delay: 3000,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsToastVisible(false);
        });
      });
    },
    [toastOpacity, toastTranslate]
  );

  useEffect(() => {
    console.log('🟣 [EVENT-DETAIL] Tab bar hide useEffect triggered');
    console.log('🟣 [EVENT-DETAIL] navigation object:', navigation);
    console.log('🟣 [EVENT-DETAIL] navigation.getState():', navigation.getState?.());
    
    const parent = navigation.getParent();
    console.log('🟣 [EVENT-DETAIL] parent from getParent():', parent);
    console.log('🟣 [EVENT-DETAIL] parent type:', parent?.getState?.()?.type);
    console.log('🟣 [EVENT-DETAIL] parent state:', parent?.getState?.());
    
    if (parent) {
      console.log('✅ [EVENT-DETAIL] Parent exists, calling setOptions...');
      try {
        parent.setOptions({ tabBarStyle: { display: 'none' } });
        console.log('✅ [EVENT-DETAIL] setOptions called successfully');
        
        // Verify the change
        const verifyParent = navigation.getParent();
        console.log('🟣 [EVENT-DETAIL] Verification - parent after setOptions:', verifyParent?.getState?.());
      } catch (error) {
        console.error('🔴 [EVENT-DETAIL] ERROR calling setOptions:', error);
      }
    } else {
      console.error('🔴 [EVENT-DETAIL] ERROR: No parent navigator found!');
    }
    
    return () => {
      console.log('🟣 [EVENT-DETAIL] Cleanup function running - restoring tab bar');
      const cleanupParent = navigation.getParent();
      if (cleanupParent) {
        try {
          cleanupParent.setOptions({ tabBarStyle: defaultTabBarStyle });
          console.log('✅ [EVENT-DETAIL] Tab bar restored in cleanup');
        } catch (error) {
          console.error('🔴 [EVENT-DETAIL] ERROR restoring tab bar:', error);
        }
      }
    };
  }, [navigation]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleToggleSave = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser || !normalizedEventId) {
      return;
    }

    const savedRef = ref(database, `savedItems/${currentUser.uid}/liveEvents/${normalizedEventId}`);
    const nextState = !isSaved;

    try {
      if (nextState) {
        await set(savedRef, {
          eventId: normalizedEventId,
          savedAt: Date.now(),
        });
        setIsSaved(true);
        showToast('Event saved', 'Event added to saved list');
      } else {
        await remove(savedRef);
        setIsSaved(false);
        showToast('Removed from saved', 'Event removed from saved list');
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleSendComment = () => {
    if (commentText.trim()) {
      // TODO: Implement comment submission to Firebase
      setCommentText('');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['bottom']}>
        <ActivityIndicator size="large" color="#06ABEB" />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['bottom']}>
        <Text style={styles.emptyTitle}>Event not found</Text>
        <Pressable style={styles.retryButton} onPress={handleBack}>
          <Text style={styles.retryText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Hero Image Section */}
          <View style={styles.heroContainer}>
            <Image
              source={require('@/assets/images/image1.png')}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOverlay} />
            
            {/* Header Buttons */}
            <View style={styles.headerButtons}>
              <Pressable style={styles.circleButton} onPress={handleBack}>
                <Ionicons name="chevron-back" size={22} color="#000000" />
              </Pressable>
              <Pressable style={styles.circleButton} onPress={handleToggleSave}>
                <Image
                  source={
                    isSaved
                      ? require('@/assets/images/Path.png')
                      : require('@/assets/images/heart-checkmark.png')
                  }
                  style={[styles.heartIcon, !isSaved && styles.heartIconDefault]}
                  resizeMode="contain"
                />
              </Pressable>
            </View>

            {/* Date Overlay */}
            <View style={styles.dateOverlay}>
              <Text style={styles.dateNumber}>{event.date || '21'}</Text>
              <Text style={styles.dateMonth}>{event.month || 'Dec'}</Text>
            </View>
          </View>

          {/* Event Content */}
          <View style={styles.contentContainer}>
            {/* Category Tag */}
            {event.category && (
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{event.category}</Text>
              </View>
            )}

            {/* Event Title */}
            <Text style={styles.eventTitle}>{event.title || 'Weekend Marathon'}</Text>

            {/* Event Description */}
            <Text style={styles.eventDescription}>
              {event.description || 'Wonderful challenge happens this weekend'}
            </Text>

            {/* Participants */}
            <View style={styles.participantsSection}>
              <View style={styles.avatarGroup}>
                {AVATAR_IMAGES.map((image, avatarIndex) => (
                  <View
                    key={avatarIndex}
                    style={[
                      styles.avatarWrapper,
                      { marginLeft: avatarIndex === 0 ? 0 : -7 },
                      avatarIndex === 1 ? styles.avatarMiddle : styles.avatarOuter,
                    ]}
                  >
                    <Image source={image} style={styles.avatar} />
                  </View>
                ))}
                <Text style={styles.participantsText}>and 11 others</Text>
              </View>
            </View>

            {/* Join Button Section */}
            <View style={styles.joinButtonContainer}>
              <View style={styles.joinButtonOuter}>
                <Text style={styles.joinButtonText}>Join our Event</Text>
                <Pressable style={styles.joinButtonInner}>
                  <Text style={styles.joinButtonInnerText}>Join now</Text>
                </Pressable>
              </View>
            </View>

            {/* Comments Section */}
            <View style={styles.commentsSection}>
              <View style={styles.commentsHeader}>
                <Text style={styles.commentsTitle}>Comments</Text>
                <Pressable>
                  <Text style={styles.seeAllText}>See all</Text>
                </Pressable>
              </View>

              {mockComments.map((comment) => (
                <View key={comment.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <Image
                      source={comment.avatar || require('@/assets/images/person.png')}
                      style={styles.commentAvatar}
                    />
                    <View style={styles.commentMeta}>
                      <View style={styles.commentTitleRow}>
                        <Text style={styles.commentAuthor}>{comment.author}</Text>
                        <Text style={styles.commentDate}>{comment.date}</Text>
                      </View>
                      <View style={styles.ratingRow}>
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Ionicons
                            key={`${comment.id}-${idx}`}
                            name={idx < comment.rating ? 'star' : 'star-outline'}
                            size={14}
                            color="#0B3979"
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                  <Text style={styles.commentText}>{comment.text}</Text>
                </View>
              ))}
            </View>

            {/* Comment Input */}
            <View style={styles.commentInputWrapper}>
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Write comment..."
                  placeholderTextColor="#97A1B4"
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline={false}
                />
                <Pressable style={styles.sendButton} onPress={handleSendComment}>
                  <Image
                    source={require('@/assets/images/Send.png')}
                    style={styles.sendIcon}
                    resizeMode="contain"
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {isToastVisible && (
        <Animated.View
          style={[
            styles.toastContainer,
            { opacity: toastOpacity, transform: [{ translateY: toastTranslate }] },
          ]}
        >
          <View style={styles.toastIconWrapper}>
            <Image
              source={require('@/assets/images/heart-checkmark.png')}
              style={styles.toastIcon}
            />
          </View>
          <View style={styles.toastTextWrapper}>
            <Text style={styles.toastTitle}>{toastContent.title}</Text>
            <Text style={styles.toastSubtitle}>{toastContent.subtitle}</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#06ABEB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  heroContainer: {
    width: '100%',
    height: 400,
    borderBottomLeftRadius:20,
    borderBottomRightRadius:20,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius:20,
    borderBottomRightRadius:20,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerButtons: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heartIcon: {
    width: 24,
    height: 24,
  },
  heartIconDefault: {
    tintColor: '#111111',
  },
  dateOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 15,
    alignItems: 'center',
    minWidth: 50,
  },
  dateNumber: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FF9B91',
    lineHeight: 33,
  },
  dateMonth: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginTop: -2,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#5ED8D2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 15,
    color: '#000000',
    marginBottom: 20,
    lineHeight: 22,
  },
  participantsSection: {
    marginBottom: 24,
  },
  avatarGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  avatarOuter: {
    zIndex: 2,
  },
  avatarMiddle: {
    zIndex: 1,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  participantsText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#5A647B',
  },
  joinButtonContainer: {
    marginBottom: 32,
  },
  joinButtonOuter: {
    backgroundColor: '#06ABEB',
    borderRadius: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 15,
    paddingRight: 15,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  joinButtonInner: {
    backgroundColor: '#0B3979',
    borderRadius: 120,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  joinButtonInnerText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  commentsSection: {
    marginBottom: 20,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#06ABEB',
  },
  commentCard: {
    marginBottom: 24,
  },
  commentHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  commentMeta: {
    flex: 1,
  },
  commentTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  commentDate: {
    fontSize: 14,
    color: '#97A1B4',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#506080',
    lineHeight: 20,
    marginTop: 8,
    paddingLeft: 60,
  },
  commentInputWrapper: {
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EFF1F7',
    gap: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 8,
    fontSize: 15,
    color: '#000000',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    width: 25,
    height: 25,
    tintColor: '#06ABEB',
  },
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: Platform.OS === 'ios' ? 40 : 20,
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
    backgroundColor: '#FFECEA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  toastIcon: {
    width: 22,
    height: 22,
    tintColor: '#FF9B91',
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

