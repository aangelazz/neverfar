import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

export default function ViewCalendarScreen({ route }) {
  const { events } = route.params || { events: [] };

  const findBreaks = (events) => {
    const startOfDay = new Date();
    startOfDay.setHours(8, 0, 0, 0); // 8:00 AM
    const endOfDay = new Date();
    endOfDay.setHours(23, 0, 0, 0); // 11:00 PM

    const sortedEvents = events
      .map((event) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }))
      .filter((event) => event.start >= startOfDay && event.end <= endOfDay)
      .sort((a, b) => a.start - b.start);

    const breaks = [];
    let lastEndTime = startOfDay;

    for (const event of sortedEvents) {
      const gap = (event.start - lastEndTime) / (1000 * 60); // Gap in minutes
      if (gap >= 15) {
        const breakDuration = gap >= 60 ? 60 : gap >= 30 ? 30 : 15;
        breaks.push({
          type: 'break',
          start: new Date(lastEndTime),
          end: new Date(lastEndTime.getTime() + breakDuration * 60 * 1000),
          duration: breakDuration,
        });
      }
      lastEndTime = event.end;
    }

    const finalGap = (endOfDay - lastEndTime) / (1000 * 60); // Gap in minutes
    if (finalGap >= 15) {
      const breakDuration = finalGap >= 60 ? 60 : finalGap >= 30 ? 30 : 15;
      breaks.push({
        type: 'break',
        start: new Date(lastEndTime),
        end: new Date(lastEndTime.getTime() + breakDuration * 60 * 1000),
        duration: breakDuration,
      });
    }

    return breaks;
  };

  const now = new Date();
  const futureEvents = events.filter((event) => new Date(event.end) > now);

  const combinedItems = [
    ...futureEvents.map((event) => ({ ...event, type: 'event' })),
    ...findBreaks(futureEvents),
  ].sort((a, b) => new Date(a.start) - new Date(b.start));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendar Events</Text>
      {combinedItems.length === 0 ? (
        <Text style={styles.noEventsText}>No events to display</Text>
      ) : (
        <FlatList
          data={combinedItems}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) =>
            item.type === 'event' ? (
              <View style={styles.eventBlock}>
                <Text style={styles.eventTitle}>{item.summary || 'No Title'}</Text>
                <Text style={styles.eventTime}>
                  {new Date(item.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {new Date(item.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            ) : (
              <View style={styles.breakBlock}>
                <Text style={styles.breakText}>
                  Add a break/call a friend for {item.duration} minutes?
                </Text>
                <Text style={styles.breakTime}>
                  {new Date(item.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {new Date(item.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            )
          }
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
  breakBlock: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  breakText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  breakTime: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
  },
});