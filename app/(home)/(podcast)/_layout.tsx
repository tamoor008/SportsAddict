import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import AddPodcastScreen from './add-podcast';
import PodcastScreen from './index';
import PodcastDetailScreen from './podcast-detail';

const Stack = createNativeStackNavigator();

export default function PodcastLayout() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="index" component={PodcastScreen} />
      <Stack.Screen name="add-podcast" component={AddPodcastScreen} />
      <Stack.Screen name="podcast-detail" component={PodcastDetailScreen} />
    </Stack.Navigator>
  );
}

