import { DarkTheme, DefaultTheme, NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
// Initialize Firebase early
import '@/config/firebase';

// Import screens
import ASplashfScreen from './(aSplashf)/index';
import SplashScreen from './(asplash)/index';
import AuthStack from './(auth)/_layout';
import HomeStack from './(home)/_layout';
import OnboardingScreen from './(onboarding)/index';

const Stack = createNativeStackNavigator();

export const unstable_settings = {
  anchor: '(aSplashf)',
};

function RootStack() {
  return (
    <Stack.Navigator
      initialRouteName="(aSplashf)"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="(aSplashf)" component={ASplashfScreen} />
      <Stack.Screen name="(asplash)" component={SplashScreen} />
      <Stack.Screen name="(onboarding)" component={OnboardingScreen} />
      <Stack.Screen name="(auth)" component={AuthStack} />
      <Stack.Screen name="(home)" component={HomeStack} />
    </Stack.Navigator>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const navTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationIndependentTree>
        <NavigationContainer theme={navTheme}>
          <RootStack />
          <StatusBar style="auto" />
        </NavigationContainer>
      </NavigationIndependentTree>
    </GestureHandlerRootView>
  );
}
