import React, { useLayoutEffect, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation }) {
  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: '#467498', // Set header background color
      },
      headerTintColor: '#fff', // Set header text and button color to white
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });
  }, [navigation]);

  useEffect(() => {
    const checkStarJar = async () => {
      const starJarData = await AsyncStorage.getItem('starJar');
      console.log('Star Jar Data:', starJarData);
    };
    checkStarJar();
  }, []);

  const resetBucketList = async () => {
    Alert.alert(
      'Reset Bucket List',
      'Are you sure you want to delete all items in the bucket list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('bucketList'); // Remove bucket list data
              Alert.alert('Success', 'Bucket list has been reset.');
            } catch (error) {
              console.error('Failed to reset bucket list:', error);
              Alert.alert('Error', 'Failed to reset bucket list. Please try again.');
            }
          },
        },
      ]
    );
  };

  const resetStarJar = async () => {
    Alert.alert(
      'Reset Star Jar',
      'Are you sure you want to delete all notes in the star jar?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Attempting to remove starJarNotes data...');
              const starJarDataBefore = await AsyncStorage.getItem('starJarNotes');
              console.log('Star Jar Data Before Reset:', starJarDataBefore);

              await AsyncStorage.removeItem('starJarNotes'); // Use the correct key
              console.log('Star Jar Data Removed Successfully.');

              const starJarDataAfter = await AsyncStorage.getItem('starJarNotes');
              console.log('Star Jar Data After Reset:', starJarDataAfter);

              Alert.alert('Success', 'Star jar has been reset.');
            } catch (error) {
              console.error('Failed to reset star jar:', error);
              Alert.alert('Error', 'Failed to reset star jar. Please try again.');
            }
          },
        },
      ]
    );
  };

  const eraseAllData = async () => {
    Alert.alert(
      'Erase All Data',
      'Are you sure you want to erase all data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Erase',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear(); // Clear all data from AsyncStorage
              Alert.alert('Success', 'All data has been erased.');
              navigation.navigate('Nav'); // Navigate back to the main navigation screen
            } catch (error) {
              console.error('Failed to erase data:', error);
              Alert.alert('Error', 'Failed to erase data. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <TouchableOpacity style={styles.button} onPress={resetBucketList}>
        <Text style={styles.buttonText}>Reset Bucket List</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={resetStarJar}>
        <Text style={styles.buttonText}>Reset Star Jar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={eraseAllData}>
        <Text style={styles.buttonText}>Erase All Data</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#bcd2ed', // Updated background color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#467498', // Updated header text color
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#832161', // Updated button color
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10, // Add spacing between buttons
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});