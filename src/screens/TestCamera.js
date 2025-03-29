import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera';

export default function TestCamera({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    (async () => {
      console.log("Requesting camera permissions...");
      const { status } = await Camera.requestCameraPermissionsAsync();
      console.log("Permission status:", status);
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (hasPermission === null) {
    return <Text>Requesting camera permission</Text>;
  }
  
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera style={styles.camera} />
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
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
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
  }
});