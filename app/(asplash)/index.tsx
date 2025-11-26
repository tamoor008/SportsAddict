import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreen() {
  const navigation = useNavigation<any>();

  return (
    <LinearGradient
      colors={['#7D74DE', '#D8FFFF']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Left-aligned section */}
          <View style={styles.leftSection}>
            {/* Logo */}
                <Image
                  source={require('@/assets/images/Logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              
            

            {/* Email */}
            <Text style={styles.email}>BYMSMOF@GMAIL.COM</Text>

            {/* Welcome Message */}
            <Text style={styles.welcomeText}>Welcome to Moocare</Text>
          </View>

          {/* Centered buttons section */}
          <View style={styles.buttonSection}>
            {/* Explore Button */}
            <Pressable 
              style={styles.exploreButton}
              onPress={() => navigation.navigate('(onboarding)')}
            >
              <Text style={styles.exploreButtonText}>Explore the App</Text>
            </Pressable>

            {/* Sign In */}
            <Pressable 
              style={styles.signInButton}
              onPress={() => navigation.navigate('(auth)')}
            >
              <Text style={styles.signInText}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 60,
    justifyContent:'flex-end'

  },
  leftSection: {
    marginBottom:80,
    marginHorizontal:20,
  },
  logoContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
    borderWidth:1
  },
 
  logo: {
    width: 110,
    marginLeft:-18,
    height: 110,
    marginBottom:12,
  },
  email: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 14,
    fontFamily: 'System',
    fontWeight: '400',
    textAlign: 'left',
  },
  welcomeText: {
    fontSize: 42,
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontFamily: 'System',
  
    lineHeight: 50,
    textAlign: 'left',
  },
  buttonSection: {
  },
  exploreButton: {

    backgroundColor: '#06ABEB',
    paddingVertical: 16,
    marginHorizontal:20,
    borderRadius: 120,
    marginBottom: 16,
  
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'System',
  },
  signInButton: {
    backgroundColor: '#FFFFFF1A',
    paddingVertical: 16,
    marginHorizontal:20,
    borderRadius: 120,
   },
  signInText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'System',
    textAlign:'center'
  },
});
