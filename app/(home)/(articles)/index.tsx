import { database } from '@/config/firebase';
import { formatTimeAgo } from '@/utils/time';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { DataSnapshot, onValue, ref } from 'firebase/database';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Easing, Image, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDrawer } from '@/contexts/DrawerContext';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

// Helper function to calculate time ago
const getTimeAgo = (timestamp: number): string => {
  return formatTimeAgo(timestamp);
};

// Helper function to truncate text to 2 lines (approximately)
const truncateToTwoLines = (text: string, maxLength: number = 80): string => {
  if (text.length <= maxLength) {
    return text;
  }
  // Truncate and add ellipsis
  return text.substring(0, maxLength).trim() + '...';
};

const SEARCH_HISTORY_KEY = '@sports_addict_last_searches';

const FILTER_GROUPS = [
  {
    key: 'pro',
    title: 'Pro Sports',
    options: ['MLB(sport)', 'NHL', 'NBA', 'NFL', 'Soccer', 'WWE'],
  },
  {
    key: 'college',
    title: 'College',
    options: ['Basketball', 'Football', 'Lacrosse', 'Hockey'],
  },
  {
    key: 'high',
    title: 'High School',
    options: ['Baseball', 'Basketball'],
  },
] as const;

type FilterGroupKey = (typeof FILTER_GROUPS)[number]['key'];
type FilterSelections = Record<FilterGroupKey, string | null>;

const createEmptySelections = (): FilterSelections =>
  FILTER_GROUPS.reduce((acc, group) => {
    acc[group.key] = null;
    return acc;
  }, {} as FilterSelections);

export default function ArticlesScreen() {
  const navigation = useNavigation<any>();
  console.log('🔵 [Articles] Component rendering');
  
  let openDrawer: (() => void) | undefined;
  try {
    const drawerContext = useDrawer();
    openDrawer = drawerContext.openDrawer;
    console.log('✅ [Articles] useDrawer() successful, openDrawer:', openDrawer ? 'exists' : 'undefined');
  } catch (error: any) {
    console.error('❌ [Articles] useDrawer() failed:', error?.message || error);
    console.error('❌ [Articles] This usually means DrawerContext.Provider is missing!');
  }
  const [activePage, setActivePage] = useState(0);
  const [articles, setArticles] = useState<Article[]>([]);
  const carouselRef = useRef<ScrollView>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSearches, setLastSearches] = useState<string[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const searchSlide = useRef(new Animated.Value(0)).current;
  const filterSheetRef = useRef<BottomSheet>(null);
  const filterSnapPoints = useMemo(() => ['80%'], []);
  const [pendingFilters, setPendingFilters] = useState<FilterSelections>(createEmptySelections());
  const [appliedFilters, setAppliedFilters] = useState<FilterSelections>(createEmptySelections());
  const defaultTabBarStyle = useMemo(
    () => ({
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E0E0E0',
      height: Platform.OS === 'ios' ? 88 : 64,
      paddingBottom: Platform.OS === 'ios' ? 24 : 8,
      paddingTop: 8,
    }),
    []
  );

  const renderFilterBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleOpenArticle = useCallback(
    (article: Article) => {
      console.log('🔵 [Articles] handleOpenArticle called for article:', article.id);
      try {
        // Navigate directly to article-details within the same stack
        navigation.navigate('article-details', { articleId: article.id });
        console.log('✅ [Articles] Navigation to article-details dispatched');
      } catch (error: any) {
        console.error('❌ [Articles] Navigation error:', error?.message || error);
        // Fallback: try navigating through the tab
        try {
          const parentNav = navigation.getParent();
          if (parentNav) {
            parentNav.navigate('(articles)', {
              screen: 'article-details',
              params: { articleId: article.id },
            });
            console.log('✅ [Articles] Fallback navigation through parent dispatched');
          } else {
            console.error('❌ [Articles] No parent navigator found');
          }
        } catch (fallbackError: any) {
          console.error('❌ [Articles] Fallback navigation also failed:', fallbackError?.message || fallbackError);
        }
      }
    },
    [navigation]
  );

  useEffect(() => {
    const parent = navigation.getParent();
    if (!parent) {
      return;
    }
    parent.setOptions({
      tabBarStyle: isSearchOpen ? { display: 'none' } : defaultTabBarStyle,
    });

    return () => {
      parent.setOptions({ tabBarStyle: defaultTabBarStyle });
    };
  }, [navigation, isSearchOpen, defaultTabBarStyle]);

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    setActivePage(page);
  };


  // Fetch articles from Firebase Realtime Database
  useEffect(() => {
    const articlesRef = ref(database, 'articles');

    const unsubscribe = onValue(
      articlesRef,
      (snapshot: DataSnapshot) => {
        const articlesData = snapshot.val();
        if (articlesData) {
          const articlesList: Article[] = Object.keys(articlesData)
            .map((key) => ({
              id: key,
              ...articlesData[key],
            }))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Sort by newest first

          setArticles(articlesList);
        } else {
          setArticles([]);
        }
      },
      (error) => {
        console.error('Error fetching articles:', error);
        Alert.alert('Error', 'Failed to load articles');
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const stored = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
        if (stored) {
          setLastSearches(JSON.parse(stored));
        }
      } catch (error) {
        console.warn('Unable to load search history', error);
      }
    };
    fetchHistory();
  }, []);

  // Keyboard event listeners for search section
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  const persistSearchHistory = async (history: string[]) => {
    try {
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn('Unable to persist search history', error);
    }
  };

  const openSearchModal = () => {
    setIsSearchOpen(true);
    Animated.timing(searchSlide, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const closeSearchModal = () => {
    Animated.timing(searchSlide, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsSearchOpen(false);
      }
    });
  };

  const handleSearchSubmit = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return;
    }
    setLastSearches((prev) => {
      const updated = [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, 3);
      persistSearchHistory(updated);
      return updated;
    });
    setSearchQuery(trimmed);
  };

  const handleDeleteSearch = (term: string) => {
    setLastSearches((prev) => {
      const updated = prev.filter((item) => item !== term);
      persistSearchHistory(updated);
      return updated;
    });
  };

  const activeFilterValues = useMemo(
    () => Object.values(appliedFilters).filter((value): value is string => Boolean(value)),
    [appliedFilters]
  );
  const hasActiveFilters = activeFilterValues.length > 0;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const hasSearchTerm = normalizedSearchQuery.length > 0;
  const filteredArticles = useMemo(() => {
    if (!hasActiveFilters) {
      return articles;
    }
    return articles.filter((article) => activeFilterValues.includes(article.category));
  }, [articles, activeFilterValues, hasActiveFilters]);
  const searchResults = useMemo(() => {
    if (!hasSearchTerm) {
      return filteredArticles;
    }
    return filteredArticles.filter((article) => {
      const haystack = `${article.title ?? ''} ${article.headline ?? ''} ${article.secondaryHeadline ?? ''} ${article.description ?? ''} ${article.secondaryDescription ?? ''} ${article.category ?? ''}`.toLowerCase();
      return haystack.includes(normalizedSearchQuery);
    });
  }, [filteredArticles, normalizedSearchQuery, hasSearchTerm]);
  const searchResultsTitle = useMemo(() => {
    const count = searchResults.length;
    const countLabel = count === 0 ? 'No' : `${count}`;
    const articleLabel = count === 1 ? 'Article' : 'Articles';
    if (hasActiveFilters && hasSearchTerm) {
      return `${countLabel} ${articleLabel} match filters and "${searchQuery.trim()}"`;
    }
    if (hasActiveFilters) {
      const filterLabel = activeFilterValues.join(', ');
      return `${countLabel} ${filterLabel} ${articleLabel} Founded`;
    }
    if (hasSearchTerm) {
      return `${countLabel} ${articleLabel} match "${searchQuery.trim()}"`;
    }
    return `${countLabel} ${articleLabel} available`;
  }, [searchResults.length, hasActiveFilters, hasSearchTerm, searchQuery, activeFilterValues]);
  const visibleArticles = filteredArticles;

  const openFilterSheet = () => {
    setPendingFilters({ ...appliedFilters });
    filterSheetRef.current?.expand();
  };

  const closeFilterSheet = () => {
    filterSheetRef.current?.close();
  };

  const handleFilterSheetChange = (index: number) => {
    if (index === -1) {
      setPendingFilters({ ...appliedFilters });
    }
  };

  const togglePendingFilter = (groupKey: FilterGroupKey, option: string) => {
    setPendingFilters((prev) => ({
      ...prev,
      [groupKey]: prev[groupKey] === option ? null : option,
    }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...pendingFilters });
    closeFilterSheet();
  };

  const handleResetFilters = () => {
    const reset = createEmptySelections();
    setPendingFilters(reset);
    setAppliedFilters(reset);
  };
  const renderSearchSection = () => {
    const translateY = searchSlide.interpolate({
      inputRange: [0, 1],
      outputRange: [SCREEN_HEIGHT, 0],
    });

    return (
      <Animated.View
        pointerEvents={isSearchOpen ? 'auto' : 'none'}
        style={[styles.searchOverlay, { transform: [{ translateY }] }]}
      >
        <SafeAreaView style={styles.searchSafeArea}>
          <View style={styles.searchTopRow}>
            <Pressable style={styles.backButton} onPress={closeSearchModal}>
              <Image
                source={require('@/assets/images/Arrow.png')}
                style={styles.backIcon}
                resizeMode="contain"
              />
            </Pressable>
            <View style={styles.searchInputContainer}>
              <Image
                source={require('@/assets/images/search.png')}
                style={styles.searchInputIcon}
                resizeMode="contain"
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Find articles..."
                placeholderTextColor="#97A1B4"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                onSubmitEditing={handleSearchSubmit}
              />
              <Pressable style={styles.filterInlineButton} onPress={openFilterSheet}>
                <Image
                  source={require('@/assets/images/filter.png')}
                  style={styles.filterIcon}
                  resizeMode="contain"
                />
              </Pressable>
            </View>
          </View>

        <Text style={styles.filtersAppliedTitle}>{searchResultsTitle}</Text>

        <ScrollView 
          showsVerticalScrollIndicator={false} 
          style={styles.searchScroll}
          contentContainerStyle={{ paddingBottom: keyboardHeight }}>
          {!hasActiveFilters && (
            <>
              <Text style={[styles.searchSectionTitle, styles.readingHistoryTitle]}>
                Last search
              </Text>
              {lastSearches.length === 0 ? (
                <Text style={styles.emptySearchText}>No recent searches yet.</Text>
              ) : (
                lastSearches.map((item) => (
                  <Pressable
                    key={item}
                    style={styles.lastSearchRow}
                    onPress={() => setSearchQuery(item)}
                  >
                    <Text style={styles.lastSearchText}>{item}</Text>
                    <Pressable onPress={() => handleDeleteSearch(item)}>
                      <Image
                        source={require('@/assets/images/close.png')}
                        style={styles.lastSearchDelete}
                        resizeMode="contain"
                      />
                    </Pressable>
                  </Pressable>
                ))
              )}
            </>
          )}

          {!hasActiveFilters && (
            <Text style={[styles.searchSectionTitle, styles.readingHistoryTitle]}>
              Reading history
            </Text>
          )}

          {searchResults.length === 0 ? (
            <Text style={styles.emptySearchText}>No articles match your criteria.</Text>
          ) : (
            searchResults.map((article) => (
              <Pressable
                key={article.id}
                style={styles.historyCard}
                onPress={() => handleOpenArticle(article)}
              >
                <Image
                  source={require('@/assets/images/image2.png')}
                  style={styles.historyImage}
                  resizeMode="cover"
                />
                <View style={styles.historyContent}>
                 
                  <Text style={styles.historyDescription} numberOfLines={2}>
                    {article.description}
                  </Text>
                  <View style={styles.historyTagRow}>
                    <Text style={styles.historyTag}>{article.category}</Text>
                  </View>
                  <View style={styles.historyFooter}>
                    <Text style={styles.historyTime}>
                      {getTimeAgo(article.timestamp || Date.now())}
                    </Text>
                    <View style={styles.historyFooterRight}>
                      <Image
                        source={require('@/assets/images/owner.png')}
                        style={styles.historyAvatar}
                      />
                      <Pressable onPress={(event) => event.stopPropagation?.()}>
                        <Image
                          source={require('@/assets/images/heart-checkmark.png')}
                          style={styles.historyHeart}
                          resizeMode="contain"
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))
          )}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    );
  };

  const latestArticles = useMemo(() => {
    if (!articles.length) {
      return [];
    }
    return articles.slice(0, 5);
  }, [articles]);

  const renderFilterSheet = () => (
    <BottomSheet
      ref={filterSheetRef}
      index={-1}
      snapPoints={filterSnapPoints}
      enablePanDownToClose
      backdropComponent={renderFilterBackdrop}
      handleIndicatorStyle={styles.filterSheetHandle}
      onChange={handleFilterSheetChange}
    >
      <View style={styles.filterSheetContent}>
        <Text style={styles.filterSheetTitle}>Filters</Text>
        <BottomSheetScrollView showsVerticalScrollIndicator={false} style={{paddingBottom: 48}}>
          {FILTER_GROUPS.map((group) => (
            <View key={group.key} style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>{group.title}</Text>
              <View style={styles.filterPillRow}>
                {group.options.map((option) => {
                  const isActive = pendingFilters[group.key] === option;
                  return (
                    <Pressable
                      key={`${group.key}-${option}`}
                      style={[styles.filterPill, isActive && styles.filterPillActive]}
                      onPress={() => togglePendingFilter(group.key, option)}
                    >
                      <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
                <View style={styles.filterFooter}>
          <Pressable style={styles.resetButton} onPress={handleResetFilters}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </Pressable>
          <Pressable style={styles.applyButton} onPress={handleApplyFilters}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </Pressable>
        </View>
        </BottomSheetScrollView>
   
      </View>
    </BottomSheet>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable 
              style={styles.headerButton} 
              onPress={() => {
                console.log('🔵 [Articles] Menu button pressed');
                console.log('🔵 [Articles] openDrawer function:', openDrawer ? 'exists' : 'undefined');
                if (openDrawer) {
                  console.log('🔵 [Articles] Calling openDrawer()');
                  openDrawer();
                } else {
                  console.error('❌ [Articles] openDrawer is undefined!');
                }
              }}>
              <Image
                source={require('@/assets/images/menu.png')}
                style={styles.headerIcon}
                resizeMode="contain"
              />
            </Pressable>
            <Text style={styles.headerTitle}>Articles</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable 
              style={styles.headerButton}
              onPress={() => {
                console.log('🔵 [Articles] Add article button pressed');
                try {
                  navigation.navigate('add-articles');
                  console.log('✅ [Articles] Navigation to add-articles dispatched');
                } catch (error: any) {
                  console.error('❌ [Articles] Navigation error:', error?.message || error);
                  // Fallback: try navigating through the tab
                  const parentNav = navigation.getParent();
                  if (parentNav) {
                    parentNav.navigate('(articles)', { screen: 'add-articles' });
                  }
                }
              }}>
              <Image
                source={require('@/assets/images/add.png')}
                style={styles.headerIcon}
                resizeMode="contain"
              />
            </Pressable>
            <Pressable style={styles.headerButton} onPress={openSearchModal}>
              <Image
                source={require('@/assets/images/search.png')}
                style={styles.headerIcon}
                resizeMode="contain"
              />
            </Pressable>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          
          {/* News Section */}
          <Text style={styles.sectionTitle}>News</Text>
          
          {/* Featured Article Carousel */}
          <View style={styles.carouselContainer}>
            {latestArticles.length === 0 ? (
              <View style={styles.emptyNews}>
                <Text style={styles.emptyNewsText}>
                  No recent articles yet. Publish one to see it here!
                </Text>
              </View>
            ) : (
              <ScrollView
                ref={carouselRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                decelerationRate="fast"
                bounces={false}>
                {latestArticles.map((article, index) => (
                  <Pressable 
                    key={article.id} 
                    style={styles.featuredCard}
                    onPress={() => handleOpenArticle(article)}
                  >
                    <View style={styles.cardInner}>
                      <Image
                        source={require('@/assets/images/image1.png')}
                        style={styles.featuredImage}
                        resizeMode="cover"
                      />
                      <View style={styles.imageOverlay} />
                      <View style={styles.featuredOverlay}>
                        <View style={styles.featuredContent}>
                      <Text style={styles.featuredTag}>{article.category || 'News'}</Text>
                      <Text style={styles.featuredTitle} numberOfLines={3}>
                        {article.description || article.title || 'Latest update'}
                      </Text>
                          <View style={styles.authorContainer}>
                            <Image
                              source={require('@/assets/images/owner.png')}
                              style={styles.featuredOwnerImage}
                              resizeMode="cover"
                            />
                            <Text style={styles.authorText}>
                              {(article.authorName && article.authorName.trim()) ||
                                article.authorEmail?.split('@')[0] ||
                                'Author'}{' '}
                                • {getTimeAgo(article.timestamp || Date.now())}
                            </Text>
                          </View>
                          <View style={styles.paginationContainer}>
                            {latestArticles.map((_, dotIndex) => (
                              <View
                                key={`${article.id}-${dotIndex}`}
                                style={[
                                  styles.paginationDot,
                                  dotIndex === index && styles.paginationDotActive,
                                ]}
                              />
                            ))}
                          </View>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Popular Section */}
          <Text style={styles.sectionTitle}>Popular</Text>
          
          {/* Popular Article Cards */}
          {articles.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No articles yet. Be the first to post!
              </Text>
            </View>
          ) : visibleArticles.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No articles match the active filters.
              </Text>
            </View>
          ) : (
            visibleArticles.map((article) => (
              <Pressable
                key={article.id}
                style={styles.popularCard}
                onPress={() => handleOpenArticle(article)}
              >
                <Image
                  source={require('@/assets/images/image2.png')}
                  style={styles.popularImage}
                  resizeMode="cover"
                />
                <View style={styles.popularContent}>
                  <Text style={styles.popularDescription} numberOfLines={2} ellipsizeMode="tail">
                    {article.description}
                  </Text>
                  <View style={styles.popularMeta}>
                    <View style={styles.tagContainer}>
                      <Text style={styles.tagText}>{article.category}</Text>
                    </View>
                    <View style={styles.metaBottomRow}>
                      <View style={styles.timeContainer}>
                        <Text style={styles.timeText}>
                          {getTimeAgo(article.timestamp || Date.now())}
                        </Text>
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
            ))
          )}
        </ScrollView>
        {isSearchOpen && renderSearchSection()}
      </SafeAreaView>
      {renderFilterSheet()}
    </GestureHandlerRootView>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  headerIcon: {
    width: 28,
    height: 28,
    tintColor: '#000000',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  carouselContainer: {
    marginBottom: 32,
    height: 380,
    overflow: 'hidden',
  },
  emptyNews: {
    height: 380,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyNewsText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  featuredCard: {
    width: SCREEN_WIDTH,
    height: 380,
    paddingHorizontal: 20,
  },
  cardInner: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.21)',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  featuredContent: {
    gap: 16,
    alignItems: 'center',
  },
  featuredTag: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    backgroundColor: '#5DD8D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 24,
    textAlign: 'center',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featuredOwnerImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  authorText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  paginationContainer: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 27,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  paginationDotActive: {
    backgroundColor: '#06ABEB',
  },
  popularCard: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    paddingHorizontal:20,
    paddingVertical:9,
    overflow: 'hidden',
    backgroundColor: '#FFFFFFF',
    borderColor: '#E0E0E0',
    shadowColor: '#1B1956',
    shadowOffset: { width:5, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 120,
  },
  popularImage: {
    width: 100,
    height: 120,
    borderRadius:12,
  },
  popularContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  popularDescription: {
    fontSize: 15,
    fontWeight: '400',
    color: '#000000',
    lineHeight: 22,
    marginBottom: 12,
  },
  popularMeta: {
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
  emptyState: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
  },
  searchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    zIndex: 10,
  },
  searchSafeArea: {
    flex: 1,
    paddingBottom:-40,
  },
  searchTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 26,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 40,
    height: 40,
    tintColor: '#000000',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F7FB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 1,
    minHeight: 58,
  },
  searchInputIcon: {
    width: 20,
    height: 20,
    tintColor: '#9AA4B1',
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
  },

  filterInlineButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    width: 24,
    height: 24,
  },
  searchScroll: {
    flex: 1,
  },
  searchSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 18,
  },
  emptySearchText: {
    fontSize: 14,
    color: '#8D96A4',
    marginBottom: 16,
  },
  lastSearchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E3E7EF',
  },
  lastSearchText: {
    fontSize: 16,
    color: '#0C0D14',
    fontWeight: '500',
  },
  lastSearchDelete: {
    width: 18,
    height: 18,
    tintColor: '#9FA9BB',
  },
  readingHistoryTitle: {
    marginTop: 32,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 18,
    shadowColor: '#0F1A2C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  historyImage: {
    width: 90,
    height: 90,
    borderRadius: 16,
    marginRight: 12,
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0C0D14',
    marginBottom: 8,
  },
  historyDescription: {
    fontSize: 15,
    color: '#000000',
    fontWeight:'bold',
marginBottom:3  },
  historyTagRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  historyTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: '#5ED8D2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 3,
  },
  historyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyTime: {
    fontSize: 13,
    color: '#97A1B4',
  },
  historyFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  historyHeart: {
    width: 24,
    height: 24,
    tintColor: '#CBD1DD',
  },
  searchResultCard: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E3E7EF',
  },
  searchResultImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  searchResultContent: {
    flex: 1,
    gap: 6,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C0D14',
  },
  searchResultDescription: {
    fontSize: 13,
    color: '#4A4F5A',
  },
  searchResultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterSheetContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  filterSheetHandle: {
    alignSelf: 'center',
    width: 60,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D7DCE7',
    marginVertical: 8,
  },
  filterSheetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0C0D14',
    textAlign: 'center',
    marginBottom: 24,
  },
  filterGroup: {
    marginBottom: 24,
  },
  filterGroupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C0D14',
    marginBottom: 12,
  },
  filterPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterPill: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterPillActive: {
    backgroundColor: '#06ABEB',
  },
  filterPillText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C0D14',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  selectedFiltersContainer: {
    backgroundColor: '#F6F7FB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  selectedFiltersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedFiltersLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C0D14',
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#06ABEB',
  },
  selectedFiltersPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectedFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CFD5E2',
    gap: 8,
  },
  selectedFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0C0D14',
  },
  selectedFilterClose: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E3E7EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedFilterCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0C0D14',
    marginTop: -1,
  },
  filtersAppliedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0C0D14',
    marginBottom: 12,
  },
  filterFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 8,
  },
  resetButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CFD5E2',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C0D14',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#06ABEB',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

