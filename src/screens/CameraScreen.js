import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Camera, CameraType } from 'expo-camera';

export default function CameraScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(CameraType.back);
  const [capturedImage, setCapturedImage] = useState(null);
  const cameraRef = useRef(null);
  
  const requestPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };
  
  React.useEffect(() => {
    requestPermission();
  }, []);
  
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setCapturedImage(photo.uri);
      } catch (error) {
        console.log('Error taking picture:', error);
      }
    }
  };
  
  const flipCamera = () => {
    setType(type === CameraType.back ? CameraType.front : CameraType.back);
  };
  
  const saveAndGoBack = () => {
    navigation.navigate('Home', { capturedImage: capturedImage });
  };
  
  const retakePicture = () => {
    setCapturedImage(null);
  };
  
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera. Please enable camera permissions in settings.</Text>
      </View>
    );
  }
  
  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedImage }} style={styles.preview} />
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={retakePicture}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={saveAndGoBack}>
            <Text style={styles.buttonText}>Share Moment</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Camera 
        style={styles.camera} 
        type={type} 
        ref={cameraRef}
        ratio="16:9"
        onCameraReady={() => console.log('Camera ready')}
        useCamera2Api={true}
      >
        <View style={styles.topControls}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={flipCamera} style={styles.flipButton}>
            <Text style={styles.buttonText}>Flip</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bottomControls}>
          <TouchableOpacity onPress={takePicture} style={styles.captureButton} />
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  topControls: {
    flex: 0.1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  preview: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
  },
  button: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '40%',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
  }
});