import { database } from '@/config/firebase';
import { getCurrentUser } from '@/utils/auth';
import { formatTimeAgo } from '@/utils/time';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { DataSnapshot, off, onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ActivityItem {
  id: string;
  itemId: string;
  title: string;
  category: string;
  timestamp: number;
  viewedAt: number;
  type: 'article' | 'podcast' | 'live-event';
  description?: string;
}

export default function AuthorProfileScreen() {
  const navigation = useNavigation<any>();
  const currentUser = getCurrentUser();
  const [fullName, setFullName] = useState<string>('William Gross');
  const [articleCount, setArticleCount] = useState<number>(0);
  const [podcastCount, setPodcastCount] = useState<number>(0);
  const [liveStreamCount, setLiveStreamCount] = useState<number>(0);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  // Load user profile data
  useEffect(() => {
    if (!currentUser?.uid) return;

    const personalInfoRef = ref(database, `users/${currentUser.uid}/personalInfo`);
    const unsubscribe = onValue(personalInfoRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data?.fullName) {
        setFullName(data.fullName);
      }
    });

    return () => {
      off(personalInfoRef);
    };
  }, [currentUser?.uid]);

  // Load article count
  useEffect(() => {
    if (!currentUser?.uid) return;

    const articlesRef = ref(database, `users/${currentUser.uid}/articles`);
    const unsubscribe = onValue(articlesRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        setArticleCount(Object.keys(data).length);
      } else {
        setArticleCount(0);
      }
    });

    return () => {
      off(articlesRef);
    };
  }, [currentUser?.uid]);

  // Load podcast count
  useEffect(() => {
    if (!currentUser?.uid) return;

    const podcastsRef = ref(database, `users/${currentUser.uid}/podcasts`);
    const unsubscribe = onValue(podcastsRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        setPodcastCount(Object.keys(data).length);
      } else {
        setPodcastCount(0);
      }
    });

    return () => {
      off(podcastsRef);
    };
  }, [currentUser?.uid]);

  // Load live events count
  useEffect(() => {
    if (!currentUser?.uid) return;

    const liveEventsRef = ref(database, `users/${currentUser.uid}/liveEvents`);
    const unsubscribe = onValue(liveEventsRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        setLiveStreamCount(Object.keys(data).length);
      } else {
        setLiveStreamCount(0);
      }
    });

    return () => {
      off(liveEventsRef);
    };
  }, [currentUser?.uid]);

  // Load recent activities from view history
  useEffect(() => {
    if (!currentUser?.uid) return;

    const viewHistoryRef = ref(database, `users/${currentUser.uid}/viewHistory`);
    const unsubscribe = onValue(viewHistoryRef, async (snapshot: DataSnapshot) => {
      const viewHistoryData = snapshot.val();
      if (!viewHistoryData) {
        setRecentActivities([]);
        return;
      }

      // Convert view history to activity items
      const viewHistoryItems: ActivityItem[] = Object.keys(viewHistoryData).map((key) => ({
        id: key,
        itemId: viewHistoryData[key].itemId,
        title: viewHistoryData[key].title || 'Untitled',
        category: viewHistoryData[key].category || 'NHL',
        timestamp: viewHistoryData[key].timestamp || Date.now(),
        viewedAt: viewHistoryData[key].viewedAt || Date.now(),
        type: viewHistoryData[key].type === 'live-event' ? 'live-event' : (viewHistoryData[key].type as 'article' | 'podcast'),
        description: viewHistoryData[key].description || '',
      }));

      // Filter out live events, then deduplicate by itemId (keep most recent), sort by viewedAt and limit to 10
      const filteredItems = viewHistoryItems.filter((item) => item.type !== 'live-event');
      
      // Deduplicate: keep only the most recent entry for each itemId
      const itemMap = new Map<string, ActivityItem>();
      filteredItems.forEach((item) => {
        const existing = itemMap.get(item.itemId);
        if (!existing || item.viewedAt > existing.viewedAt) {
          itemMap.set(item.itemId, item);
        }
      });

      // Convert map back to array, sort by viewedAt (most recent first) and limit to 10
      const sortedActivities = Array.from(itemMap.values())
        .sort((a, b) => b.viewedAt - a.viewedAt)
        .slice(0, 10);

      setRecentActivities(sortedActivities);
    });

    return () => {
      off(viewHistoryRef);
    };
  }, [currentUser?.uid]);

  const handleEditProfile = () => {
    navigation.navigate('edit-profile');
  };

  const handleOpenArticle = (item: ActivityItem) => {
    if (item.type === 'article') {
      // Navigate to article-details through the Tabs navigator
      navigation.navigate('Tabs', {
        screen: '(articles)',
        params: {
          screen: 'article-details',
          params: { articleId: item.itemId },
        },
      } as any);
    } else if (item.type === 'podcast') {
      // Navigate to podcast-detail
      navigation.navigate('Tabs', {
        screen: '(podcast)',
        params: {
          screen: 'podcast-detail',
          params: { podcastId: item.itemId },
        },
      } as any);
    }
  };

  const renderActivityCard = ({ item }: { item: ActivityItem }) => {
    const timeAgo = formatTimeAgo(item.viewedAt || item.timestamp);
    const isPodcast = item.type === 'podcast';

    return (
      <Pressable
        style={styles.activityCard}
        onPress={() => handleOpenArticle(item)}
      >
        <View style={styles.activityImageWrapper}>
          <Image
            source={require('@/assets/images/image2.png')}
            style={styles.activityImage}
            resizeMode="cover"
          />
          {isPodcast && (
            <View style={styles.playButton}>
              <Image 
                source={require('@/assets/images/played.png')} 
                style={styles.playIcon} 
              />
            </View>
          )}
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityDescription} numberOfLines={2} ellipsizeMode="tail">
            {item.description || item.title || 'Energistically utilize cooperative bandwidth via backend...'}
          </Text>
          <View style={styles.activityMeta}>
            <View style={styles.tagContainer}>
              <Text style={styles.tagText}>{item.category || 'NHL'}</Text>
            </View>
            <View style={styles.metaBottomRow}>
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{timeAgo}</Text>
              </View>
              <View style={styles.metaRight}>
                <Image
                  source={require('@/assets/images/owner.png')}
                  style={styles.ownerImage}
                  resizeMode="cover"
                />
                <Image
                  source={require('@/assets/images/heart-checkmark.png')}
                  style={styles.heartIcon}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={['#A8D5E2', '#C8B5E8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Pattern Overlay - Wavy Lines */}
          

          <View style={styles.header}>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={24} color="#000000" />
            </Pressable>
            <Text style={styles.headerTitle}>My Author Profile</Text>
          </View>

          {/* Profile Image - Half inside gradient, half outside */}
          
        </LinearGradient>
        <View style={styles.profileImageContainer}>
            <Image
              source={require('@/assets/images/profileimage.png')}
              style={styles.profileImage}
              resizeMode="cover"
            />
          </View>
        {/* Profile Info - Outside gradient */}
        <View style={styles.profileInfoContainer}>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{fullName}</Text>
              <Ionicons name="checkmark-circle" size={20} color="#06ABEB" />
            </View>
            <Pressable onPress={handleEditProfile}>
              <Text style={styles.editProfileText}>Edit profile</Text>
            </Pressable>
          </View>
        </View>

        {/* Statistics Section */}
        <View style={styles.statisticsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{articleCount}</Text>
            <Text style={styles.statLabel}>Article</Text>
          </View>
          <View style={styles.statItemP}>
            <Text style={styles.statNumber}>{podcastCount}</Text>
            <Text style={styles.statLabel}>Podcast</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{liveStreamCount}</Text>
            <Text style={styles.statLabel}>Live Stream</Text>
          </View>
        </View>

        {/* Notifications Button */}
        <View style={styles.buttonContainer}>
          <Pressable style={styles.notificationsButton}>
            <Text style={styles.notificationsButtonText}>Receive Notifications</Text>
          </Pressable>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.activitySection}>
          <Text style={styles.activitySectionTitle}>Recent Activity</Text>
          {recentActivities.length === 0 ? (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyActivityText}>No recent activity yet</Text>
            </View>
          ) : (
            <FlatList
              data={recentActivities}
              renderItem={renderActivityCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.activityList}
            />
          )}
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
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 80,
    position: 'relative',
    overflow: 'hidden',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  waveContainer: {
    position: 'absolute',
    height: 300,
  },
  waveSegment: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#06ABEB',
    borderRadius: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
  },
  profileImageContainer: {
    alignItems: 'center',
    bottom:60,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  profileInfoContainer: {
    bottom:40,
    backgroundColor: '#FFFFFF',
    paddingTop: -30,
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
  },
  editProfileText: {
    fontSize: 16,
    color: '#06ABEB',
    fontWeight: '600',
  },
  statisticsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 29,
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
  },
  statItem: {
    alignItems: 'center',
  },
  statItemP: {
    alignItems: 'center',
    left:10
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    backgroundColor: '#FFFFFF',
  },
  notificationsButton: {
    backgroundColor: '#06ABEB',
    borderRadius: 120,
    paddingVertical: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activitySection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
  },
  activitySectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 20,
  },
  activityList: {
    gap: 0,
  },
  activityCard: {
    flexDirection: 'row',
    marginHorizontal: 10,
    marginBottom: 20,
    borderRadius: 12,
    paddingVertical: 9,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
    shadowColor: '#1B1956',
    shadowOffset: { width: 5, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 120,
  },
  activityImageWrapper: {
    width: 100,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  activityImage: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    width: 17,
    height: 17,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    top: '70%',
    left: '60%',
    marginLeft: -17,
    marginTop: -17,
  },
  playIcon: {
    width: 174,
    height: 174,
  },
  activityContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  activityDescription: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 22,
    marginBottom: 12,
  },
  activityMeta: {
    gap: 8,
  },
  tagContainer: {
    backgroundColor: '#5DD8D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  metaBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeContainer: {
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    color: '#75818F',
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ownerImage: {
    width: 30,
    height: 30,
    borderRadius: 12,
  },
  heartIcon: {
    width: 28,
    height: 28,
    tintColor: '#999999',
  },
  emptyActivity: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyActivityText: {
    fontSize: 14,
    color: '#999999',
  },
});

