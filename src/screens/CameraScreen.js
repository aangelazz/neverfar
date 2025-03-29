import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, StatusBar } from 'react-native';
import { Camera } from 'expo-camera';

export default function CameraScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [capturedImage, setCapturedImage] = useState(null);
  const cameraRef = useRef(null);
  
  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);
  
  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      setCapturedImage(photo.uri);
    }
  };
  
  const retakePicture = () => {
    setCapturedImage(null);
  };
  
  const saveAndGoBack = () => {
    // Send the image back to HomeScreen
    navigation.navigate('Home', { capturedImage: capturedImage });
  };
  
  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }
  
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {capturedImage ? (
        // Image preview after capture
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          <View style={styles.previewButtons}>
            <TouchableOpacity style={styles.button} onPress={retakePicture}>
              <Text style={styles.text}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={saveAndGoBack}>
              <Text style={styles.text}>Share Moment</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Camera view
        <Camera style={styles.camera} type={type} ref={cameraRef}>
          <View style={styles.upperControls}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Text style={styles.text}>✕</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() => {
                setType(
                  type === Camera.Constants.Type.back
                    ? Camera.Constants.Type.front
                    : Camera.Constants.Type.back
                );
              }}>
              <Text style={styles.text}>Flip</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.lowerControls}>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture} />
          </View>
        </Camera>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  upperControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
  },
  lowerControls: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
  },
  captureButton: {
    backgroundColor: 'white',
    borderRadius: 35,
    height: 70,
    width: 70,
    borderWidth: 5,
    borderColor: '#ddd',
  },
  text: {
    color: 'white',
    fontSize: 16,
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    padding: 20,
  },
  button: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '45%',
  },
  primaryButton: {
    backgroundColor: '#4630EB',
  }
});