import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function AddStarJarScreen({ navigation }) {
  const [note, setNote] = useState('');
  const [friend, setFriend] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today's date

  const saveNote = () => {
    if (!note || !friend) {
      alert('Please fill out all fields.');
      return;
    }
    alert(`Note saved for ${friend} on ${date}`);
    navigation.goBack(); // Navigate back after saving
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add a StarJar Note</Text>
      <TextInput
        style={styles.input}
        placeholder="Write your note here..."
        value={note}
        onChangeText={setNote}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter friend's name..."
        value={friend}
        onChangeText={setFriend}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter date (YYYY-MM-DD)..."
        value={date}
        onChangeText={setDate}
      />
      <Button title="Save Note" onPress={saveNote} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#25292e',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
});