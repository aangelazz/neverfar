import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddStarJarScreen from '../components/AddStarJarScreen';

export default function StarJarScreen({ navigation }) {
  const [notes, setNotes] = useState([]);

  // Load notes from AsyncStorage when the screen is loaded
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const storedNotes = await AsyncStorage.getItem('starJarNotes');
        const notes = storedNotes ? JSON.parse(storedNotes) : [];
        setNotes(notes);
      } catch (error) {
        console.error('Failed to load notes:', error);
      }
    };

    loadNotes();
  }, []);

  // Function to add a new note
  const addNote = async (newNote) => {
    try {
      const updatedNotes = [...notes, newNote];
      setNotes(updatedNotes);

      // Save the updated notes to AsyncStorage
      await AsyncStorage.setItem('starJarNotes', JSON.stringify(updatedNotes));
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  // Configure the header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: '#467498', // Set header background color
      },
      headerTintColor: '#fff', // Set the back button and title color to white
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Star Jar Notes</Text>
      <Text style={styles.subtitle}>All Notes (Upcoming and My StarJar)</Text>

      {/* Button to navigate to AddStarJarScreen */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddStarJar', { addNote })}
      >
        <Text style={styles.addButtonText}>+ Add Star Jar Note</Text>
      </TouchableOpacity>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>{item.note}</Text>
            <Text style={styles.noteDate}>Date: {item.date}</Text>
            {/* Separate "To" and "From" */}
            {item.friend === 'You' ? (
              <Text style={styles.noteFriend}>From: You</Text>
            ) : (
              <>
                <Text style={styles.noteFriend}>To: {item.friend}</Text>
                <Text style={styles.noteFriend}>From: You</Text>
              </>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 40, // Add padding to shift the screen down slightly
    backgroundColor: '#bcd2ed', // Updated screen background color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#832161', // Updated heading color
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Crimson', // Set font to Crimson
  },
  subtitle: {
    fontSize: 16,
    color: '#467498', // Updated subtitle color
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Crimson', // Set font to Crimson
  },
  addButton: {
    backgroundColor: '#832161', // Updated button color
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff', // Ensure the button text is white
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Crimson', // Set font to Crimson
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButtonText: {
    color: '#fff', // Change back button text color to white
    fontSize: 16,
    marginLeft: 5,
    fontFamily: 'Crimson', // Set font to Crimson
  },
  noteCard: {
    backgroundColor: '#d282ab', // Updated background color for message rectangles
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  noteText: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Crimson', // Set font to Crimson
  },
  noteDate: {
    fontSize: 14,
    color: '#467498', // Updated date color
    fontWeight: 'bold', // Make the date bold
    marginTop: 5,
    fontFamily: 'Crimson', // Set font to Crimson
  },
  noteFriend: {
    fontSize: 14,
    color: '#52050a', // Updated "To/From" text color
    marginTop: 5,
    fontFamily: 'Crimson', // Set font to Crimson
  },
});