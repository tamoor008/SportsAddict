import { database } from '@/config/firebase';
import { getCurrentUser } from '@/utils/auth';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { push, ref, set } from 'firebase/database';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
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

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const MORNING_TIMES = ['8:00 am', '9:00 am', '10:00 am', '11:00 am'];
const AFTERNOON_TIMES = ['2:00 pm', '3:00 pm', '4:00 pm', '5:00 pm'];
const EVENING_TIMES = ['6:00 pm', '7:00 pm', '8:00 pm', '9:00 pm'];

export default function AddEventScreen() {
  const navigation = useNavigation<any>();
  const [title, setTitle] = useState('Weekend Marathon');
  const [sportsCategory, setSportsCategory] = useState('NHL');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [description, setDescription] = useState('Wonderful challenge happens this weekend');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isPosting, setIsPosting] = useState(false);
  const calendarSheetRef = useRef<BottomSheet>(null);
  const calendarSnapPoints = useMemo(() => ['80%'], []);
  const monthScrollRef = useRef<ScrollView>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

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

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}.`;
  };

  const formatDateTime = () => {
    if (!selectedDate) return '';
    const dateStr = formatDate(selectedDate);
    const timeStr = selectedTime || '';
    return { date: dateStr, time: timeStr };
  };

  const openCalendarSheet = () => {
    calendarSheetRef.current?.expand();
    // Scroll to current month when opening
    setTimeout(() => {
      if (monthScrollRef.current) {
        const monthWidth = 104; // gap (24) + minWidth (80)
        monthScrollRef.current.scrollTo({
          x: currentMonth * monthWidth,
          animated: true,
        });
      }
    }, 100);
  };

  const closeCalendarSheet = () => {
    calendarSheetRef.current?.close();
  };

  const handleCalendarSheetChange = (index: number) => {
    // Handle sheet state changes if needed
  };

  const renderCalendarBackdrop = useCallback(
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

  const handleDateSelect = (day: number) => {
    setSelectedDay(day);
    const date = new Date(currentYear, currentMonth, day);
    setSelectedDate(date);
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth(monthIndex);
    setSelectedDay(null);
    // Scroll to the selected month
    if (monthScrollRef.current) {
      const monthWidth = 100; // Approximate width per month item
      monthScrollRef.current.scrollTo({
        x: monthIndex * monthWidth,
        animated: true,
      });
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleNext = () => {
    if (!selectedDay || !selectedTime) {
      Alert.alert('Validation Error', 'Please select both date and time');
      return;
    }
    closeCalendarSheet();
  };

  const renderCalendarSheet = () => (
    <BottomSheet
      ref={calendarSheetRef}
      index={-1}
      snapPoints={calendarSnapPoints}
      enablePanDownToClose
      backdropComponent={renderCalendarBackdrop}
      handleIndicatorStyle={styles.sheetHandle}
      onChange={handleCalendarSheetChange}
    >
      <View style={styles.calendarSheetContent}>
        <BottomSheetScrollView 
          showsVerticalScrollIndicator={false} 
          style={{ paddingBottom: 48 }}>
          
          {/* Month Selector */}
          <ScrollView
            ref={monthScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthSelectorContainer}
            style={styles.monthSelectorScroll}
          >
            {MONTHS.map((month, index) => {
              const isActive = currentMonth === index;
              return (
                <Pressable
                  key={index}
                  style={styles.monthItem}
                  onPress={() => handleMonthSelect(index)}
                >
                  <Text style={[styles.monthText, isActive && styles.monthTextActive, !isActive && styles.monthTextInactive]}>
                    {month}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Calendar Grid */}
          {renderCalendar()}

          {/* Time Slots */}
          <View style={styles.timeSection}>
            <Text style={styles.timeSectionTitle}>Morning</Text>
            <View style={styles.timeRow}>
              {MORNING_TIMES.map((time) => renderTimeSlot(time, selectedTime === time))}
            </View>
          </View>

          <View style={styles.timeSection}>
            <Text style={styles.timeSectionTitle}>Afternoon</Text>
            <View style={styles.timeRow}>
              {AFTERNOON_TIMES.map((time) => renderTimeSlot(time, selectedTime === time))}
            </View>
          </View>

          <View style={styles.timeSection}>
            <Text style={styles.timeSectionTitle}>Evening</Text>
            <View style={styles.timeRow}>
              {EVENING_TIMES.map((time) => renderTimeSlot(time, selectedTime === time))}
            </View>
          </View>

          {/* Next Button */}
          <Pressable style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </Pressable>
        </BottomSheetScrollView>
      </View>
    </BottomSheet>
  );

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days: Array<{ day: number; isCurrentMonth: boolean }> = [];
    
    // Get today's date
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    
    // Get previous month's last days
    const prevMonthDays = getDaysInMonth(currentMonth - 1, currentYear);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false });
    }
    
    // Add days of the current month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true });
    }
    
    // Add days from next month to fill the grid (6 rows = 42 cells)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({ day: i, isCurrentMonth: false });
    }

    return (
      <View style={styles.calendarGrid}>
        {DAYS_OF_WEEK.map((day, index) => (
          <View key={index} style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
        {days.map((item, index) => {
          const isSelected = selectedDay === item.day && item.isCurrentMonth;
          const isAvailable = item.isCurrentMonth && [10, 11, 17, 19].includes(item.day);
          const isToday = item.isCurrentMonth && 
                         currentYear === todayYear && 
                         currentMonth === todayMonth && 
                         item.day === todayDay;
          return (
            <Pressable
              key={index}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                isAvailable && !isSelected && styles.dayCellAvailable,
                isToday && !isSelected && styles.dayCellToday,
              ]}
              onPress={() => {
                if (item.isCurrentMonth) {
                  handleDateSelect(item.day);
                }
              }}>
              <Text
                style={[
                  styles.dayText,
                  !item.isCurrentMonth && styles.dayTextInactive,
                  isSelected && styles.dayTextSelected,
                  isAvailable && !isSelected && styles.dayTextAvailable,
                  isToday && !isSelected && styles.dayTextToday,
                ]}>
                {item.day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderTimeSlot = (time: string, isSelected: boolean) => (
    <Pressable
      key={time}
      style={[styles.timeSlot, isSelected && styles.timeSlotSelected]}
      onPress={() => handleTimeSelect(time)}>
      <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextSelected]}>
        {time}
      </Text>
    </Pressable>
  );

  const handlePostEvent = async () => {
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
    if (!selectedDate) {
      Alert.alert('Validation Error', 'Please select a date');
      return;
    }

    const currentUser = getCurrentUser();
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to post an event');
      return;
    }

    setIsPosting(true);

    try {
      const eventDate = new Date(selectedDate);
      const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const eventData = {
        title: title.trim(),
        category: sportsCategory,
        description: description.trim(),
        date: eventDate.getDate().toString(),
        month: MONTHS_SHORT[eventDate.getMonth()],
        fullDate: selectedDate.toISOString(),
        time: selectedTime,
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
        authorId: currentUser.uid,
        authorEmail: currentUser.email || 'Unknown',
      };

      // Save to Firebase Realtime Database - both global and user-specific
      const eventsRef = ref(database, 'liveEvents');
      const newEventRef = push(eventsRef);
      const eventId = newEventRef.key;
      
      // Save to global liveEvents node
      await set(newEventRef, eventData);
      
      // Also save to user-specific liveEvents node
      if (eventId) {
        const userEventsRef = ref(database, `users/${currentUser.uid}/liveEvents/${eventId}`);
        await set(userEventsRef, eventData);
      }

      Alert.alert('Success', 'Event posted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Error posting event:', error);
      Alert.alert('Error', 'Failed to post event. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSportsCategory(category);
    setShowCategoryDropdown(false);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar style="dark" />
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Image
              source={require('@/assets/images/Arrow.png')}
              style={styles.backIcon}
              resizeMode="contain"
            />
          </Pressable>
          <Text style={styles.headerTitle}>Add New Live Event</Text>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          
          {/* Event Image */}
          <View style={styles.imageContainer}>
            <Image
              source={require('@/assets/images/image1.png')}
              style={styles.eventImage}
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
                style={styles.inputWrapper}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}>
                <Text style={[styles.input, !sportsCategory && styles.placeholderText]}>
                  {sportsCategory || 'Select category'}
                </Text>
                <Image
                  source={require('@/assets/images/Arrow.png')}
                  style={[styles.dropdownIcon, showCategoryDropdown && styles.dropdownIconUp]}
                  resizeMode="contain"
                />
              </Pressable>
              {showCategoryDropdown && (
                <ScrollView 
                  style={styles.dropdownList}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}>
                  {SPORTS_CATEGORIES.map((category) => (
                    <Pressable
                      key={category}
                      style={styles.dropdownItem}
                      onPress={() => handleCategorySelect(category)}>
                      <Text style={styles.dropdownItemText}>{category}</Text>
                    </Pressable>
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
                <Image
                  source={require('@/assets/images/Arrow.png')}
                  style={styles.textAreaIcon}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Select Date Field */}
            <View style={styles.inputContainer}>
              <Text style={styles.dateLabel}>Select Date</Text>
              <Pressable style={styles.dateTimeWrapper} onPress={openCalendarSheet}>
                <View style={styles.dateTimeContent}>
                  <View style={styles.dateTimeRow}>
                    <Text style={styles.dateTimeHeading}>Date:</Text>
                    <Text style={[styles.dateTimeValue, !selectedDate && styles.placeholderText]}>
                      {selectedDate ? formatDate(selectedDate) : 'Select date'}
                    </Text>
                  </View>
                  {selectedTime && (
                    <View style={styles.dateTimeRow}>
                      <Text style={styles.dateTimeHeading}>Time:</Text>
                      <Text style={styles.dateTimeValue}>{selectedTime}</Text>
                    </View>
                  )}
                </View>
                <Image
                  source={require('@/assets/images/calenderActive.png')}
                  style={styles.calendarIcon}
                  resizeMode="contain"
                />
              </Pressable>
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
                onPress={handlePostEvent}
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
      {renderCalendarSheet()}
    </GestureHandlerRootView>
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
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#000000',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  imageContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F4F5F6',
  },
  eventImage: {
    width: '100%',
    height: 200,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  placeholderText: {
    color: '#999999',
  },
  dropdownIcon: {
    width: 16,
    height: 16,
    tintColor: '#000000',
    transform: [{ rotate: '90deg' }],
  },
  dropdownIconUp: {
    transform: [{ rotate: '-90deg' }],
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    maxHeight: 200,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#000000',
  },
  textAreaWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F4F5F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 17,
    borderColor: '#E0E0E0',
    minHeight: 100,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    minHeight: 80,
  },
  textAreaIcon: {
    width: 16,
    height: 16,
    tintColor: '#000000',
    marginTop: 4,
    transform: [{ rotate: '90deg' }],
  },
  calendarIcon: {
    width: 20,
    height: 20,
  },
  dateTimeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F5F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 17,
    borderColor: '#E0E0E0',
    minHeight: 60,
  },
  dateTimeContent: {
    flex: 1,
    gap: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTimeHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    minWidth: 45,
  },
  dateTimeValue: {
    fontSize: 16,
    color: '#000000',
    flex: 1,
  },
  mediaSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  mediaSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  uploadButton: {
    backgroundColor: '#F4F5F6',
    borderRadius: 8,
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
    textAlign: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 40,
  },
  postButton: {
    backgroundColor: '#06ABEB',
    borderRadius: 12,
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
  sheetHandle: {
    alignSelf: 'center',
    width: 60,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D7DCE7',
    marginVertical: 8,
  },
  calendarSheetContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  monthSelectorScroll: {
    marginTop: 12,
    marginBottom: 24,
  },
  monthSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  monthItem: {
    alignItems: 'center',
    paddingVertical: 8,
    minWidth: 80,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#999999',
  },
  monthTextActive: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  monthTextInactive: {
    fontSize: 18,
    fontWeight: '400',
    color: '#999999',
  },
  monthIndicator: {
    width: 30,
    height: 2,
    backgroundColor: '#000000',
    marginTop: 4,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: -60,
  },
  dayHeader: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  dayCell: {
    width: '14%',
    marginRight:0.9,
    aspectRatio: 1,
    
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dayCellSelected: {
    backgroundColor: '#06ABEB',
    borderRadius: 10,
  },
  dayCellAvailable: {
    backgroundColor: '#F4F5F6',
    borderRadius: 10,
  },
  dayCellToday: {
    backgroundColor: '#E8F4F8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#06ABEB',
  },
  dayText: {
    fontSize: 16,
    color: '#000000',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dayTextAvailable: {
    color: '#000000',
  },
  dayTextToday: {
    color: '#06ABEB',
    fontWeight: '600',
  },
  dayTextInactive: {
    color: '#000000',
    opacity: 0.5,
  },
  timeSection: {
    marginBottom: 24,
  },
  timeSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    backgroundColor: '#F4F5F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: '#06ABEB',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#06ABEB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

