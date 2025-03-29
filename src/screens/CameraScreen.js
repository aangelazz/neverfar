import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Camera, CameraType } from 'expo-camera';

export default function CameraScreen({ navigation }) {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  // Add this state variable
  const [type, setType] = useState(CameraType.back);
  const [capturedImage, setCapturedImage] = useState(null);
  const cameraRef = useRef(null);

  // Simplified approach just to get camera working
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text>We need camera permissions to make this app work!</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const retakePicture = () => {
    setCapturedImage(null);
  };

  const saveAndGoBack = () => {
    navigation.navigate('Home', { capturedImage: capturedImage });
  };

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
        onCameraReady={() => setCameraReady(true)}
      >
        <View style={styles.topControls}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setType(type === CameraType.back ? CameraType.front : CameraType.back)} style={styles.flipButton}>
            <Text style={styles.buttonText}>Flip</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bottomControls}>
          {cameraReady && (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={() => {
                if (cameraRef.current) {
                  cameraRef.current.takePictureAsync()
                    .then(photo => {
                      console.log('Photo taken:', photo.uri);
                      setCapturedImage(photo.uri);
                    })
                    .catch(error => console.log('Error taking picture:', error));
                }
              }}
            />
          )}
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
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