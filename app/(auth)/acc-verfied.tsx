import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccVerifiedScreen() {
  const navigation = useNavigation<any>();
  
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Purple Status Bar Area */}
      <View style={styles.statusBarArea} />
      
    <View style={{height:20,marginHorizontal:25,backgroundColor:'#FFFFFF50',borderRadius:200,top:11,}}/>

      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.contentContainer}>
          {/* Drag Handle */}
          <View style={styles.dragHandle} />
          
          {/* Verification Icon */}
          <View style={styles.iconContainer}>
            <Image
              source={require('@/assets/images/verifiedacconut.png')}
              style={styles.verificationImage}
              resizeMode="contain"
            />
          </View>
          
          {/* Heading */}
          <Text style={styles.heading}>Successfully Verified</Text>
          
          {/* Description */}
          <Text style={styles.description}>
            Your account is set now, we will redirect you{'\n'}to profile information
          </Text>
          
          {/* Set Up Profile Button */}
          <Pressable 
            style={styles.setupButton}
            onPress={() => navigation.navigate('(auth)', { screen: 'profile' })}>
            <Text style={styles.setupButtonText}>Set Up Profile</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
borderWidth:1,
    backgroundColor: '#7D74DE',
  },
  statusBarArea: {
    height: 60,
    backgroundColor: '#7D74DE',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  contentContainer: {
    flex: 1,

    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 50,
  },
  iconContainer: {
    marginTop:60,
    marginBottom: 40,
  },
  verificationImage: {
    width: 160,
    height: 160,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 50,
    paddingHorizontal: 20,
  },
  setupButton: {
    backgroundColor: '#06ABEB',
    borderRadius: 160,
    paddingVertical: 18,
    paddingHorizontal: 62,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#06ABEB',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  setupButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

