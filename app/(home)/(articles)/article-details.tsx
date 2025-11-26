import { database } from '@/config/firebase';
import { getCurrentUser } from '@/utils/auth';
import { formatTimeAgo } from '@/utils/time';
import { trackView } from '@/utils/viewHistory';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { DataSnapshot, off, onValue, ref, remove, set } from 'firebase/database';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Article {
  id: string;
  title: string;
  category: string;
  description: string;
  headline?: string;
  secondaryHeadline?: string;
  secondaryDescription?: string;
  createdAt: string;
  timestamp: number;
  authorId: string;
  authorEmail: string;
  authorName?: string;
}

interface Comment {
  id: string;
  author: string;
  date: string;
  rating: number;
  text: string;
}

const mockComments: Comment[] = [
  {
    id: '1',
    author: 'William JR',
    date: '11 Nov, 2020',
    rating: 5,
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.',
  },
  {
    id: '2',
    author: 'Sophia Smith',
    date: '09 Nov, 2020',
    rating: 5,
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.',
  },
];

const getTimeAgo = (timestamp: number): string => {
  return formatTimeAgo(timestamp);
};

const defaultTabBarStyle = {
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#E0E0E0',
  height: Platform.OS === 'ios' ? 88 : 64,
  paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  paddingTop: 8,
};

export default function ArticleDetailsScreen() {
  const route = useRoute();
  const params = route.params as { articleId?: string };
  const normalizedArticleId = params?.articleId;
  const navigation = useNavigation<any>();
  const [article, setArticle] = useState<Article | null>(null);
  const [otherArticles, setOtherArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [toastContent, setToastContent] = useState<{ title: string; subtitle: string }>({
    title: '',
    subtitle: '',
  });
  const [isToastVisible, setIsToastVisible] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslate = useRef(new Animated.Value(20)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    console.log('🟢 [ARTICLE-DETAIL] Tab bar hide useEffect triggered');
    console.log('🟢 [ARTICLE-DETAIL] navigation object:', navigation);
    console.log('🟢 [ARTICLE-DETAIL] navigation.getState():', navigation.getState?.());
    
    const parent = navigation.getParent();
    console.log('🟢 [ARTICLE-DETAIL] parent from getParent():', parent);
    console.log('🟢 [ARTICLE-DETAIL] parent type:', parent?.getState?.()?.type);
    console.log('🟢 [ARTICLE-DETAIL] parent state:', parent?.getState?.());
    
    if (parent) {
      console.log('✅ [ARTICLE-DETAIL] Parent exists, calling setOptions...');
      try {
        parent.setOptions({ tabBarStyle: { display: 'none' } });
        console.log('✅ [ARTICLE-DETAIL] setOptions called successfully');
        
        // Verify the change
        const verifyParent = navigation.getParent();
        console.log('🟢 [ARTICLE-DETAIL] Verification - parent after setOptions:', verifyParent?.getState?.());
      } catch (error) {
        console.error('🔴 [ARTICLE-DETAIL] ERROR calling setOptions:', error);
      }
    } else {
      console.error('🔴 [ARTICLE-DETAIL] ERROR: No parent navigator found!');
    }
    
    return () => {
      console.log('🟢 [ARTICLE-DETAIL] Cleanup function running - restoring tab bar');
      const cleanupParent = navigation.getParent();
      if (cleanupParent) {
        try {
          cleanupParent.setOptions({ tabBarStyle: defaultTabBarStyle });
          console.log('✅ [ARTICLE-DETAIL] Tab bar restored in cleanup');
        } catch (error) {
          console.error('🔴 [ARTICLE-DETAIL] ERROR restoring tab bar:', error);
        }
      }
    };
  }, [navigation]);

  const goToArticlesIndex = useCallback(() => {
    navigation.navigate('(articles)', { screen: 'index' });
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

  useEffect(() => {
    if (!normalizedArticleId) {
      setIsLoading(false);
      return;
    }

    // Scroll to top when article changes
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });

    const articleRef = ref(database, `articles/${normalizedArticleId}`);
    const unsubscribe = onValue(
      articleRef,
      (snapshot: DataSnapshot) => {
        const data = snapshot.val();
        if (data) {
          const articleData = { id: normalizedArticleId, ...data };
          setArticle(articleData);
          // Track view
          trackView(normalizedArticleId, 'article', {
            title: data.title || data.headline || 'Untitled',
            description: data.description || data.title || '',
            category: data.category || 'NHL',
            timestamp: data.timestamp || Date.now(),
          });
        } else {
          setArticle(null);
        }
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [normalizedArticleId]);

  // Check if article is saved
  useEffect(() => {
    const checkSavedStatus = () => {
      const currentUser = getCurrentUser();
      if (!currentUser || !normalizedArticleId) {
        setIsSaved(false);
        return;
      }

      const savedRef = ref(database, `savedItems/${currentUser.uid}/articles/${normalizedArticleId}`);
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
  }, [normalizedArticleId]);

  useEffect(() => {
    const articlesRef = ref(database, 'articles');
    const unsubscribe = onValue(articlesRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (!data) {
        setOtherArticles([]);
        return;
      }
      const list: Article[] = Object.keys(data)
        .map((key) => ({ id: key, ...data[key] }))
        .filter((item) => item.id !== normalizedArticleId)
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        .slice(0, 5);
      setOtherArticles(list);
    });

    return () => {
      unsubscribe();
    };
  }, [normalizedArticleId]);

  const detailSections = useMemo(() => {
    if (!article) return [];
    const sections = [
      {
        headline: article.headline || article.title,
        description: article.description,
      },
    ];
    if (article.secondaryHeadline || article.secondaryDescription) {
      sections.push({
        headline: article.secondaryHeadline || article.headline || article.title,
        description: article.secondaryDescription || '',
      });
    }
    return sections.filter(
      (section) => (section.headline && section.headline.trim().length > 0) || (section.description && section.description.trim().length > 0)
    );
  }, [article]);

  const openArticle = useCallback(
    (id: string) => {
      if (!id || id === normalizedArticleId) {
        return;
      }
      navigation.navigate('(articles)', {
        screen: 'article-details',
        params: { articleId: id },
      });
    },
    [normalizedArticleId, navigation]
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <ActivityIndicator size="large" color="#06ABEB" />
      </SafeAreaView>
    );
  }

  if (!article) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <Text style={styles.emptyTitle}>Article not found</Text>
        <Pressable style={styles.retryButton} onPress={goToArticlesIndex}>
          <Text style={styles.retryText}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <StatusBar style="light" />
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} >
        <View style={styles.heroContainer}>
          <Image source={require('@/assets/images/Card.png')} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroTopRow}>
            <Pressable style={styles.circleButton} onPress={goToArticlesIndex}>
              <Ionicons name="chevron-back" size={22} color="#000000" />
            </Pressable>
            <View style={styles.heroActions}>
              <Pressable
                style={styles.circleButton}
                onPress={async () => {
                  const currentUser = getCurrentUser();
                  if (!currentUser || !normalizedArticleId) {
                    return;
                  }

                  const savedRef = ref(database, `savedItems/${currentUser.uid}/articles/${normalizedArticleId}`);
                  const nextState = !isSaved;

                  try {
                    if (nextState) {
                      // Save article
                      await set(savedRef, {
                        articleId: normalizedArticleId,
                        savedAt: Date.now(),
                      });
                      setIsSaved(true);
                      showToast('Article saved', 'Article in the saved list');
                    } else {
                      // Remove from saved
                      await remove(savedRef);
                      setIsSaved(false);
                      showToast('Removed from saved', 'Article removed from saved list');
                    }
                  } catch (error) {
                    console.error('Error saving/unsaving article:', error);
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
          <View style={styles.heroBottom}>
            <View style={styles.heroTagRow}>
              <Text style={styles.heroTag}>{article.category || 'General'}</Text>
              <Text style={styles.heroTime}>{getTimeAgo(article.timestamp || Date.now())}</Text>
            </View>
            <Text style={styles.heroTitle}>{article.title || article.headline}</Text>
            <View style={styles.authorRow}>
              <Image source={require('@/assets/images/person.png')} style={styles.authorAvatar} />
              <View>
                <Text style={styles.authorName}>
                  {(article.authorName && article.authorName.trim()) ||
                    article.authorEmail?.split('@')[0] ||
                    'Anonymous'}
                </Text>
                
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bodyContainer}>
          {detailSections.map((section, index) => (
            <View key={`${section.headline}-${index}`} style={styles.sectionBlock}>
              <Text style={styles.sectionHeadline}>{section.headline}</Text>
              {section.description ? <Text style={styles.sectionParagraph}>{section.description}</Text> : null}
              {index === 0 && (
                <Image
                  source={require('@/assets/images/image2.png')}
                  style={styles.inlineImage}
                  resizeMode="cover"
                />
              )}
            </View>
          ))}
        </View>

        <View style={styles.engagementRow}>
          <View style={styles.engagementGroup}>
            <Pressable style={styles.engagementButton}>
              <Image
                source={require('@/assets/images/heart-checkmark.png')}
                style={styles.engagementIcon}
                resizeMode="contain"
              />
              <Text style={styles.engagementLabel}>20</Text>
            </Pressable>
            <Pressable style={styles.engagementButton}>
              <Image
                source={require('@/assets/images/comments.png')}
                style={styles.engagementIcon}
                resizeMode="contain"
              />
              <Text style={styles.engagementLabel}>2</Text>
            </Pressable>
          </View>
          <Pressable style={styles.shareButton}>
            <Image
              source={require('@/assets/images/share-arrow.png')}
              style={styles.shareIcon}
              resizeMode="contain"
            />
          </Pressable>
        </View>

        <View style={styles.commentsWrapper}>
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>Comments</Text>
            <Pressable>
              <Text style={styles.seeAllText}>See all</Text>
            </Pressable>
          </View>
          {mockComments.map((comment) => (
            <View key={comment.id} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Image source={require('@/assets/images/person.png')} style={styles.commentAvatar} />
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

        <View style={styles.otherArticlesSection}>
          <Text style={styles.otherTitle}>Other articles for you</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.otherScrollContent}
          >
            {otherArticles.map((item) => (
              <Pressable key={item.id} style={styles.otherCard} onPress={() => openArticle(item.id)}>
                <Image source={require('@/assets/images/image1.png')} style={styles.otherImage} resizeMode="cover" />
                <Text style={styles.otherCardTitle} numberOfLines={2}>
                  {item.title || item.headline || 'Untitled article'}
                </Text>
                <Text style={styles.otherCardDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.otherCardFooter}>
                  <View style={styles.otherAuthorRow}>
                    <Image source={require('@/assets/images/person.png')} style={styles.otherAuthorAvatar} />
                    <Text style={styles.otherAuthorName}>
                      {(item.authorName && item.authorName.trim()) ||
                        item.authorEmail?.split('@')[0] ||
                        'William'}
                    </Text>
                  </View>
                  <Image
                    source={require('@/assets/images/heart-checkmark.png')}
                    style={styles.otherHeartIcon}
                  />
                </View>
              </Pressable>
            ))}
            {otherArticles.length === 0 && (
              <View style={styles.otherEmptyCard}>
                <Text style={styles.otherEmptyText}>No other articles yet.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </ScrollView>
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
    paddingBottom:-40,
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
    marginBottom: 12,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#06ABEB',
    borderRadius: 24,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  heroContainer: {
    position: 'relative',
    width: '100%',
    height: SCREEN_WIDTH * 1.1,
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
    height:25,
    width:25,
  },
  heroBottom: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 30,
    gap: 12,
  },
  heroTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:'space-between',
    gap: 12,
  },
  heroTag: {
    textTransform: 'uppercase',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#5DD8D0',
  },
  heroTime: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },
  authorRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  authorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  authorName: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  authorMeta: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  bodyContainer: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 24,
  },
  engagementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    paddingVertical: 16,
    borderBottomColor: '#F0F0F0',
  },
  engagementGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  engagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 40,
  },
  engagementIcon: {
    width: 30,
    height: 30,
  },
  engagementLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0B3979',
  },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight:20,
  },
  shareIcon: {
    width: 30,
    height: 30,
    tintColor: '#0B3979',
  },
  sectionBlock: {
    gap: 12,
  },
  sectionHeadline: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
  },
  sectionParagraph: {
    fontSize: 15,
    color: '#444444',
    lineHeight: 24,
  },
  inlineImage: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginTop: 8,
  },
  commentsWrapper: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#06ABEB',
  },
  commentCard: {
    backgroundColor: '#F8F9FB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  commentMeta: {
    flex: 1,
    marginLeft: 12,
  },
  commentTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  commentDate: {
    fontSize: 12,
    color: '#8C8C8C',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
  },
  commentText: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    color: '#4E5D78',
  },
  otherArticlesSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  otherTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  otherScrollContent: {
    paddingRight: 20,
    gap: 16,
  },
  otherCard: {
    width: 300,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom:20,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  otherImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginBottom: 12,
  },
  otherCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 6,
  },
  otherCardDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
  },
  otherCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otherAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  otherAuthorAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  otherAuthorName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111111',
  },
  otherHeartIcon: {
    width: 24,
    height: 24,
    tintColor: '#97A1B4',
  },
  otherEmptyCard: {
    width: SCREEN_WIDTH - 40,
    borderRadius: 16,
    padding: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otherEmptyText: {
    color: '#6B7280',
    fontWeight: '600',
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

