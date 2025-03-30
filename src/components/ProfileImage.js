import React, { useState, useEffect } from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { getConsistentProfileImage } from '../services/DatabaseService';

const ProfileImage = ({ userId, user, style, size = 50 }) => {
  const [imageSource, setImageSource] = useState(null);
  
  useEffect(() => {
    const loadImage = async () => {
      try {
        // If we have a user object with username
        if (user && user.username === 'test') {
          // Directly use the require statement for the test user
          setImageSource('TEST_USER');
          return;
        }
        
        // If we have a userId, fetch the image
        if (userId) {
          const profileImageUri = await getConsistentProfileImage(userId);
          
          if (profileImageUri === 'DEFAULT_TEST_USER_IMAGE') {
            setImageSource('TEST_USER');
          } else if (profileImageUri) {
            setImageSource({ uri: profileImageUri });
          } else {
            setImageSource(null);
          }
        }
      } catch (error) {
        console.error('Error loading profile image:', error);
        setImageSource(null);
      }
    };
    
    loadImage();
  }, [userId, user]);
  
  // Style based on provided size
  const imageStyle = [
    styles.profileImage,
    { width: size, height: size, borderRadius: size / 2 },
    style
  ];
  
  // Special handling for test user
  if (imageSource === 'TEST_USER') {
    return (
      <Image 
        source={require('../../assets/images/vector-flat-illustration-grayscale-avatar-600nw-2264922221.webp')} 
        style={imageStyle}
      />
    );
  }
  
  // Normal image
  if (imageSource) {
    return <Image source={imageSource} style={imageStyle} />;
  }
  
  // Fallback to initials
  const getInitials = () => {
    if (user) {
      if (user.firstName) {
        return user.firstName.charAt(0).toUpperCase();
      }
      if (user.username) {
        return user.username.charAt(0).toUpperCase();
      }
    }
    return '?';
  };
  
  return (
    <View style={[imageStyle, styles.defaultAvatarContainer]}>
      <Text style={styles.defaultAvatarText}>{getInitials()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#832161',
    overflow: 'hidden',
  },
  defaultAvatarContainer: {
    backgroundColor: '#BCD2EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#832161',
  }
});

export default ProfileImage;