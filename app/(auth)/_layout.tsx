import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import AccVerifiedScreen from './acc-verfied';
import ForgotPasswordScreen from './forgot-password';
import SignInScreen from './index';
import PrivacyPolicyScreen from './privacy-policy';
import ProfileScreen from './profile';
import ResetPasswordScreen from './reset-password';
import SignUpScreen from './signup';
import TermsConditionsScreen from './terms-conditions';

const Stack = createNativeStackNavigator();

export default function AuthLayout() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="index" component={SignInScreen} />
      <Stack.Screen name="signup" component={SignUpScreen} />
      <Stack.Screen name="terms-conditions" component={TermsConditionsScreen} />
      <Stack.Screen name="privacy-policy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="acc-verfied" component={AccVerifiedScreen} />
      <Stack.Screen name="profile" component={ProfileScreen} />
      <Stack.Screen name="reset-password" component={ResetPasswordScreen} />
      <Stack.Screen name="forgot-password" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

