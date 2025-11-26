import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
    Image,
    Pressable,
    SectionList,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type NotificationItem = {
  id: string;
  name: string;
  message: string;
  avatar: any;
  thumbnail: any;
};

const notificationSections = [
  {
    title: 'Today',
    data: [
      {
        id: 'today-1',
        name: 'Sansa Indira',
        message: 'commented on your post.',
        avatar: require('@/assets/images/sansa.png'),
        thumbnail: require('@/assets/images/image1.png'),
      },
      {
        id: 'today-2',
        name: 'Sansa Indira',
        message: 'commented on your post.',
        avatar: require('@/assets/images/sansa.png'),
        thumbnail: require('@/assets/images/image2.png'),
      },
      {
        id: 'today-3',
        name: 'Nick Dan',
        message: 'invited you in an event',
        avatar: require('@/assets/images/sansa.png'),
        thumbnail: require('@/assets/images/car1.png'),
      },
    ],
  },
  {
    title: 'Yesterday',
    data: [
      {
        id: 'yesterday-1',
        name: 'Sansa Indira',
        message: 'commented on your post.',
        avatar: require('@/assets/images/sansa.png'),
        thumbnail: require('@/assets/images/image1.png'),
      },
      {
        id: 'yesterday-2',
        name: 'Sansa Indira',
        message: 'commented on your post.',
        avatar: require('@/assets/images/sansa.png'),
        thumbnail: require('@/assets/images/image2.png'),
      },
      {
        id: 'yesterday-3',
        name: 'Nick Dan',
        message: 'invited you in an event',
        avatar: require('@/assets/images/sansa.png'),
        thumbnail: require('@/assets/images/car2.png'),
      },
    ],
  },
];

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <View style={styles.notificationRow}>
      <Image source={item.avatar} style={styles.avatar} />
      <View style={styles.notificationText}>
        <Text style={styles.notificationName}>{item.name}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
      </View>
      <Image source={item.thumbnail} style={styles.thumbnail} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#0D0D0D" />
          </Pressable>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSpacer} />
        </View>

        <SectionList
          sections={notificationSections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section: { title } }) => (
            <Text style={styles.sectionTitle}>{title}</Text>
          )}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#0D0D0D',
  },
  headerSpacer: {
    width: 32,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D0D0D',
    marginTop: 20,
    marginBottom: 18,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  avatar: {
    width: 48,
    height: 48,
  },
  notificationText: {
    flex: 1,
    marginLeft: 16,
  },
  notificationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0D0D0D',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#8791A1',
  },
  thumbnail: {
    width: 46,
    height: 46,
    borderRadius: 12,
  },
});


