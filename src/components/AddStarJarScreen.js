import React, { useState, useLayoutEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function AddStarJarScreen({ navigation, route }) {
  const [note, setNote] = useState('');
  const [friend, setFriend] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today's date

  // Configure the header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Add Star Jar Note', // Set header title
      headerStyle: {
        backgroundColor: '#467498', // Set header background color
      },
      headerTintColor: '#fff', // Set the back button color to white
      headerTitleStyle: {
        color: '#fff', // Set header text color to white
        fontWeight: 'bold',
      },
      headerBackTitle: 'Back to Star Jar', // Set back button text
    });
  }, [navigation]);

  const saveNote = () => {
    if (!note || !friend) {
      alert('Please fill out all fields.');
      return;
    }

    // Create a new note object
    const newNote = {
      id: Date.now().toString(), // Generate a unique ID
      note,
      friend,
      date,
    };

    // Pass the new note back to the previous screen
    route.params?.addNote(newNote);

    // Navigate back to the previous screen
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add a Star Jar Note</Text>
      <TextInput
        style={styles.input}
        placeholder="Write a cute note for your friend to see later!"
        value={note}
        onChangeText={setNote}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter your friend's name!"
        value={friend}
        onChangeText={setFriend}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
      />
      {/* Custom Save Note Button */}
      <TouchableOpacity style={styles.saveButton} onPress={saveNote}>
        <Text style={styles.saveButtonText}>Save Note</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#d282a6', // Updated screen background color
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Crimson', // Set font to Crimson
  },
  input: {
    backgroundColor: '#bcd2ed', // Updated input text box background color
    color: '#832161', // Updated text color inside the textbox
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    fontFamily: 'Crimson', // Set font to Crimson
  },
  saveButton: {
    backgroundColor: '#467498', // Updated Save Note button color
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff', // Ensure the button text is white
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Crimson', // Set font to Crimson
  },
});