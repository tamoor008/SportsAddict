import { database } from '@/config/firebase';
import { getCurrentUser, onAuthStateChange } from '@/utils/auth';
import { useNavigation } from '@react-navigation/native';
import { User } from 'firebase/auth';
import { get, ref } from 'firebase/database';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ASplashfScreen() {
  const navigation = useNavigation<any>();
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    console.log('⏱️ [Splash] Showing splash screen for 3 seconds...');
    
    let unsubscribe: (() => void) | null = null;
    
    // Wait 3 seconds before starting auth check
    const splashTimer = setTimeout(() => {
      console.log('🔍 [Splash] 3 seconds passed, starting auth state check...');
      setCheckingAuth(true);
      
      // Check current user
      const currentUser = getCurrentUser();
      console.log('👤 [Splash] Current user (immediate check):', currentUser ? currentUser.email : 'null');
      
      // Check auth state
      unsubscribe = onAuthStateChange(async (user: User | null) => {
        console.log('🔄 [Splash] Auth state changed!');
        console.log('👤 [Splash] User:', user ? {
          email: user.email,
          uid: user.uid,
          emailVerified: user.emailVerified
        } : 'null');
        
        // Prevent multiple navigations
        if (hasNavigated) {
          console.log('⚠️ [Splash] Already navigated, ignoring this state change');
          return;
        }
        
        setCheckingAuth(false);
        
        if (user) {
          // Check if user has completed profile setup
          try {
            const personalInfoRef = ref(database, `users/${user.uid}/personalInfo`);
            const snapshot = await get(personalInfoRef);
            const personalInfo = snapshot.val();
            
            if (personalInfo && personalInfo.fullName) {
              // User has completed profile, go to home
              console.log('✅ [Splash] User profile complete, navigating to (home)');
              setHasNavigated(true);
              navigation.replace('(home)');
            } else {
              // User hasn't completed profile, navigate to profile setup
              console.log('⚠️ [Splash] User profile incomplete, navigating to profile setup');
              setHasNavigated(true);
              navigation.replace('(auth)', { screen: 'profile' });
            }
          } catch (error) {
            // Error checking profile, still navigate to home
            console.log('⚠️ [Splash] Error checking profile, navigating to (home)');
            setHasNavigated(true);
            navigation.replace('(home)');
          }
        } else {
          console.log('❌ [Splash] No user found, navigating to (asplash)');
          setHasNavigated(true);
              navigation.replace('(asplash)');
        }
      });
    }, 3000); // 3 seconds delay

    // Cleanup timer and unsubscribe on unmount
    return () => {
      clearTimeout(splashTimer);
      if (unsubscribe) {
        console.log('🧹 [Splash] Cleaning up auth listener');
        unsubscribe();
      }
    };
  }, [navigation, hasNavigated]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('@/assets/images/Logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        {checkingAuth && (
          <ActivityIndicator 
            size="large" 
            color="#06ABEB" 
            style={styles.loader}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 350,
    height: 350,
  },
  loader: {
    marginTop: 20,
  },
});

