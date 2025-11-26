import { database } from '@/config/firebase';
import { getCurrentUser } from '@/utils/auth';
import { formatTimeAgo } from '@/utils/time';
import { trackView } from '@/utils/viewHistory';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import { DataSnapshot, get, off, onValue, ref, remove, set } from 'firebase/database';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const defaultTabBarStyle = {
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#E0E0E0',
  height: Platform.OS === 'ios' ? 88 : 64,
  paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  paddingTop: 8,
};

interface Podcast {
  id: string;
  title: string;
  category: string;
  description: string;
  timestamp: number;
  createdAt: string;
  authorId: string;
  authorEmail: string;
}

interface Comment {
  id: string;
  authorName: string;
  authorAvatar: any;
  rating: number;
  date: string;
  text: string;
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: '1',
    authorName: 'William JR',
    authorAvatar: require('@/assets/images/person.png'),
    rating: 5,
    date: '11 Nov, 2020',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incidid ut labore etum dolor sit amet ...',
  },
  {
    id: '2',
    authorName: 'Sophia Smith',
    authorAvatar: require('@/assets/images/owner.png'),
    rating: 5,
    date: '09 Nov, 2020',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incidid ut labore etum dolor sit amet ...',
  },
];

export default function PodcastDetailScreen() {
  const route = useRoute();
  const params = route.params as { podcastId?: string };
  const podcastId = params?.podcastId;
  const navigation = useNavigation<any>();
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [comment, setComment] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(300); // 5 minutes in seconds
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const [toastContent, setToastContent] = useState<{ title: string; subtitle: string }>({
    title: '',
    subtitle: '',
  });
  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslate = useRef(new Animated.Value(20)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const progressBarRef = useRef<View>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    console.log('🔵 [PODCAST-DETAIL] Tab bar hide useEffect triggered');
    console.log('🔵 [PODCAST-DETAIL] navigation object:', navigation);
    console.log('🔵 [PODCAST-DETAIL] navigation.getState():', navigation.getState?.());
    
    const parent = navigation.getParent();
    console.log('🔵 [PODCAST-DETAIL] parent from getParent():', parent);
    console.log('🔵 [PODCAST-DETAIL] parent type:', parent?.getState?.()?.type);
    console.log('🔵 [PODCAST-DETAIL] parent state:', parent?.getState?.());
    
    if (parent) {
      console.log('✅ [PODCAST-DETAIL] Parent exists, calling setOptions...');
      try {
        parent.setOptions({ tabBarStyle: { display: 'none' } });
        console.log('✅ [PODCAST-DETAIL] setOptions called successfully');
        
        // Verify the change
        const verifyParent = navigation.getParent();
        console.log('🔵 [PODCAST-DETAIL] Verification - parent after setOptions:', verifyParent?.getState?.());
      } catch (error) {
        console.error('🔴 [PODCAST-DETAIL] ERROR calling setOptions:', error);
      }
    } else {
      console.error('🔴 [PODCAST-DETAIL] ERROR: No parent navigator found!');
    }
    
    return () => {
      console.log('🔵 [PODCAST-DETAIL] Cleanup function running - restoring tab bar');
      const cleanupParent = navigation.getParent();
      if (cleanupParent) {
        try {
          cleanupParent.setOptions({ tabBarStyle: defaultTabBarStyle });
          console.log('✅ [PODCAST-DETAIL] Tab bar restored in cleanup');
        } catch (error) {
          console.error('🔴 [PODCAST-DETAIL] ERROR restoring tab bar:', error);
        }
      }
    };
  }, [navigation]);

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

  // Check if podcast is saved
  useEffect(() => {
    const checkSavedStatus = () => {
      const currentUser = getCurrentUser();
      if (!currentUser || !podcastId) {
        setIsSaved(false);
        return;
      }

      const savedRef = ref(database, `savedItems/${currentUser.uid}/podcasts/${podcastId}`);
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
  }, [podcastId]);

  // Load podcast data
  useEffect(() => {
    const loadPodcast = async () => {
      if (!podcastId) return;

      try {
        const podcastRef = ref(database, `podcasts/${podcastId}`);
        const snapshot = await get(podcastRef);
        if (snapshot.exists()) {
          const podcastData = snapshot.val();
          setPodcast({
            id: podcastId,
            ...podcastData,
          });
          // Track view
          trackView(podcastId, 'podcast', {
            title: podcastData.title || 'Untitled',
            description: podcastData.description || '',
            category: podcastData.category || 'NHL',
            timestamp: podcastData.timestamp || Date.now(),
          });
        }
      } catch (error) {
        console.error('Error loading podcast:', error);
      }
    };

    loadPodcast();
  }, [podcastId]);

  // Initialize audio
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        // Create a silent audio source (5 minutes of silence)
        // Since we don't have an actual audio file, we'll use a timer-based approach
        // but with expo-av structure for future audio file support
      } catch (error) {
        console.error('Error setting up audio:', error);
      }
    };

    setupAudio();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Audio playback logic with timer
  useEffect(() => {
    if (isPlaying && !isDragging) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, duration, isDragging]);

  const togglePlayPause = async () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (newTime: number) => {
    const clampedTime = Math.max(0, Math.min(newTime, duration));
    setCurrentTime(Math.floor(clampedTime)); // Round down to whole seconds
    // In a real implementation with expo-av, you would do:
    // if (soundRef.current) {
    //   soundRef.current.setPositionAsync(clampedTime * 1000);
    // }
  };

  // PanResponder for dragging progress bar
  const progressBarWidthRef = useRef(0);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        const x = evt.nativeEvent.locationX;
        const width = progressBarWidthRef.current || (SCREEN_WIDTH - 80);
        const percentage = Math.max(0, Math.min(100, (x / width) * 100));
        const newTime = Math.floor((percentage / 100) * duration); // Round to whole seconds
        setDragPosition(percentage);
        handleSeek(newTime);
      },
      onPanResponderMove: (evt) => {
        const x = evt.nativeEvent.locationX;
        const width = progressBarWidthRef.current || (SCREEN_WIDTH - 80);
        const percentage = Math.max(0, Math.min(100, (x / width) * 100));
        const newTime = Math.floor((percentage / 100) * duration); // Round to whole seconds
        setDragPosition(percentage);
        handleSeek(newTime);
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        setDragPosition(0);
        // Resume playback if it was playing
        if (isPlaying) {
          intervalRef.current = setInterval(() => {
            setCurrentTime((prev) => {
              if (prev >= duration) {
                setIsPlaying(false);
                return duration;
              }
              return prev + 1;
            });
          }, 1000);
        }
      },
    })
  ).current;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isDragging ? dragPosition : (duration > 0 ? (currentTime / duration) * 100 : 0);

  const getTimeAgo = (timestamp: number) => {
    return formatTimeAgo(timestamp);
  };

  if (!podcast) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:150}}>
        <View style={styles.heroContainer}>
          <Image 
            source={require('@/assets/images/img22.png')} 
            style={styles.heroImage} 
            resizeMode="cover" 
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroTopRow}>
            <Pressable style={styles.circleButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={22} color="#000000" />
            </Pressable>
            <View style={styles.heroActions}>
              <Pressable
                style={styles.circleButton}
                onPress={async () => {
                  const currentUser = getCurrentUser();
                  if (!currentUser || !podcastId) {
                    return;
                  }

                  const savedRef = ref(database, `savedItems/${currentUser.uid}/podcasts/${podcastId}`);
                  const nextState = !isSaved;

                  try {
                    if (nextState) {
                      // Save podcast
                      await set(savedRef, {
                        podcastId: podcastId,
                        savedAt: Date.now(),
                      });
                      setIsSaved(true);
                      showToast('Podcast saved', 'Podcast in the saved list');
                    } else {
                      // Remove from saved
                      await remove(savedRef);
                      setIsSaved(false);
                      showToast('Removed from saved', 'Podcast removed from saved list');
                    }
                  } catch (error) {
                    console.error('Error saving/unsaving podcast:', error);
                  }
                }}
              >
                <Image
                  source={
                    isSaved
                      ? require('@/assets/images/Path.png')
                      : require('@/assets/images/heart-checkmark.png')
                  }
                  style={[styles.actionIcon, !isSaved && styles.actionIconDefault]}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          {/* Category Tag and Time */}
          <View style={styles.categoryRow}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{podcast.category}</Text>
            </View>
            <Text style={styles.timeAgo}>{getTimeAgo(podcast.timestamp)}</Text>
          </View>

          {/* Title */}
          <Text style={styles.podcastTitle}>{podcast.title}</Text>

          {/* Host Info */}
          <View style={styles.hostInfo}>
            <View style={styles.hostAvatarContainer}>
              <Image
                source={require('@/assets/images/owner.png')}
                style={styles.hostAvatar}
              />
            </View>
            <View style={styles.hostDetails}>
              <View style={styles.hostRow}>
                <Text style={styles.hostName}>William</Text>
              </View>
              <View style={styles.watchingRow}>
                <Image
                  source={require('@/assets/images/Eye.png')}
                  style={styles.eyeIcon}
                  resizeMode="contain"
                />
                <Text style={styles.watchingText}>1k watching</Text>
                <View style={styles.liveBadge}>
                  <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Description */}
          <Text style={styles.description}>{podcast.description}</Text>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <Pressable>
              <Text style={styles.seeAllText}>See all</Text>
            </Pressable>
          </View>

          {MOCK_COMMENTS.map((comment) => (
            <View key={comment.id} style={styles.commentCard}>
              <Image
                source={comment.authorAvatar}
                style={styles.commentAvatar}
              />
              <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                  <Text style={styles.commentDate}>{comment.date}</Text>
                </View>
                <View style={styles.starsContainer}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Ionicons
                      key={index}
                      name="star"
                      size={16}
                      color={index < comment.rating ? '#0B3979' : '#0B3979'}
                    />
                  ))}
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            </View>
          ))}

          {/* Comment Input */}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write comment ..."
              placeholderTextColor="#97A1B4"
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <Pressable style={styles.sendButton}>
              <Image
                source={require('@/assets/images/Send.png')}
                style={styles.sendIcon}
                resizeMode="contain"
              />
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Audio Player Bar */}
      <View style={styles.playerBar}>
        <View style={styles.progressBarContainer}>
          <View 
            ref={progressBarRef}
            style={styles.progressBarWrapper}
            onLayout={(event) => {
              const { width } = event.nativeEvent.layout;
              progressBarWidthRef.current = width;
            }}
            {...panResponder.panHandlers}>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              <View 
                style={[
                  styles.progressHandle, 
                  { left: `${progress}%` }
                ]} 
              />
            </View>
          </View>
          <Text style={styles.timeText}>{formatTime(duration - currentTime)}</Text>
        </View>
        <View style={styles.controlsRow}>
          <Pressable style={styles.controlButton}>
            <Ionicons name="grid-outline" size={24} color="#000000" />
          </Pressable>
          <Pressable style={styles.controlButton}>
            <Ionicons name="play-skip-back" size={24} color="#000000" />
          </Pressable>
          <Pressable 
            style={styles.playPauseButton}
            onPress={togglePlayPause}>
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={32} 
              color="#FFFFFF" 
            />
          </Pressable>
          <Pressable style={styles.controlButton}>
            <Ionicons name="play-skip-forward" size={24} color="#000000" />
          </Pressable>
          <Pressable style={styles.controlButton}>
            <Ionicons name="volume-high-outline" size={24} color="#000000" />
          </Pressable>
        </View>
      </View>
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  heroContainer: {
    position: 'relative',
    width: '100%',
    height: SCREEN_WIDTH * 0.8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  heroTopRow: {
    position: 'absolute',
    top: 60,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionIcon: {
    width: 28,
    height: 28,
  },
  actionIconDefault: {
    tintColor: '#111111',
    height: 25,
    width: 25,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTag: {
    backgroundColor: '#5DD8D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  podcastTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
  },
  timeAgo: {
    fontSize: 14,
    color: '#75818F',
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  hostAvatarContainer: {
    justifyContent: 'flex-start',
  },
  hostAvatar: {
    width: 42,
    height: 42,
    borderRadius: 16,
  },
  hostDetails: {
    flex: 1,
    gap: 4,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hostName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
  },
  watchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  eyeIcon: {
    width: 18,
    height: 18,
  },
  watchingText: {
    fontSize: 14,
    fontWeight:'bold',
  },
  liveBadge: {
    backgroundColor: '#EB1A2C',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 24,
  },
  commentsSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    backgroundColor: '#FFFFFF',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  seeAllText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#06ABEB',
  },
  commentCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  commentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  commentDate: {
    fontSize: 12,
    color: '#75818F',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#4A4F5A',
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F7FB44',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  commentInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 12,
    padding: 4,
  },
  sendIcon: {
    width: 24,
    height: 24,
  },
  playerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingTop: 16,
    paddingHorizontal:40,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  progressBarWrapper: {
    flex: 1,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    position: 'relative',
  },
  progressBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 4,
    backgroundColor: '#06ABEB',
    borderRadius: 2,
  },
  progressHandle: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#06ABEB',
    top: -6,
    marginLeft: -8,
  },
  timeText: {
    fontSize: 14,
    color: '#75818F',
    textAlign: 'right',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'space-between',
  },
  controlButton: {
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#06ABEB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#06ABEB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 30,
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

