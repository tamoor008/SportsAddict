import { database } from '@/config/firebase';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { off, onValue, ref } from 'firebase/database';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDrawer } from '@/contexts/DrawerContext';

const AVATAR_IMAGES = [
  require('@/assets/images/person.png'),
  require('@/assets/images/owner.png'),
  require('@/assets/images/icon.png'),
];

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SEARCH_HISTORY_KEY = '@sports_addict_live_events_last_searches';

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

export default function LiveEventsScreen() {
  const navigation = useNavigation<any>();
  console.log('🔵 [LiveEvents] Component rendering');
  
  let openDrawer: (() => void) | undefined;
  try {
    const drawerContext = useDrawer();
    openDrawer = drawerContext.openDrawer;
    console.log('✅ [LiveEvents] useDrawer() successful, openDrawer:', openDrawer ? 'exists' : 'undefined');
  } catch (error: any) {
    console.error('❌ [LiveEvents] useDrawer() failed:', error?.message || error);
    console.error('❌ [LiveEvents] This usually means DrawerContext.Provider is missing!');
  }
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSearches, setLastSearches] = useState<string[]>([]);
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

  // Set tab bar style on mount and when search state changes
  useEffect(() => {
    const parent = navigation.getParent();
    if (!parent) {
      return;
    }
    parent.setOptions({
      tabBarStyle: isSearchOpen ? { display: 'none' } : defaultTabBarStyle,
    });
  }, [navigation, isSearchOpen, defaultTabBarStyle]);

  // Load events from Firebase
  useEffect(() => {
    const eventsRef = ref(database, 'liveEvents');
    
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const eventsList: LiveEvent[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        // Sort by timestamp (newest first)
        eventsList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setEvents(eventsList);
      } else {
        setEvents([]);
      }
    }, (error) => {
      console.error('Error loading events:', error);
    });

    return () => {
      off(eventsRef);
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

  const persistSearchHistory = async (history: string[]) => {
    try {
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn('Unable to persist search history', error);
    }
  };

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

  // Ensure tab bar style is set when screen is focused
  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      if (!parent) {
        return;
      }
      parent.setOptions({
        tabBarStyle: isSearchOpen ? { display: 'none' } : defaultTabBarStyle,
      });
      // No cleanup - let detail screens manage their own tab bar visibility
    }, [navigation, isSearchOpen, defaultTabBarStyle])
  );

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
  const filteredEvents = useMemo(() => {
    if (!hasActiveFilters) {
      return events;
    }
    return events.filter((event) => activeFilterValues.includes(event.category || ''));
  }, [events, activeFilterValues, hasActiveFilters]);
  const searchResults = useMemo(() => {
    if (!hasSearchTerm) {
      return filteredEvents;
    }
    return filteredEvents.filter((event) => {
      const haystack = `${event.title ?? ''} ${event.description ?? ''} ${event.category ?? ''}`.toLowerCase();
      return haystack.includes(normalizedSearchQuery);
    });
  }, [filteredEvents, normalizedSearchQuery, hasSearchTerm]);
  const searchResultsTitle = useMemo(() => {
    const count = searchResults.length;
    const countLabel = count === 0 ? 'No' : `${count}`;
    const eventLabel = count === 1 ? 'Event' : 'Events';
    if (hasActiveFilters && hasSearchTerm) {
      return `${countLabel} ${eventLabel} match filters and "${searchQuery.trim()}"`;
    }
    if (hasActiveFilters) {
      const filterLabel = activeFilterValues.join(', ');
      return `${countLabel} ${filterLabel} ${eventLabel} Founded`;
    }
    if (hasSearchTerm) {
      return `${countLabel} ${eventLabel} match "${searchQuery.trim()}"`;
    }
    return `${countLabel} ${eventLabel} available`;
  }, [searchResults.length, hasActiveFilters, hasSearchTerm, searchQuery, activeFilterValues]);

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
                placeholder="Find events..."
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

        <ScrollView showsVerticalScrollIndicator={false} style={styles.searchScroll}>
          {!hasActiveFilters && !hasSearchTerm && (
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

          {!hasActiveFilters && !hasSearchTerm && (
            <Text style={[styles.searchSectionTitle, styles.readingHistoryTitle]}>
              Live Event History
            </Text>
          )}

          {searchResults.length === 0 ? (
            <Text style={styles.emptySearchText}>No events match your criteria.</Text>
          ) : hasActiveFilters || hasSearchTerm ? (
            // Full card format when filters/search are active
            searchResults.map((event) => (
              <Pressable
                key={event.id}
                style={styles.eventCard}
                onPress={() => navigation.navigate('(live-events)', {
                  screen: 'event-details',
                  params: { eventId: event.id },
                })}
              >
                <View style={styles.eventImageWrapper}>
                  <Image 
                    source={require('@/assets/images/image1.png')} 
                    style={styles.eventImage} 
                    resizeMode="cover" 
                  />
                  <View style={styles.dateOverlay}>
                    <Text style={styles.dateNumber}>{event.date}</Text>
                    <Text style={styles.dateMonth}>{event.month}</Text>
                  </View>
                  <Pressable style={styles.heartButton}>
                    <Image 
                      source={require('@/assets/images/podcastFav.png')} 
                      style={styles.heartIcon} 
                      resizeMode="contain"
                    />
                  </Pressable>
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDescription} numberOfLines={1} ellipsizeMode="tail">
                    {event.description}
                  </Text>
                  <View style={styles.eventFooter}>
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
                    <Pressable style={styles.primaryButton}>
                      <Text style={styles.primaryButtonText}>Join now</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))
          ) : (
            // Grid format when no filters/search
            <View style={styles.eventsGrid}>
              {searchResults.map((event) => (
                <Pressable
                  key={event.id}
                  style={styles.eventGridCard}
                  onPress={() => {
                    console.log('🔵 [LiveEvents] Opening event detail:', event.id);
                    try {
                      navigation.navigate('event-details', { eventId: event.id });
                      console.log('✅ [LiveEvents] Navigation to event-details dispatched');
                    } catch (error: any) {
                      console.error('❌ [LiveEvents] Navigation error:', error?.message || error);
                      const parentNav = navigation.getParent();
                      if (parentNav) {
                        parentNav.navigate('(live-events)', {
                          screen: 'event-details',
                          params: { eventId: event.id },
                        });
                      }
                    }
                  }}
                >
                  <Image
                    source={require('@/assets/images/image1.png')}
                    style={styles.eventGridImage}
                    resizeMode="cover"
                  />
                  <Text style={styles.eventGridDate}>{event.date} {event.month}</Text>
                  <Text style={styles.eventGridTitle} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text style={styles.eventGridParticipants}>750 participants</Text>
                  <Pressable style={styles.eventGridButton}>
                    <Text style={styles.eventGridButtonText}>View</Text>
                  </Pressable>
                </Pressable>
              ))}
            </View>
          )}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    );
  };

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
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable 
              style={styles.headerButton} 
              onPress={() => {
                console.log('🔵 [LiveEvents] Menu button pressed');
                console.log('🔵 [LiveEvents] openDrawer function:', openDrawer ? 'exists' : 'undefined');
                if (openDrawer) {
                  console.log('🔵 [LiveEvents] Calling openDrawer()');
                  openDrawer();
                } else {
                  console.error('❌ [LiveEvents] openDrawer is undefined!');
                }
              }}>
              <Image
                source={require('@/assets/images/menu.png')}
                style={styles.headerIcon}
                resizeMode="contain"
              />
            </Pressable>
            <Text style={styles.headerTitle}>Live Events</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable 
              style={styles.headerButton}
              onPress={() => {
                console.log('🔵 [LiveEvents] Add event button pressed');
                try {
                  navigation.navigate('add-event');
                  console.log('✅ [LiveEvents] Navigation to add-event dispatched');
                } catch (error: any) {
                  console.error('❌ [LiveEvents] Navigation error:', error?.message || error);
                  const parentNav = navigation.getParent();
                  if (parentNav) {
                    parentNav.navigate('(live-events)', { screen: 'add-event' });
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
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Today</Text>
          </View>

          {events.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No events yet. Create your first event!</Text>
            </View>
          ) : (
            events.map((event) => (
              <Pressable
                key={event.id}
                style={styles.eventCard}
                onPress={() => navigation.navigate('(live-events)', {
                  screen: 'event-details',
                  params: { eventId: event.id },
                })}
              >
                <View style={styles.eventImageWrapper}>
                  <Image 
                    source={require('@/assets/images/image1.png')} 
                    style={styles.eventImage} 
                    resizeMode="cover" 
                  />
                  <View style={styles.dateOverlay}>
                    <Text style={styles.dateNumber}>{event.date}</Text>
                    <Text style={styles.dateMonth}>{event.month}</Text>
                  </View>
                  <Pressable style={styles.heartButton}>
                    <Image 
                      source={require('@/assets/images/podcastFav.png')} 
                      style={styles.heartIcon} 
                      resizeMode="contain"
                    />
                  </Pressable>
                </View>
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDescription} numberOfLines={1} ellipsizeMode="tail">
                    {event.description}
                  </Text>
                  <View style={styles.eventFooter}>
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
                    <Pressable style={styles.primaryButton}>
                      <Text style={styles.primaryButtonText}>Join now</Text>
                    </Pressable>
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
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingBottom: -40,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
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
  headerRight: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
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
  sectionHeading: {
    marginTop: 30,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0B1D3A',
  },
  eventCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 24,

    shadowColor: '#1B19561A',
    shadowOpacity: 0.9,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 4 },
  },
  eventImageWrapper: {
    width: '100%',
    height: 230,
    position: 'relative',
    overflow:'hidden',
    borderTopLeftRadius:16,
    borderTopRightRadius:16,
  },
  eventImage: {
    width: '100%',
    height: '100%',
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
  heartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 16,
    right: 16,
  },
  heartIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: '#FFFFFF',
    
  },
  eventContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
  },
  eventTitle: {
    fontSize: 26,
    fontWeight: '600',
    color: '#0B1D3A',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 15,
    color: '#506080',
    marginBottom: 18,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginRight: 10,
    fontSize: 14,
    color: '#5A647B',
  },
  primaryButton: {
    backgroundColor: '#06ABEB',
    borderRadius: 200,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: 'rgb(250, 250, 250)',
    paddingHorizontal: 20,
    paddingTop: 12,
    zIndex: 10,
  },
  searchSafeArea: {
    flex: 1,
    paddingBottom: -40,
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
    height:40,
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
  filtersAppliedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0C0D14',
    marginBottom: 12,
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
  historyDescription: {
    fontSize: 15,
    color: '#000000',
    fontWeight: 'bold',
    marginBottom: 3,
  },
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
  eventsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  eventGridCard: {
    width: (SCREEN_WIDTH - 40 - 16) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1B19560F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  eventGridImage: {
    width: 80,
    height: 80,
    alignSelf:'center',
    borderRadius:16,
    marginTop:16
  },
  eventGridDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9B91',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  eventGridTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 6,
    paddingHorizontal: 12,
  },
  eventGridParticipants: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 12,
  },
  eventGridButton: {
    backgroundColor: '#E8F4F8',
    borderRadius: 80,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  eventGridButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#06ABEB',
  },
});
