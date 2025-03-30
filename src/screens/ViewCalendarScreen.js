import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

export default function ViewCalendarScreen({ route }) {
  const { events } = route.params || { events: [] };

  console.log('Events passed to ViewCalendarScreen:', events); // Debug log

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendar Events</Text>
      {events.length === 0 ? (
        <Text style={styles.noEventsText}>No events to display</Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.eventBlock}>
              <Text style={styles.eventTitle}>{item.summary || 'No Title'}</Text>
              <Text style={styles.eventTime}>
                {item.start || 'No Start Time'} - {item.end || 'No End Time'}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  noEventsText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
  },
  eventBlock: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffd33d',
  },
  eventTime: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
});