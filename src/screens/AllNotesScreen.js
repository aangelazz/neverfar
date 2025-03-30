import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AllNotesScreen() {
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' or 'my_starjar'

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const storedNotes = await AsyncStorage.getItem('starjar_notes');
        const allNotes = storedNotes ? JSON.parse(storedNotes) : [];
        const filteredNotes =
          filter === 'upcoming'
            ? allNotes.filter((note) => new Date(note.date) > new Date())
            : allNotes.filter((note) => note.friend === 'me'); // Replace 'me' with the current user's ID
        setNotes(filteredNotes);
      } catch (error) {
        console.error('Error fetching notes:', error);
      }
    };

    fetchNotes();
  }, [filter]);

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <Button title="Upcoming" onPress={() => setFilter('upcoming')} />
        <Button title="My StarJar" onPress={() => setFilter('my_starjar')} />
      </View>
      <FlatList
        data={notes}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.note}>
            <Text style={styles.noteText}>{item.note}</Text>
            <Text style={styles.noteDate}>{new Date(item.date).toLocaleString()}</Text>
            <Text style={styles.noteFriend}>To: {item.friend}</Text>
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
    backgroundColor: '#25292e',
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  note: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  noteText: {
    fontSize: 16,
    color: '#fff',
  },
  noteDate: {
    fontSize: 14,
    color: '#aaa',
  },
  noteFriend: {
    fontSize: 14,
    color: '#ffd33d',
  },
});