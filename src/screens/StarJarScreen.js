import React, { useState, useEffect, useLayoutEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddStarJarScreen from '../components/AddStarJarScreen';

export default function StarJarScreen({ navigation }) {
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState('all'); // State to manage the current filter

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

  // Function to filter notes based on the selected filter
  const getFilteredNotes = () => {
    if (filter === 'fromYou') {
      return notes.filter((note) => note.friend !== 'You'); // Notes sent to others
    } else if (filter === 'toYou') {
      return notes.filter((note) => note.friend === 'You'); // Notes received by you
    }
    return notes; // All notes
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
      <Text style={styles.subtitle}>Filter and View Your Notes</Text>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
          onPress={() => setFilter('all')}
        >
          <Text style={styles.filterButtonText}>All Notes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'fromYou' && styles.activeFilter]}
          onPress={() => setFilter('fromYou')}
        >
          <Text style={styles.filterButtonText}>From You</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'toYou' && styles.activeFilter]}
          onPress={() => setFilter('toYou')}
        >
          <Text style={styles.filterButtonText}>To You</Text>
        </TouchableOpacity>
      </View>

      {/* Button to navigate to AddStarJarScreen */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddStarJar', { addNote })}
      >
        <Text style={styles.addButtonText}>+ Add Star Jar Note</Text>
      </TouchableOpacity>

      {/* Filtered Notes List */}
      <FlatList
        data={getFilteredNotes()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>{item.note}</Text>
            <Text style={styles.noteDate}>Date: {item.date}</Text>
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
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  filterButton: {
    backgroundColor: '#832161',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  activeFilter: {
    backgroundColor: '#467498', // Highlight active filter
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Crimson',
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