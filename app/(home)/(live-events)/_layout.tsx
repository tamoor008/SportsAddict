import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import AddEventScreen from './add-event';
import EventDetailsScreen from './event-details';
import LiveEventsScreen from './index';

const Stack = createNativeStackNavigator();

export default function LiveEventsLayout() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="index" component={LiveEventsScreen} />
      <Stack.Screen name="add-event" component={AddEventScreen} />
      <Stack.Screen name="event-details" component={EventDetailsScreen} />
    </Stack.Navigator>
  );
}

