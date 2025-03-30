import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Image } from 'react-native';

const NavScreen = ({ navigation }) => {
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
  }
});

export default NavScreen;
