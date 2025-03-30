import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Image, 
  SafeAreaView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function CameraScreen({ navigation }) {
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
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

  // Save image and navigate back
  const saveAndGoBack = () => {
    if (capturedImage) {
      navigation.navigate('Menu', { capturedImage: capturedImage });
    } else {
      Alert.alert('Error', 'No image captured');
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
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
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
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={retakePicture}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={saveAndGoBack}>
            <Text style={styles.buttonText}>Share Moment</Text>
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
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, styles.fullWidthButton]}
          onPress={useSystemCamera}
        >
          <Text style={styles.buttonText}>Take Photo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.fullWidthButton, { marginTop: 15 }]}
          onPress={pickImage}
        >
          <Text style={styles.buttonText}>Choose from Gallery</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.fullWidthButton, { marginTop: 15, backgroundColor: '#555' }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    backgroundColor: '#6366f1',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});