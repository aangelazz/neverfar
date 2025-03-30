import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  Text,
  ActivityIndicator,
} from 'react-native';
import { logoutUser, getUserSession, getUserFriends, getUserProfileImage } from '../services/DatabaseService';

const { width } = Dimensions.get('window');
const radius = width * 0.35; // Distance from center to friend icons

export default function HomePage({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userFriends, setUserFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const heartScale = useRef(new Animated.Value(1)).current;
  const messageScale = useRef(new Animated.Value(1)).current;
  const message1Opacity = useRef(new Animated.Value(0)).current;
  const message2Opacity = useRef(new Animated.Value(0)).current;

  // Load user session and friends
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get current user session
        const session = await getUserSession();
        
        if (session && session.isLoggedIn) {
          setCurrentUser({
            userId: session.userId,
            username: session.username,
            firstName: session.firstName || session.username
          });
          
          // Get user's friends
          const friends = await getUserFriends(session.userId);
          console.log('Loaded friends:', friends);
          
          // If the user has friends, process them - otherwise friendsWithImages will be empty array
          if (friends && friends.length > 0) {
            // Fetch profile images for each friend - WITHOUT random generation
            const friendsWithImages = await Promise.all(
              friends.map(async (friend) => {
                const profileImage = await getUserProfileImage(friend.id);
                return {
                  ...friend,
                  image: profileImage // No fallback to random images
                };
              })
            );
            setUserFriends(friendsWithImages);
          } else {
            // Set empty array instead of default friends
            setUserFriends([]);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setUserFriends([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  // Animation effects
  useEffect(() => {
    // Heart pulse animation
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

    // Message 1 animation
    Animated.sequence([
      Animated.delay(1000),
      Animated.timing(message1Opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(message1Opacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.delay(500),
      Animated.timing(message2Opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (loading) {
    return (
      <View style={[styles.safeContainer, styles.centered]}>
        <ActivityIndicator size="large" color="#832161" />
        <Text>Loading your friends...</Text>
      </View>
    );
  }

  // Create fixed positions for 6 friend slots
  const friendPositions = [];
  for (let i = 0; i < 6; i++) {
    // Start at -90 degrees (top) and go clockwise
    const angle = ((2 * Math.PI) / 6) * i - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    friendPositions.push({ x, y, angle });
  }

  return (
    <View style={styles.safeContainer}>
      <View style={styles.container}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} />

        <View style={styles.circleContainer}>
          {/* Heart in center */}
          <TouchableOpacity 
            style={styles.heartButtonWrapper}
            onPress={() => navigation.navigate('Nav')} 
            activeOpacity={0.9}
          >
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

          {/* Render friends at fixed positions */}
          {friendPositions.map((position, index) => {
            // Only render if there's a friend for this position
            const friend = userFriends[index];
            if (!friend) return null;

            return (
              <TouchableOpacity 
                key={friend.id || index}
                style={[
                  styles.friendAvatarContainer,
                  {
                    transform: [
                      { translateX: position.x },
                      { translateY: position.y }
                    ]
                  }
                ]}
                onPress={() => {
                  navigation.navigate('PhotoGallery', { 
                    userId: friend.id, 
                    username: friend.username 
                  });
                }}
              >
                {friend.image ? (
                  <Image
                    source={{ uri: friend.image }}
                    style={styles.friendAvatar}
                  />
                ) : (
                  <View style={[styles.friendAvatar, styles.defaultAvatarContainer]}>
                    <Text style={styles.defaultAvatarText}>
                      {friend.firstName ? friend.firstName[0].toUpperCase() : friend.username[0].toUpperCase()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout button */}
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
  heartButtonWrapper: {
    zIndex: 10, // Make sure heart stays on top
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
  friendAvatarContainer: {
    position: 'absolute',
    width: width * 0.2, // Only as wide as the avatar
    height: width * 0.2, // Only as tall as the avatar
    alignItems: 'center',
    justifyContent: 'center',
    left: width * 0.45 - width * 0.1, // Center X (container width/2 - avatar width/2)
    top: width * 0.45 - width * 0.1,  // Center Y
  },
  friendAvatar: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: width * 0.1,
    borderWidth: 2,
    borderColor: '#832161',
    overflow: 'hidden',
    shadowColor: '#467599',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  defaultAvatarContainer: {
    backgroundColor: '#BCD2EE', // Light blue background
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    fontSize: width * 0.1,
    fontWeight: 'bold',
    color: '#832161', // Dark pink text
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
