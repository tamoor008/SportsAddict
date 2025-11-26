import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import AddArticlesScreen from './add-articles';
import ArticleDetailsScreen from './article-details';
import ArticlesScreen from './index';

const Stack = createNativeStackNavigator();

export default function ArticlesLayout() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="index" component={ArticlesScreen} />
      <Stack.Screen name="add-articles" component={AddArticlesScreen} />
      <Stack.Screen name="article-details" component={ArticleDetailsScreen} />
    </Stack.Navigator>
  );
}

