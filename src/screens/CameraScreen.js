screens/CameraScreen.js
import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

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
  
  const savePicture = () => {
    // Here you would upload to your backend/friends
    navigation.navigate('Home');
  };
  
  const retakePicture = () => {
    setCapturedImage(null);
  };
  
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    
    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
    }
  };
  
  if (hasPermission === null) {
    return <View style={styles.container}><Text>Requesting camera permission...</Text></View>;
  }
  
  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }
  
  return (
    <View style={styles.container}>
      {capturedImage ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          <View style={styles.previewButtons}>
            <TouchableOpacity style={styles.button} onPress={retakePicture}>
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={savePicture}>
              <Text style={styles.buttonText}>Share with Friends</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <Camera style={styles.camera} type={type} ref={cameraRef}>
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => {
                  setType(
                    type === Camera.Constants.Type.back
                      ? Camera.Constants.Type.front
                      : Camera.Constants.Type.back
                  );
                }}>
                <Text style={styles.flipText}>Flip</Text>
              </TouchableOpacity>
            </View>
          </Camera>
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
              <Text style={styles.buttonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture} />
            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 20,
  },
  flipButton: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 10,
  },
  flipText: {
    color: 'white',
    fontSize: 16,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    width: '100%',
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  galleryButton: {
    alignSelf: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 5,
    borderColor: 'white',
    backgroundColor: 'white',
  },
  cancelButton: {
    alignSelf: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: 'white',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
  previewButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 20,
  },
  button: {
    backgroundColor: '#555',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 0.45,
  },
  saveButton: {
    backgroundColor: '#6366f1',
  }
});