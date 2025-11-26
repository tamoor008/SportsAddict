import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import React, { useMemo, useRef } from 'react';
import { Dimensions, Image, Platform } from 'react-native';

import AppDrawer from '@/components/AppDrawer';
import DrawerContext from '@/contexts/DrawerContext';

import AuthorProfileScreen from '../(drawer)/author-profile';
import EditProfileScreen from '../(drawer)/edit-profile';
import MyMediaScreen from '../(drawer)/my-media';
import NotificationsScreen from '../(drawer)/notifications';
import PrivacyPolicyScreen from '../(drawer)/privacy-policy';
import RequestAuthorScreen from '../(drawer)/request-author';
import TermsConditionsScreen from '../(drawer)/terms-conditions';
import ArticlesStack from './(articles)/_layout';
import LiveEventsStack from './(live-events)/_layout';
import PodcastStack from './(podcast)/_layout';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#06ABEB',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}>
      <Tab.Screen
        name="(articles)"
        component={ArticlesStack}
        options={{
          title: 'Articles',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('@/assets/images/articleActive.png')}
              style={{ width: 24, height: 24, tintColor: focused ? '#06ABEB' : '#999999' }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="(podcast)"
        component={PodcastStack}
        options={{
          title: 'Podcast',
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require('@/assets/images/podcastActive.png')
                  : require('@/assets/images/podcastInactive.png')
              }
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tab.Screen
        name="(live-events)"
        component={LiveEventsStack}
        options={{
          title: 'Live Events',
          tabBarIcon: ({ focused }) => (
            <Image
              source={
                focused
                  ? require('@/assets/images/calenderActive.png')
                  : require('@/assets/images/calenderInactive.png')
              }
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function HomeLayout() {
  console.log('🔵 [HomeLayout] Component rendering');
  const drawerNavigationRef = useRef<any>(null);
  const drawerWidth = useMemo(() => Math.min(Dimensions.get('window').width * 0.84, 360), []);

  const drawerActions = useMemo(
    () => ({
      openDrawer: () => {
        console.log('🔵 [DrawerContext] openDrawer called');
        console.log('🔵 [DrawerContext] drawerNavigationRef.current:', drawerNavigationRef.current ? 'exists' : 'null');
        if (drawerNavigationRef.current) {
          console.log('🔵 [DrawerContext] Calling drawerNavigationRef.current.openDrawer()');
          try {
            drawerNavigationRef.current.openDrawer();
            console.log('✅ [DrawerContext] openDrawer() called successfully');
          } catch (error) {
            console.error('❌ [DrawerContext] Error calling openDrawer():', error);
          }
        } else {
          console.error('❌ [DrawerContext] drawerNavigationRef.current is null - drawer ref not set!');
        }
      },
      closeDrawer: () => {
        console.log('🔵 [DrawerContext] closeDrawer called');
        if (drawerNavigationRef.current) {
          drawerNavigationRef.current.closeDrawer();
        }
      },
      toggleDrawer: () => {
        console.log('🔵 [DrawerContext] toggleDrawer called');
        if (drawerNavigationRef.current) {
          drawerNavigationRef.current.toggleDrawer();
        }
      },
    }),
    []
  );

  return (
    <DrawerContext.Provider value={drawerActions}>
      <Drawer.Navigator
        drawerContent={(props) => {
          // Store the navigation object which has openDrawer/closeDrawer methods
          console.log('🔵 [HomeLayout] drawerContent called, setting navigation ref');
          console.log('🔵 [HomeLayout] props.navigation:', props.navigation ? 'exists' : 'null');
          if (props.navigation) {
            drawerNavigationRef.current = props.navigation;
            console.log('✅ [HomeLayout] Drawer navigation ref set from drawerContent props');
            console.log('🔵 [HomeLayout] navigation.openDrawer:', typeof props.navigation.openDrawer);
          } else {
            console.error('❌ [HomeLayout] props.navigation is null!');
          }
          return <AppDrawer {...props} />;
        }}
        screenOptions={{
          headerShown: false,
          drawerType: 'front',
          drawerPosition: 'left',
          drawerStyle: {
            width: drawerWidth,
            backgroundColor: 'transparent',
          },
          overlayColor: 'rgba(0,0,0,0.35)',
          swipeEdgeWidth: 80,
        }}
      >
        <Drawer.Screen name="Tabs" component={HomeTabs} options={{ drawerLabel: 'Home' }} />
        <Drawer.Screen
          name="request-author"
          component={RequestAuthorScreen}
          options={{ drawerLabel: 'Request Author Profile' }}
        />
        <Drawer.Screen
          name="notifications"
          component={NotificationsScreen}
          options={{ drawerLabel: 'Notifications' }}
        />
        <Drawer.Screen
          name="edit-profile"
          component={EditProfileScreen}
          options={{ drawerLabel: 'Edit Profile' }}
        />
        <Drawer.Screen
          name="my-media"
          component={MyMediaScreen}
          options={{ drawerLabel: 'My Media' }}
        />
        <Drawer.Screen
          name="author-profile"
          component={AuthorProfileScreen}
          options={{ drawerLabel: 'Author Profile' }}
        />
        <Drawer.Screen
          name="terms-conditions"
          component={TermsConditionsScreen}
          options={{ drawerLabel: 'Terms & Conditions' }}
        />
        <Drawer.Screen
          name="privacy-policy"
          component={PrivacyPolicyScreen}
          options={{ drawerLabel: 'Privacy Policy' }}
        />
      </Drawer.Navigator>
    </DrawerContext.Provider>
  );
}

