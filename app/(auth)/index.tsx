import { signIn } from '@/utils/auth';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const navigation = useNavigation<any>();
  const [currentSection, setCurrentSection] = useState<'section1' | 'section2'>('section1');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [loading, setLoading] = useState(false);

  // Animation values for section1
  const section1Opacity = useRef(new Animated.Value(1)).current;
  const section1TranslateX = useRef(new Animated.Value(0)).current;
  
  // Animation values for section2
  const section2Opacity = useRef(new Animated.Value(0)).current;
  const section2TranslateX = useRef(new Animated.Value(50)).current;

  // Handle sign in
  const handleSignIn = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const { user, error } = await signIn(email.trim(), password);
      if (error) {
        Alert.alert('Sign In Error', error);
      } else if (user) {
        // Successfully signed in
        // Navigate to home screen (articles tab)
        // Navigation hierarchy: RootStack -> (home) (Drawer + Tabs)
        console.log('✅ Sign in successful, navigating to home...');
        const rootStackNav = navigation.getParent();

        if (rootStackNav) {
          rootStackNav.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: '(home)' as never }],
            })
          );
        } else {
          navigation.navigate('(home)' as never);
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  // Keyboard event listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height + 10);
    });
    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height + 10);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Handle section change with animation
  const changeSection = (section: 'section1' | 'section2') => {
    if (section === 'section2') {
      // Transition to section2
      setCurrentSection('section2');
      Animated.parallel([
        // Section1: fade out and slide left
        Animated.parallel([
          Animated.timing(section1Opacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(section1TranslateX, {
            toValue: -50,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
        // Section2: fade in and slide from right
        Animated.parallel([
          Animated.timing(section2Opacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(section2TranslateX, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Transition to section1
      setCurrentSection('section1');
      Animated.parallel([
        // Section2: fade out and slide right
        Animated.parallel([
          Animated.timing(section2Opacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(section2TranslateX, {
            toValue: 50,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
        // Section1: fade in and slide from left
        Animated.parallel([
          Animated.timing(section1Opacity, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(section1TranslateX, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  };

  const renderSection1 = () => (
    <>
      {/* Top Section */}
      <View style={styles.topSection}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require('@/assets/images/Logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
      <View style={styles.upperCardSection} />
      {/* White Card Section */}
      <View style={styles.whiteCard}>
        <View style={styles.whiteCardContent}>
          {/* Handle Indicator */}
          <View style={styles.handle} />
          
          {/* Title */}
          <Text style={styles.title}>Sign In</Text>

          {/* Sign In Options */}
          <View style={styles.optionsContainer}>
            {/* Email Option */}
            <Pressable 
              style={styles.optionButton}
              onPress={() => changeSection('section2')}>
              <View style={[styles.iconCircle, styles.emailIcon]}>
                <Image
                  source={require('@/assets/images/email.png')}
                  style={styles.iconImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.optionText}>Email</Text>
            </Pressable>

            {/* Google ID Option */}
            <Pressable style={styles.optionButton}>
              <View style={[styles.iconCircle, styles.googleIcon]}>
                <Image
                  source={require('@/assets/images/google.png')}
                  style={styles.iconImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.optionText}>Google ID</Text>
            </Pressable>

            {/* Apple ID Option */}
            <Pressable style={styles.optionButton}>
              <View style={[styles.iconCircle, styles.appleIcon]}>
                <Image
                  source={require('@/assets/images/apple.png')}
                  style={styles.iconImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.optionText}>Apple ID</Text>
            </Pressable>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <Pressable onPress={() => navigation.navigate('signup' as never)}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </Pressable>
        </View>
      </View>
    </>
  );

  const renderSection2 = () => (
    <View style={styles.section2Container}>
      <SafeAreaView style={styles.safeAreaSection2}>
        {/* Back Button */}
        <View style={styles.section2Header}>
          <Pressable 
            style={styles.backButton}
            onPress={() => changeSection('section1')}>
            <Ionicons name="arrow-back" size={24} color="#06ABEB" />
          </Pressable>
        </View>

        {/* Title */}
        <Text style={styles.emailTitle}>Sign In with Email</Text>

        {/* Content Container */}
        <ScrollView 
          style={styles.section2MainContent}
          contentContainerStyle={[
            styles.scrollViewContent,
            { paddingBottom: keyboardHeight }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputCP}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Image
                  source={require('@/assets/images/email1.png')}
                  style={styles.inputIcon}
                  resizeMode="contain"
                />
                <TextInput
                  style={styles.input}
                  placeholder="example@email.com"
                  placeholderTextColor="#999999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Image
                  source={require('@/assets/images/lock.png')}
                  style={styles.inputIcon}
                  resizeMode="contain"
                />
                <TextInput
                  style={styles.input}
                  placeholder="*********"
                  placeholderTextColor="#999999"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <Pressable 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}>
                  <Image
                    source={showPassword 
                      ? require('@/assets/images/hides.png')
                      : require('@/assets/images/view.png')}
                    style={styles.inputIconv}
                    resizeMode="contain"
                  />
                </Pressable>
              </View>
            </View>

            {/* Forgot Password - Right Aligned */}
            <View style={styles.forgotPasswordContainer}>
              <Pressable onPress={() => navigation.navigate('reset-password' as never)}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </Pressable>
            </View>

            {/* Remember Me - Left Aligned on Next Line */}
            <View style={styles.rememberMeContainer}>
              <Pressable 
                style={styles.rememberMeButton}
                onPress={() => setRememberMe(!rememberMe)}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.rememberMeText}>Remember me</Text>
              </Pressable>
            </View>

            {/* Sign In Button */}
            <Pressable 
              style={[styles.signInButton, loading && styles.signInButtonDisabled]}
              onPress={handleSignIn}
              disabled={loading}>
              <Text style={styles.signInButtonText}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footerSection2}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Pressable onPress={() => navigation.navigate('signup' as never)}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );

  return (
    <View style={styles.rootContainer}>
      {/* StatusBar - Controlled by currentSection */}
      <StatusBar style={currentSection === 'section1' ? 'light' : 'dark'} />
      
      {/* Section 1 - Animated */}
      <Animated.View
        style={[
          styles.animatedSection,
          {
            opacity: section1Opacity,
            transform: [{ translateX: section1TranslateX }],
            zIndex: currentSection === 'section1' ? 2 : 1,
          },
          currentSection === 'section1' && styles.animatedSectionActive,
        ]}
        pointerEvents={currentSection === 'section1' ? 'auto' : 'none'}>
        <LinearGradient
          colors={['#7D74DE', '#D8FFFF']}
          style={styles.container}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}>
          <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderSection1()}
          </SafeAreaView>
        </LinearGradient>
      </Animated.View>

      {/* Section 2 - Animated */}
      <Animated.View
        style={[
          styles.animatedSection,
          {
            opacity: section2Opacity,
            transform: [{ translateX: section2TranslateX }],
            zIndex: currentSection === 'section2' ? 2 : 1,
          },
          currentSection === 'section2' && styles.animatedSectionActive,
        ]}
        pointerEvents={currentSection === 'section2' ? 'auto' : 'none'}>
        {renderSection2()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    position: 'relative',
  },
  animatedSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  animatedSectionActive: {
    // Additional styles for active section if needed
  },
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topSection: {
    flex: 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  upperCardSection: {
    height: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    top: 7,
    opacity: 0.5, // 30% opacity
  },
  logoContainer: {
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
  },
  logoImage: {
    width: 110,
    height: 110,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  logoSubtext: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  whiteCard: {
    flex: 0.95,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingBottom: 40,
    justifyContent: 'space-between',
    shadowColor: '#7D74DE',
    shadowOffset: { width: 0, height: -9 },
    shadowOpacity: 30,
    shadowRadius: 20,
    elevation: 20,
  },
  whiteCardContent: {
    paddingTop: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 40,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 21,
    paddingHorizontal: 20,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emailIcon: {
    backgroundColor: '#06ABEB',
  },
  googleIcon: {
    backgroundColor: '#DB4437',
  },
  appleIcon: {
    backgroundColor: '#000000',
  },
  iconImage: {
    width: 24,
    height: 24,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  footer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#666666',
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#06ABEB',
  },
  // Section 2 Styles
  section2Container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeAreaSection2: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  section2Header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  backButton: {
    padding: 4,
    alignSelf: 'flex-start',
  },
  emailTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'left',
    paddingHorizontal: 20,
    paddingBottom:50,
  },
  section2MainContent: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  footerSection2: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 20,
  },
  inputContainer: {
    paddingBottom:12,
  },
  inputCP:{
paddingBottom:28,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    
    backgroundColor: '#F4F5F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 17,
    borderColor: '#E0E0E0',
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: '#323232',
  },
  inputIconv:{
    width: 20,
    height: 20,
    tintColor: '#323232',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  eyeIcon: {
    
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  rememberMeContainer: {
    alignItems: 'flex-start',
  },
  rememberMeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#75818F',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#06ABEB',
    borderColor: '#06ABEB',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#666666',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#06ABEB',
  },
  signInButton: {
    backgroundColor: '#06ABEB',
    borderRadius: 120,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 28,
  },
  signInButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
});

