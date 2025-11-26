import { database } from '@/config/firebase';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { CommonActions } from '@react-navigation/native';
import { off, onValue, ref } from 'firebase/database';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDrawer } from '@/contexts/DrawerContext';
import { getCurrentUser, logout } from '@/utils/auth';

const profilePlaceholder = require('@/assets/images/profileimage.png');

type DrawerItem = {
  key: string;
  label: string;
  action?: () => void;
  type?: 'default' | 'toggle';
};

type AppDrawerProps = DrawerContentComponentProps;

const AppDrawer = (props: AppDrawerProps) => {
  const { navigation: drawerNavigation } = props;
  const { closeDrawer } = useDrawer();
  const user = getCurrentUser();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [fullName, setFullName] = useState<string | null>(null);
  const [isAuthor, setIsAuthor] = useState(false);

  // Load full name and author status from Firebase
  useEffect(() => {
    if (!user?.uid) {
      console.log('⚠️ [AppDrawer] No user UID available');
      setFullName(null);
      setIsAuthor(false);
      return;
    }

    console.log('📥 [AppDrawer] Loading profile for user:', user.uid);
    const personalInfoRef = ref(database, `users/${user.uid}/personalInfo`);
    const unsubscribePersonalInfo = onValue(personalInfoRef, (snapshot) => {
      const data = snapshot.val();
      console.log('📥 [AppDrawer] Profile data received:', data);
      if (data?.fullName) {
        console.log('✅ [AppDrawer] Full name loaded:', data.fullName);
        setFullName(data.fullName);
      } else {
        console.log('⚠️ [AppDrawer] No fullName found in profile data');
        setFullName(null);
      }
    }, (error) => {
      console.error('❌ [AppDrawer] Error loading profile:', error);
    });

    // Check author status
    const isAuthorRef = ref(database, `users/${user.uid}/isAuthor`);
    const unsubscribeAuthor = onValue(isAuthorRef, (snapshot) => {
      const authorStatus = snapshot.val();
      console.log('📥 [AppDrawer] Author status:', authorStatus);
      setIsAuthor(authorStatus === true);
    }, (error) => {
      console.error('❌ [AppDrawer] Error loading author status:', error);
      setIsAuthor(false);
    });

    return () => {
      off(personalInfoRef);
      off(isAuthorRef);
    };
  }, [user?.uid]);

  const drawerItems = useMemo<DrawerItem[]>(() => {
    const items: DrawerItem[] = [
      {
        key: 'notifications',
        label: 'Notifications',
        type: 'toggle',
        action: () => {
          closeDrawer();
          drawerNavigation.navigate('notifications');
        },
      },
      {
        key: 'my-media',
        label: 'My Media',
        action: () => {
          closeDrawer();
          drawerNavigation.navigate('my-media');
        },
      },
    ];

    // Show "Request Author Profile" only if user is not an author
    if (!isAuthor) {
      items.unshift({
        key: 'request-author',
        label: 'Request Author Profile',
        action: () => {
          closeDrawer();
          drawerNavigation.navigate('request-author');
        },
      });
    } else {
      // Show "Author Profile" only if user is an author
      items.push({
        key: 'author-profile',
        label: 'Author Profile',
        action: () => {
          closeDrawer();
          drawerNavigation.navigate('author-profile');
        },
      });
    }

    items.push(
      {
        key: 'terms',
        label: 'Terms of services',
        action: () => {
          closeDrawer();
          drawerNavigation.navigate('terms-conditions');
        },
      },
      {
        key: 'privacy',
        label: 'Privacy Policy',
        action: () => {
          closeDrawer();
          drawerNavigation.navigate('privacy-policy');
        },
      }
    );

    return items;
  }, [closeDrawer, drawerNavigation, isAuthor]);

  const handleEditProfile = () => {
    closeDrawer();
    drawerNavigation.navigate('edit-profile');
  };

  const handleLogout = async () => {
    closeDrawer();
    const { error } = await logout();
    if (error) {
      Alert.alert('Logout failed', error);
      return;
    }
    // Navigate to Root stack and reset to auth screen
    const rootNavigation = drawerNavigation.getParent();
    if (rootNavigation) {
      rootNavigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: '(auth)' }],
        })
      );
    } else {
      drawerNavigation.navigate('Tabs');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <View style={styles.card}>
        <View style={styles.sections}>
          <View style={styles.profileBlock}>
            <Image source={profilePlaceholder} style={styles.avatar} />
            <View style={styles.profileText}>
              <Text style={styles.profileName}>
                {fullName || user?.displayName || user?.email || 'Guest User'}
              </Text>
              <Pressable onPress={handleEditProfile}>
                <Text style={styles.editProfileText}>Edit profile</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.menuBlock}>
            {drawerItems.map((item) =>
              item.type === 'toggle' ? (
                <View style={styles.toggleRow} key={item.key}>
                  <Pressable style={styles.toggleLabelContainer} onPress={item.action}>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </Pressable>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#DDE3ED"
                    trackColor={{ false: '#DDE3ED', true: '#05B1FF' }}
                    style={styles.switch}
                  />
                </View>
              ) : (
                <Pressable style={styles.menuRow} key={item.key} onPress={item.action}>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </Pressable>
              )
            )}
          </View>

          <View style={styles.logoutBlock}>
            <Pressable style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default AppDrawer;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  card: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 50,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderTopRightRadius: 48,
    borderBottomRightRadius: 48,
    backgroundColor: '#FFFFFF',
    shadowColor: '#1E1E1E',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  sections: {
    flex: 1,
    justifyContent: 'space-between',
  },
  profileBlock: {
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 124,
    height: 124,
    borderRadius: 62,
  },
  profileText: {
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0E1223',
  },
  editProfileText: {
    fontSize: 17,
    color: '#04A5F5',
    fontWeight: '600',
  },
  menuBlock: {
    gap: 28,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabelContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0D1526',
  },
  switch: {
    transform: [{ scaleX: 0.95 }, { scaleY: 0.95 }],
  },
  logoutBlock: {
    alignItems: 'center',
  },
  logoutButton: {
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6A6A',
  },
});

