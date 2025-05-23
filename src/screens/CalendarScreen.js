import React, { useState, useLayoutEffect } from 'react';
import { View, Button, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import ical from 'ical.js';
import * as MediaLibrary from 'expo-media-library';

const requestPermissions = async () => {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission to access files is required!');
  }
};

export default function CalendarScreen({ navigation }) {
  const [events, setEvents] = useState([]);

  // Configure the header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Together Time', // Change the header title to "Together Time"
      headerStyle: {
        backgroundColor: '#467498', // Set header background color
      },
      headerTintColor: '#fff', // Set the back button color to white
      headerTitleStyle: {
        color: '#fff', // Set header text color to white
        fontWeight: 'bold',
      },
      headerBackTitle: 'Navigation', // Set back button text
    });
  }, [navigation]);

  const pickFile = async () => {
    await requestPermissions(); // Request permissions
    let result = await DocumentPicker.getDocumentAsync({
      type: 'text/calendar', // Accepts .ics files
    });

    console.log('DocumentPicker result:', result); // Debug log

    // Check if the result contains assets
    if (result.assets && result.assets.length > 0) {
      const file = result.assets[0]; // Get the first file
      console.log('File selected:', file); // Debug log

      if (file.name.endsWith('.ics')) {
        try {
          const fileContent = await FileSystem.readAsStringAsync(file.uri);
          console.log('File content:', fileContent); // Debug log
          if (!fileContent.startsWith('BEGIN:VCALENDAR')) {
            alert('The selected file is not a valid .ics file.');
            return;
          }
          parseICS(fileContent);
          alert('Calendar file uploaded successfully!'); // Notify the user
        } catch (error) {
          console.error('Error reading file:', error);
          alert('Failed to read the selected file. Please try again.');
        }
      } else {
        alert('Please select a valid .ics file.');
      }
    } else if (result.canceled) {
      alert('File selection was canceled.');
    } else {
      alert(`Unexpected error occurred while selecting the file. Result: ${JSON.stringify(result)}`);
    }
  };

  const parseICS = (icsData) => {
    try {
      console.log('Raw ICS Data:', icsData); // Log raw data
      const jcalData = ical.parse(icsData);
      console.log('Parsed jCal Data:', jcalData); // Log parsed jCal data
      const comp = new ical.Component(jcalData);
      const vevents = comp.getAllSubcomponents('vevent');
      console.log('Extracted Events:', vevents); // Log extracted events

      const parsedEvents = vevents.map((vevent) => {
        const event = new ical.Event(vevent);
        console.log('Parsed Event:', event); // Log each parsed event
        return {
          summary: event.summary || 'No Title',
          start: event.startDate ? event.startDate.toString() : 'No Start Time',
          end: event.endDate ? event.endDate.toString() : 'No End Time',
        };
      });

      console.log('Parsed Events Array:', parsedEvents); // Log the final parsed events array
      setEvents((prevEvents) => [...prevEvents, ...parsedEvents]); // Append new events
    } catch (error) {
      console.error('Error parsing ICS file:', error);
      alert('Failed to parse the calendar file. Please ensure it is a valid .ics file.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Heading */}
      <Text style={styles.heading}>Find a time to catch up!</Text>

      {/* Upload Calendar Button */}
      <TouchableOpacity style={styles.button} onPress={pickFile}>
        <Text style={styles.buttonText}>Upload Calendar (.ics)</Text>
      </TouchableOpacity>

      {/* View Calendar Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          console.log('Navigating to ViewCalendar with events:', events); // Debug log
          navigation.navigate('ViewCalendar', { events });
        }}
      >
        <Text style={styles.buttonText}>View Calendar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#d282a6', // Updated screen background color
  },
  button: {
    backgroundColor: '#832161', // Updated button background color
    paddingVertical: 15, // Increased vertical padding for larger buttons
    paddingHorizontal: 30, // Increased horizontal padding for larger buttons
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 10, // Add spacing between buttons
  },
  buttonText: {
    color: '#fff',
    fontSize: 18, // Larger font size for button text
    fontWeight: 'bold', // Bold text
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
});

const viewCalendarStyles = StyleSheet.create({
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
