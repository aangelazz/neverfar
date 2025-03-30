import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
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
  const messageScale = useRef(new Animated.Value(1)).current;
  const message1Opacity = useRef(new Animated.Value(0)).current;
  const message2Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Heart pulse
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

    // Pulse messages
    Animated.loop(
      Animated.sequence([
        Animated.timing(messageScale, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(messageScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Show yNRA.png, then clickToContinue.png, then fade out
    Animated.sequence([
      Animated.timing(message1Opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(message1Opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(message2Opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(message2Opacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.safeContainer}>
      <View style={styles.container}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} />

        <View style={styles.circleContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('Nav')} activeOpacity={0.9}>
            <View style={styles.heartWrapper}>
              <Animated.Image
                source={require('../../assets/images/heart.png')}
                style={[styles.heartButton, { transform: [{ scale: heartScale }] }]}
                resizeMode="contain"
              />

              {/* Message 1: yNRA.png */}
              <Animated.Image
                source={require('../../assets/images/yNRA.png')}
                style={[
                  styles.overlayImage,
                  { opacity: message1Opacity, transform: [{ scale: messageScale }] },
                ]}
                resizeMode="contain"
              />

              {/* Message 2: clickToContinue.png */}
              <Animated.Image
                source={require('../../assets/images/clickToContinue.png')}
                style={[
                  styles.overlayImage,
                  { opacity: message2Opacity, transform: [{ scale: messageScale }] },
                ]}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>

          {friends.map((friend, index) => {
            const angle = (2 * Math.PI / friends.length) * index;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <Image
                key={friend.id}
                source={{ uri: friend.image }}
                style={[
                  styles.friendAvatar,
                  {
                    transform: [{ translateX: x }, { translateY: y }],
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Logout image button in bottom left */}
        <TouchableOpacity
          style={styles.logoutImageWrapper}
          onPress={async () => {
            try {
              await logoutUser();
              navigation.replace('Login');
            } catch (error) {
              console.log('Logout error:', error);
            }
          }}
        >
          <Image
            source={require('../../assets/images/logoutButton.png')}
            style={styles.logoutImage}
            resizeMode="contain"
          />
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
  heartWrapper: {
    position: 'relative',
    width: width * 0.4,
    height: width * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartButton: {
    width: width * 0.4,
    height: width * 0.4,
  },
  overlayImage: {
    position: 'absolute',
    width: width * 0.3,
    height: width * 0.3,
    top: '14%',
    left: '11%',
    transform: [
      { translateX: -(width * 0.15) },
      { translateY: -(width * 0.15) },
    ],
    zIndex: 5,
  },
  friendAvatar: {
    position: 'absolute',
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: width * 0.1,
    borderWidth: 2,
    borderColor: '#832161',
    top: '50%',
    left: '50%',
    marginLeft: -(width * 0.2) / 2,
    marginTop: -(width * 0.2) / 2,
    overflow: 'hidden',
    shadowColor: '#467599',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  logoutImageWrapper: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    width: width * 0.2,
    height: width * 0.2,
  },
  logoutImage: {
    width: '100%',
    height: '100%',
  },
});
