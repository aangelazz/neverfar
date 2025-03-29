import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView, ActivityIndicator } from 'react-native';

const friends = [
  { id: 1, image: 'https://randomuser.me/api/portraits/women/65.jpg' },
  { id: 2, image: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { id: 3, image: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { id: 4, image: 'https://randomuser.me/api/portraits/men/73.jpg' },
  { id: 5, image: 'https://randomuser.me/api/portraits/women/25.jpg' },
  { id: 6, image: 'https://randomuser.me/api/portraits/men/12.jpg' },
];

const { width } = Dimensions.get('window');
const radius = width * 0.35;

export default function HomePage() {
  const centerX = width / 2 - 40; // offset for 80x80 images
  const centerY = width / 2 - 40;

  return (
    <View style={styles.container}>
      {/* Heart Button */}
      <TouchableOpacity style={styles.heartButton}>
        <Text style={styles.heart}>❤️</Text>
      </TouchableOpacity>

      {/* Friends in a circle */}
      {friends.map((friend, index) => {
        const angle = (2 * Math.PI / friends.length) * index;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        return (
          <Image
            key={friend.id}
            source={{ uri: friend.image }}
            style={[styles.friendAvatar, { left: x, top: y }]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  heartButton: {
    position: 'absolute',
    top: '40%',
    left: '40%',
    width: 80,
    height: 80,
    backgroundColor: '#ff6b81',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    elevation: 4,
  },
  heart: {
    fontSize: 32,
    color: 'white',
  },
  friendAvatar: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'white',
  },
});