import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
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
      source={require('../../assets/images/navBackground.png')}
      style={styles.container}
    >
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Bucket')}>
        <Text style={styles.buttonText}>bucket list</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Camera')}>
        <Text style={styles.buttonText}>take a pic!</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Friends')}>
        <Text style={styles.buttonText}>friends, mapped</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Calendar')}>
        <Text style={styles.buttonText}>together time!</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('PhotoGallery')}>
        <Text style={styles.buttonText}>photo gallery</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.0)', // transparent to fit hearts
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
  }
});

export default NavScreen;
