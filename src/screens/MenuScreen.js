import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Animated } from 'react-native';
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
  const heartScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.safeContainer}>
      <View style={styles.container}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} />

        <View style={styles.circleContainer}>
          <Animated.View style={[styles.heartButton, { transform: [{ scale: heartScale }] }]}>
          <Image source={require('../../assets/images/heart.png')} style={styles.heartButton} />
          </Animated.View>

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
                    { translateY: y },
                  ],
                }]}
              />
            );
          })}
        </View>

        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => navigation.navigate('Nav')}
        >
          <Text style={styles.buttonText}>Go to Nav</Text>
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

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#bcd2ee',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  logo: {
    width: width * 0.8,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  circleContainer: {
    width: width * 0.9,
    height: width * 0.9,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -width * 0.2,
    marginBottom: 40,
    position: 'relative',
  },
  heartButton: {
    width: width*0.4,
    height: width*0.4,
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
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: width * 0.1,
    borderWidth: 2,
    borderColor: 'white',
    top: '50%',
    left: '50%',
    marginLeft: -(width * 0.2) / 2,
    marginTop: -(width * 0.2) / 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  homeButton: {
    backgroundColor: '#D282A6',
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
    backgroundColor: '#D282A6',
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
