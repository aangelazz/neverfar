import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Button } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function HomeScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [friendUpdates, setFriendUpdates] = useState([
    { id: 1, name: 'Sarah', image: 'https://randomuser.me/api/portraits/women/65.jpg', time: '2h ago' },
    { id: 2, name: 'Mike', image: 'https://randomuser.me/api/portraits/men/32.jpg', time: '5h ago' },
    { id: 3, name: 'Emma', image: 'https://randomuser.me/api/portraits/women/44.jpg', time: 'Yesterday' }
  ]);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('We need camera permissions to make this app work!');
      }
    })();
  }, []);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 2000); // fake loading for 2 sec
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text>Loading...</Text>
      </View>
    );
  }

  const goToCamera = () => {
    navigation.navigate('Camera');
  };

  const goToFriends = () => {
    navigation.navigate('Friends');
  };

  const goToMenu = () => {
    navigation.navigate('Menu');
  };

  const goToBucketList = () => {
    navigation.navigate('Tabs', { screen: 'Bucket List' });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer} // Apply layout styles here
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={goToMenu}>
          <Text style={styles.buttonText}>🧭 Go to Menu</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Widget</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={goToFriends}>
            <Text style={styles.headerButton}>Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToBucketList}>
            <Text style={styles.headerButton}>Bucket List</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.widgetContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.widgetImage} />
        ) : (
          <View style={styles.emptyWidget}>
            <Text>Tap the camera to share a moment</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.cameraButton} onPress={goToCamera}>
        <Text style={styles.buttonText}>📷 Update Widget</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('TestCamera')}
      >
        <Text>Test Simple Camera</Text>
      </TouchableOpacity>

      <Button
        title="Go to Calendar"
        onPress={() => navigation.navigate('Calendar')}
      />

      <Text style={styles.sectionTitle}>Friend Updates</Text>

      {friendUpdates.map((friend) => (
        <View key={friend.id} style={styles.friendUpdate}>
          <Image source={{ uri: friend.image }} style={styles.friendAvatar} />
          <View style={styles.friendInfo}>
            <Text style={styles.friendName}>{friend.name}</Text>
            <Text style={styles.updateTime}>{friend.time}</Text>
          </View>
        </View>
      ))}

      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>124 miles</Text>
          <Text style={styles.statLabel}>Average Distance</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>17 days</Text>
          <Text style={styles.statLabel}>Until Spring Break</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  contentContainer: {
    flexGrow: 1, // Ensures the ScrollView content takes up the full height
    justifyContent: 'flex-end', // Move the button to the bottom
    alignItems: 'center',
    paddingBottom: 20, // Add some padding at the bottom
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    color: '#52050a',
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  headerButton: {
    color: '#52050a',
    fontSize: 16,
    marginLeft: 15, // Add spacing between buttons
  },
  widgetContainer: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  widgetImage: {
    width: '100%',
    height: 350,
  },
  emptyWidget: {
    width: '100%',
    height: 350,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginHorizontal: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#52050a',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 20,
    marginBottom: 10,
  },
  friendUpdate: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#832161',
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  friendInfo: {
    marginLeft: 15,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '500',
  },
  updateTime: {
    color: '#6c757d',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginVertical: 30,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#52050a',
  },
  statLabel: {
    color: '#52050a',
    marginTop: 5,
  },
});