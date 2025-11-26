import { database } from '@/config/firebase';
import { getCurrentUser } from '@/utils/auth';
import { formatTimeAgo } from '@/utils/time';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { DataSnapshot, off, onValue, ref } from 'firebase/database';
import { useEffect, useMemo, useState } from 'react';
import {
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MediaItem {
  id: string;
  title: string;
  category: string;
  timestamp: number;
  createdAt: string;
  type: 'article' | 'podcast';
  authorId?: string;
  description?: string;
  authorEmail?: string;
}

const getTimeAgo = (timestamp: number): string => {
  return formatTimeAgo(timestamp);
};

export default function MyMediaScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'all' | 'articles' | 'podcast'>('all');
  const [articles, setArticles] = useState<MediaItem[]>([]);
  const [podcasts, setPodcasts] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentUser = getCurrentUser();

  // Fetch user's articles from user-specific node
  useEffect(() => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    const userArticlesRef = ref(database, `users/${currentUser.uid}/articles`);
    const unsubscribe = onValue(userArticlesRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (!data) {
        setArticles([]);
        setIsLoading(false);
        return;
      }

      const mappedArticles: MediaItem[] = Object.keys(data)
        .map((key) => ({
          id: key,
          ...data[key],
          type: 'article' as const,
        }))
        .map((article) => ({
          ...article,
          timestamp: article.timestamp || Date.now(),
        }));

      // Show user's own articles, sorted by timestamp
      setArticles(
        mappedArticles.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      );
      setIsLoading(false);
    });

    return () => {
      off(userArticlesRef);
    };
  }, [currentUser?.uid]);

  // Fetch user's podcasts from user-specific node
  useEffect(() => {
    if (!currentUser?.uid) {
      return;
    }

    const userPodcastsRef = ref(database, `users/${currentUser.uid}/podcasts`);
    const unsubscribe = onValue(userPodcastsRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (!data) {
        setPodcasts([]);
        return;
      }

      const mappedPodcasts: MediaItem[] = Object.keys(data)
        .map((key) => ({
          id: key,
          ...data[key],
          type: 'podcast' as const,
        }))
        .map((podcast) => ({
          ...podcast,
          timestamp: podcast.timestamp || Date.now(),
        }));

      // Show user's own podcasts, sorted by timestamp
      setPodcasts(
        mappedPodcasts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      );
    });

    return () => {
      off(userPodcastsRef);
    };
  }, [currentUser?.uid]);

  // Combine and sort all media items
  const allMedia = useMemo(() => {
    const combined = [...articles, ...podcasts];
    return combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [articles, podcasts]);

  // Get filtered media based on active tab
  const filteredMedia = useMemo(() => {
    if (activeTab === 'articles') {
      return [...articles].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }
    if (activeTab === 'podcast') {
      return [...podcasts].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    }
    return allMedia;
  }, [activeTab, articles, podcasts, allMedia]);

  const handleOpenMedia = (item: MediaItem) => {
    // Navigate to Tabs (the tab navigator), then to the nested screens
    // Tabs -> (articles)/(podcast) -> detail screen
    if (item.type === 'podcast') {
      navigation.navigate('Tabs', {
        screen: '(podcast)',
        params: {
          screen: 'podcast-detail',
          params: { podcastId: item.id },
        },
      } as any);
      return;
    }

    navigation.navigate('Tabs', {
      screen: '(articles)',
      params: {
        screen: 'article-details',
        params: { articleId: item.id },
      },
    } as any);
  };

  const renderPodcastCard = (item: MediaItem) => {
    const timeAgo = getTimeAgo(item.timestamp || Date.now());

    return (
      <Pressable style={styles.podcastCard} onPress={() => handleOpenMedia(item)}>
        <View style={styles.podcastImageWrapper}>
          <Image
            source={require('@/assets/images/image1.png')}
            style={styles.podcastImage}
            resizeMode="cover"
          />
          <View style={styles.podcastPlayButton}>
            <Image source={require('@/assets/images/played.png')} style={styles.podcastPlayIcon} />
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description || item.title || 'Energistically utilize cooperative bandwidth via backend...'}
          </Text>
          <View style={styles.cardMeta}>
            <View style={styles.tagChip}>
              <Text style={styles.tagText}>{item.category || 'NHL'}</Text>
            </View>
            <View style={styles.metaBottomRow}>
              <Text style={styles.timeText}>Live {timeAgo}</Text>
              <View style={styles.metaRight}>
                <Image source={require('@/assets/images/person.png')} style={styles.avatar} />
                <Image source={require('@/assets/images/heart-checkmark.png')} style={styles.heartIcon} />
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderArticleCard = (item: MediaItem) => {
    const timeAgo = getTimeAgo(item.timestamp || Date.now());

    return (
      <Pressable style={styles.articleCard} onPress={() => handleOpenMedia(item)}>
        <Image
          source={require('@/assets/images/image2.png')}
          style={styles.articleImage}
          resizeMode="cover"
        />
        <View style={styles.cardBody}>
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description || item.title || 'Energistically utilize cooperative bandwidth via backend...'}
          </Text>
          <View style={styles.cardMeta}>
            <View style={styles.tagChip}>
              <Text style={styles.tagText}>{item.category || 'NHL'}</Text>
            </View>
            <View style={styles.metaBottomRow}>
              <Text style={styles.timeText}>{timeAgo}</Text>
              <View style={styles.metaRight}>
                <Image source={require('@/assets/images/owner.png')} style={styles.avatar} />
                <Image source={require('@/assets/images/heart-checkmark.png')} style={styles.heartIcon} />
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  const renderMediaCard = ({ item }: { item: MediaItem }) => {
    return item.type === 'podcast' ? renderPodcastCard(item) : renderArticleCard(item);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </Pressable>
        <Text style={styles.headerTitle}>My Media</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}>
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All
          </Text>
          {activeTab === 'all' && <View style={styles.tabIndicator} />}
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'articles' && styles.activeTab]}
          onPress={() => setActiveTab('articles')}>
          <Text style={[styles.tabText, activeTab === 'articles' && styles.activeTabText]}>
            Articles
          </Text>
          {activeTab === 'articles' && <View style={styles.tabIndicator} />}
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'podcast' && styles.activeTab]}
          onPress={() => setActiveTab('podcast')}>
          <Text style={[styles.tabText, activeTab === 'podcast' && styles.activeTabText]}>
            Podcast
          </Text>
          {activeTab === 'podcast' && <View style={styles.tabIndicator} />}
        </Pressable>
      </View>

      {/* Media List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : filteredMedia.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No {activeTab === 'all' ? 'media' : activeTab === 'articles' ? 'articles' : 'podcasts'} yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMedia}
          renderItem={renderMediaCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
    width: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginLeft: 28,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    // Active tab styling
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8C8C8C',
  },
  activeTabText: {
    color: '#000000',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: '50%',
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#05B1FF',
  },
  listContent: {
    paddingTop: 24,
    paddingBottom: 32,
  },
  podcastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
    shadowColor: '#1B1956',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 20,
    gap: 16,
    width: '100%',
    overflow: 'hidden',
  },
  podcastImageWrapper: {
    width: 100,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  podcastImage: {
    width: '100%',
    height: '100%',
  },
  podcastPlayButton: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  podcastPlayIcon: {
    top:10,
    width: 130,
    height: 130,
  },
  articleCard: {
    flexDirection: 'row',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderColor: '#E0E0E0',
    shadowColor: '#1B1956',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 20,
    minHeight: 120,
    width: '100%',
    overflow: 'hidden',
  },
  articleImage: {
    width: 100,
    height: 120,
    borderRadius: 12,
    marginRight: 16,
  },
  cardBody: {
    flex: 1,
    paddingVertical: 4,
    justifyContent: 'space-between',
    minWidth: 0,
  },
  cardDescription: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 22,
    marginBottom: 8,
    flexShrink: 1,
  },
  cardMeta: {
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#5DD8D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  metaBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeText: {
    fontSize: 12,
    color: '#5E6478',
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  heartIcon: {
    width: 26,
    height: 26,
    tintColor: '#97A1B4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8C8C8C',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8C8C8C',
  },
});

