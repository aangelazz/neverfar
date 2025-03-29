import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { logoutUser } from '../services/DatabaseService';

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

export default function HomePage({ navigation }) {
  // Add error handling and debugging
  return (
    <View style={styles.safeContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>NeverFar</Text>
        
        {/* Circle of friends with position relative to center */}
        <View style={styles.circleContainer}>
          <TouchableOpacity style={styles.heartButton}>
            <Text style={styles.heart}>❤️</Text>
          </TouchableOpacity>
          
          {friends.map((friend, index) => {
            const angle = (2 * Math.PI / friends.length) * index;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            return (
              <Image
                key={friend.id}
                source={{ uri: friend.image }}
                style={[styles.friendAvatar, { 
                  transform: [
                    { translateX: x },
                    { translateY: y }
                  ] 
                }]}
              />
            );
          })}
        </View>
      
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.buttonText}>Go to Home</Text>
        </TouchableOpacity>
      
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={async () => {
            try {
              await logoutUser();
              navigation.replace('Login');
            } catch (error) {
              console.log('Logout error:', error);
            }
          }}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Updated styles
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  circleContainer: {
    width: width * 0.9,
    height: width * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  heartButton: {
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
    top: '50%',
    left: '50%',
    marginLeft: -30,
    marginTop: -30,
  },
  homeButton: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});