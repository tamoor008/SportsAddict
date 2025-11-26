import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, ImageStyle, Pressable, ScrollView, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const onboardingSteps = [
  {
    title: 'All about healthcare',
    description: 'When you accept a request we charge the Brand. We pay you as soon as you post!',
    image: require('@/assets/images/car1.png'),
    headerBgColor: '#FFFFFF',
    statusBarStyle: 'dark' as const,
    backButtonColor: '#000000',
    skipTextColor: '#000000',
    imageContainerStyle: {
      width: '100%',
    } as ViewStyle,
    imageStyle: {
      width: '100%',
      height: 400,
      backgroundColor: '#FFFFFF',
    } as ImageStyle,
    imageResizeMode: 'stretch' as const,
    textSectionStyle: {
      paddingHorizontal: 20,
      backgroundColor: '#FFFFFF',
      paddingTop: 20,
      paddingBottom: 20,
      alignItems: 'center',
    } as ViewStyle,
    titleStyle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#000000',
      marginBottom: 16,
      textAlign: 'center',
    } as TextStyle,
    descriptionStyle: {
      fontSize: 16,
      color: '#666666',
      lineHeight: 24,
      textAlign: 'center',
      marginBottom: 24,
      paddingHorizontal: 20,
    } as TextStyle,
  },
  {
    title: 'Easy to booking',
    description: 'When you accept a request we charge the Brand. We pay you as soon as you post!',
    image: require('@/assets/images/car2.png'),
    headerBgColor: '#06ABEB',
    statusBarStyle: 'light' as const,
    backButtonColor: '#FFFFFF',
    skipTextColor: '#FFFFFF',
    imageContainerStyle: {
      width: '100%',
    } as ViewStyle,
    imageStyle: {
      width: '100%',
      height: 400,
      backgroundColor: '#FFFFFF',
    } as ImageStyle,
    imageResizeMode: 'stretch' as const,
    textSectionStyle: {
      paddingHorizontal: 20,
      backgroundColor: '#FFFFFF',
      paddingTop: 20,
      paddingBottom: 20,
      alignItems: 'center',
    } as ViewStyle,
    titleStyle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#000000',
      marginBottom: 16,
      textAlign: 'center',
    } as TextStyle,
    descriptionStyle: {
      fontSize: 16,
      color: '#666666',
      lineHeight: 24,
      textAlign: 'center',
      marginBottom: 24,
      paddingHorizontal: 20,
    } as TextStyle,
  },
  {
    title: 'Secure Payments',
    description: 'When you accept a request we charge the Brand. We pay you as soon as you post!',
    image: require('@/assets/images/iphone2.png'),
    headerBgColor: '#FFFFFF',
    statusBarStyle: 'dark' as const,
    backButtonColor: '#000000',
    skipTextColor: '#000000',
    imageContainerStyle: {
      width: '100%',

      alignItems: 'center',
      justifyContent: 'center',
    
    } as ViewStyle,
    imageStyle: {
      width: '100%',
      height: 400,
      backgroundColor: '#FFFFFF',
    } as ImageStyle,
    imageResizeMode: 'cover' as const,
    textSectionStyle: {
      paddingHorizontal: 20,
      backgroundColor: '#FFFFFF',
      paddingTop: 20,
      paddingBottom: 20,
      alignItems: 'center',
    } as ViewStyle,
    titleStyle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#000000',
      marginBottom: 16,
      textAlign: 'center',
    } as TextStyle,
    descriptionStyle: {
      fontSize: 16,
      color: '#666666',
      lineHeight: 24,
      textAlign: 'center',
      marginBottom: 24,
      paddingHorizontal: 20,
    } as TextStyle,
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const [currentStep, setCurrentStep] = useState(0);
  const currentData = onboardingSteps[currentStep];
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  // Sync scroll position when currentStep changes programmatically
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: currentStep * SCREEN_WIDTH,
        animated: true,
      });
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Navigate to auth screen
      navigation.navigate('(auth)');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      // If on first step, go back to splash screen
      navigation.goBack();
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const step = Math.round(offsetX / SCREEN_WIDTH);
    if (step !== currentStep && step >= 0 && step < onboardingSteps.length) {
      setCurrentStep(step);
    }
  };

  return (
    <SafeAreaView style={styles.container} >
      <StatusBar style={currentData.statusBarStyle} backgroundColor={currentData.headerBgColor} />
      
      {/* Status Bar Background */}
      <View style={[styles.statusBarBackground, { backgroundColor: currentData.headerBgColor, height: insets.top }]} />
      
      {/* Navigation Bar */}
      <View style={[styles.navBar, { backgroundColor: currentData.headerBgColor }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={currentData.backButtonColor} />
        </Pressable>
        
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <Pressable style={styles.skipButton}>
          <Text style={[styles.skipText, { color: currentData.skipTextColor }]}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {onboardingSteps.map((stepData, index) => (
          <View key={index} style={styles.stepContainer}>
            <View style={styles.content}>
              {/* Image Section */}
              <View style={stepData.imageContainerStyle}>
                <Image
                  source={stepData.image}
                  style={stepData.imageStyle}
                  resizeMode={stepData.imageResizeMode}
                />
              </View>

              {/* Text Section */}
              <View style={stepData.textSectionStyle}>
                <Text style={stepData.titleStyle}>{stepData.title}</Text>
                <Text style={stepData.descriptionStyle}>
                  {stepData.description}
                </Text>
                
                {/* Pagination Dots */}
                <View style={styles.pagination}>
                  {onboardingSteps.map((_, dotIndex) => (
                    <View
                      key={dotIndex}
                      style={[
                        styles.dot,
                        dotIndex === currentStep && styles.activeDot,
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Next Button */}
      <View style={styles.buttonContainer}>
        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentStep === onboardingSteps.length - 1 ? 'Next' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'#FFFFFF'
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width:60,
    height: 60,
  },
  skipButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skipText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexDirection: 'row',
  },
  stepContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CCCCCC',
  },
  activeDot: {
    backgroundColor: '#06ABEB',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    backgroundColor: '#06ABEB',
    paddingVertical: 18,

    borderRadius: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal:20,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

