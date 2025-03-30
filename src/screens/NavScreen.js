import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Make sure to import Ionicons

const NavScreen = ({ navigation }) => {
  // Override the header back button behavior when component mounts
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.navigate('Menu')}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.headerButtonText}>Menu</Text>
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: '#467599', // Use your app's primary color
      },
      headerTintColor: '#fff',
      headerTitle: 'Navigation',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });
  }, [navigation]);

  return (
    <ImageBackground
      source={require('../../assets/images/navBackground2.png')}
      style={styles.container}
    >
      {/* Bucket List Button */}
      <TouchableOpacity
        style={[styles.button, { top: '10%', left: '3%' }]} // Adjust position to center on the first heart
        onPress={() => navigation.navigate('Bucket')}
      >
        <Text style={styles.buttonText}>bucket list</Text>
      </TouchableOpacity>
  
      {/* Camera Button */}
      <TouchableOpacity
        style={[styles.button, { top: '20%', right: '10%' }]} // Adjust position to center on the second heart
        onPress={() => navigation.navigate('Camera')}
      >
        <Text style={styles.buttonText}>take a pic!</Text>
      </TouchableOpacity>
  
      {/* Friends List Button */}
      <TouchableOpacity
        style={[styles.button, { top: '53%', left: '64%' }]} // Adjust position to center on the third heart
        onPress={() => navigation.navigate('Friends')}
      >
        <Text style={styles.buttonText}>friends list</Text>
      </TouchableOpacity>
  
      {/* Together Time Button */}
      <TouchableOpacity
        style={[styles.button, { top: '80%', right: '25%' }]} // Adjust position to center on the fourth heart
        onPress={() => navigation.navigate('Calendar')}
      >
        <Text style={styles.buttonText}>together time!</Text>
      </TouchableOpacity>
  
      {/* Star Jar Button */}
      <TouchableOpacity
        style={[styles.button, { top: '55%', left: '15%', transform: [{ translateX: -50 }, { translateY: -50 }] }]} // Centered on the middle heart
        onPress={() => navigation.navigate('StarJar')}
      >
        <Text style={styles.buttonText}>star jar</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
};

// Ensure the export is at the top level
export default NavScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    position: 'absolute', // Allows manual positioning
    backgroundColor: 'rgba(255, 255, 255, 0.0)', // Transparent to fit hearts
    paddingVertical: 20,
    paddingHorizontal: 30,
    marginVertical: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 22,
    fontFamily: 'ChalkboardSE-Bold', // Or similar if using a custom font
    textAlign: 'center',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    padding: 8,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 5,
  },
});