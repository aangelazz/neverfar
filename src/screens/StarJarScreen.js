import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

export default function StarJarScreen() {
  // Mock data for notes
  const [notes, setNotes] = useState([
    { id: '1', note: 'Happy Birthday!', date: '2025-04-01', friend: 'Alice' },
    { id: '2', note: 'Let’s catch up soon!', date: '2025-04-05', friend: 'Bob' },
    { id: '3', note: 'Good luck on your exam!', date: '2025-03-28', friend: 'Charlie' },
  ]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Star Jar Notes</Text>
      <Text style={styles.subtitle}>All Notes (Upcoming and My StarJar)</Text>
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>{item.note}</Text>
            <Text style={styles.noteDate}>Date: {item.date}</Text>
            <Text style={styles.noteFriend}>To/From: {item.friend}</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 20,
    textAlign: 'center',
  },
  noteCard: {
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
    marginTop: 5,
  },
  noteFriend: {
    fontSize: 14,
    color: '#ffd33d',
    marginTop: 5,
  },
});