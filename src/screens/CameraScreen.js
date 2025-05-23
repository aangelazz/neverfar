import React, { useState, useEffect, useLayoutEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  SafeAreaView, 
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getUserSession, saveUserPhoto } from '../services/DatabaseService';

export default function CameraScreen({ navigation }) {
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [caption, setCaption] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  // Move the useLayoutEffect inside the component
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity 
          style={{ marginLeft: 15 }}
          onPress={() => navigation.navigate('Nav')}
        >
          <Text style={{ color: '#fff', fontSize: 16 }}>Cancel</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  
  // Load user session when component mounts
  useEffect(() => {
    const loadUserSession = async () => {
      try {
        const session = await getUserSession();
        console.log("Camera: User session loaded:", session);
        if (session && session.isLoggedIn) {
          setCurrentUser({
            userId: session.userId,
            username: session.username,
            firstName: session.firstName
          });
          console.log("Camera: Current user set:", session.userId);
        } else {
          console.log("Camera: No active user session");
          Alert.alert('Login Required', 'Please login to use the camera');
          navigation.navigate('Login');
        }
      } catch (error) {
        console.error('Failed to load user session:', error);
      }
    };
    
    loadUserSession();
  }, []);
  
  // Function to use the device's system camera
  const useSystemCamera = async () => {
    setLoading(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow camera access to take photos');
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log("Photo captured:", result.assets[0].uri);
        setCapturedImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error using system camera:', err);
      setError(`System camera error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to pick an image from the gallery
  const pickImage = async () => {
    setLoading(true);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need gallery permissions to make this work!');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log("Image picked:", result.assets[0].uri);
        setCapturedImage(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      setError('Failed to pick image from gallery');
    } finally {
      setLoading(false);
    }
  };
  
  // Automatically open system camera when component mounts
  useEffect(() => {
    // Uncomment this line to automatically open the camera when screen loads
    // useSystemCamera();
  }, []);
  
  // Handle retake
  const retakePicture = () => {
    setCapturedImage(null);
    setError(null);
    useSystemCamera();
  };

  // Update the saveAndGoBack function

  const saveAndGoBack = async () => {
    if (!capturedImage) {
      Alert.alert('Error', 'No image captured');
      return;
    }
    
    setLoading(true);
    try {
      // Get current user session
      const session = await getUserSession();
      if (!session || !session.isLoggedIn) {
        Alert.alert('Error', 'You need to be logged in to save photos');
        return;
      }
      
      console.log(`Saving photo for user ${session.userId}`);
      
      // Save to database
      const photoId = await saveUserPhoto(
        session.userId, 
        capturedImage,
        caption || '' // Use caption if it exists
      );
      
      console.log(`Photo saved with ID: ${photoId}`);
      
      // Navigate directly to PhotoGallery without showing an alert
      navigation.navigate('PhotoGallery');
      
    } catch (err) {
      console.error('Error saving photo:', err);
      Alert.alert('Error', 'Failed to save your photo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Display loading indicator
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.message}>Processing...</Text>
      </SafeAreaView>
    );
  }
  
  // Display error message
  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.errorMessage}>{error}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={useSystemCamera}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Nav')}
          >
            <Text style={styles.buttonText}>Go Back To Navigation</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // Display captured image
  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <Image source={{ uri: capturedImage }} style={styles.preview} />
        
        {/* Add caption input */}
        <View style={styles.captionContainer}>
          <TextInput
            style={styles.captionInput}
            placeholder="Add a caption (optional)"
            placeholderTextColor="#ccc"
            value={caption}
            onChangeText={setCaption}
          />
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={retakePicture}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={saveAndGoBack}
          >
            <Text style={styles.buttonText}>Save Photo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // Display camera options (main screen)
  return (
    <SafeAreaView style={[styles.container, styles.centered]}>
      <Text style={styles.header}>Capture a Moment</Text>

      <View style={styles.optionsContainer}>
        {/* Take Photo Button */}
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, styles.fullWidthButton]}
          onPress={useSystemCamera}
        >
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>

        {/* Choose from Gallery Button */}
        <TouchableOpacity
          style={[styles.galleryButton, styles.fullWidthButton]}
          onPress={pickImage}
        >
          <Text style={styles.buttonText}>Choose from Gallery</Text>
        </TouchableOpacity>

        {/* Go Back Button */}
        <TouchableOpacity
          style={styles.goBackButton}
          onPress={() => navigation.navigate('Nav')}
        >
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>

      {/* View Gallery Button */}
      <TouchableOpacity
        style={styles.galleryButton}
        onPress={() => navigation.navigate('PhotoGallery')}
      >
        <Text style={styles.galleryButtonText}>View Gallery</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#467498', // Screen background color
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#ff6b6b',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    padding: 20,
  },
  fullWidthButton: {
    width: '100%',
  },
  preview: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
  },
  button: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '48%',
  },
  primaryButton: {
    backgroundColor: '#832161', // Take Photo button background color
  },
  goBackButton: {
    backgroundColor: '#bcd2ed', // Go Back button background color
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginTop: 15,
  },
  goBackButtonText: {
    color: '#d282a6', // Updated Go Back button text color
    fontSize: 16,
    fontWeight: 'bold',
  },
  galleryButton: {
    backgroundColor: 'transparent', // Updated Choose from Gallery button background to transparent
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginTop: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold', // Make the button text bold
  },
  captionContainer: {
    position: 'absolute',
    bottom: 100,
    width: '100%',
    paddingHorizontal: 20,
  },
  captionInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 10,
    padding: 15,
    color: 'white',
    fontSize: 16,
  },
  galleryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});