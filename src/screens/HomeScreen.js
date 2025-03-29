import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
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
  
  const goToCamera = () => {
    navigation.navigate('Camera');
  };
  
  const goToFriends = () => {
    navigation.navigate('Friends');
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Widget</Text>
        <TouchableOpacity onPress={goToFriends}>
          <Text style={styles.friendsLink}>Friends</Text>
        </TouchableOpacity>
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
      
      <Text style={styles.sectionTitle}>Friend Updates</Text>
      
      {friendUpdates.map(friend => (
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  friendsLink: {
    color: '#6366f1',
    fontSize: 16,
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
    color: 'white',
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
    borderBottomColor: '#e9ecef',
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
    color: '#6366f1',
  },
  statLabel: {
    color: '#6c757d',
    marginTop: 5,
  }
});