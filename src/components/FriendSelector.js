import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function FriendSelector({ selectedFriend, onSelectFriend }) {
  const friends = ['Alice', 'Bob', 'Charlie']; // Replace with dynamic friend list

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select a Friend:</Text>
      <Picker
        selectedValue={selectedFriend || ''} // Default to an empty string if null/undefined
        onValueChange={(itemValue) => onSelectFriend(itemValue)}
        style={styles.picker}
      >
        <Picker.Item label="Select a friend" value="" /> {/* Default placeholder */}
        {friends.map((friend) => (
          <Picker.Item key={friend} label={friend} value={friend} />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 5,
  },
});