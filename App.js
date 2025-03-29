import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import CameraScreen from './src/screens/CameraScreen';

const Stack = createStackNavigator();

// Fallback screen in case imports fail
const FallbackScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Loading app...</Text>
  </View>
);

export default function App() {
  useEffect(() => {
    console.log('App mounted');
    console.log('HomeScreen exists:', !!HomeScreen);
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="Home" 
          component={HomeScreen || FallbackScreen} 
          options={{ title: 'NeverFar' }}
        />
        <Stack.Screen 
          name="Friends" 
          component={FriendsScreen || FallbackScreen} 
          options={{ title: 'My Friends' }}
        />
        <Stack.Screen 
          name="Camera" 
          component={CameraScreen} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}