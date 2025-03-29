import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import CameraScreen from './src/screens/CameraScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'NeverFar' }}
        />
        <Stack.Screen 
          name="Friends" 
          component={FriendsScreen} 
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