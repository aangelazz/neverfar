import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import FriendsScreen from './src/screens/FriendsScreen';
import CameraScreen from './src/screens/CameraScreen';
import MenuScreen from './src/screens/MenuScreen';
import LoginScreen from './src/screens/LoginScreen';
import BucketListScreen from './src/screens/BucketListScreen';
import NavScreen from './src/screens/NavScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import ViewCalendarScreen from './src/screens/ViewCalendarScreen';
import PhotoGalleryScreen from './src/screens/PhotoGalleryScreen';
import StarJarScreen from './src/screens/StarJarScreen';
import AllNotesScreen from './src/screens/AllNotesScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Fallback screen in case imports fail
const FallbackScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Loading app...</Text>
  </View>
);

// Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Bucket List" component={BucketListScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    console.log('App mounted');
    console.log('HomeScreen exists:', !!HomeScreen);
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{
          gestureEnabled: false,
          cardStyleInterpolator: ({ current, next, layouts }) => ({
          cardStyle: {
            opacity: current.progress,
          },
          }),
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'NeverFar' }}
        />
        <Stack.Screen 
          name="Nav" 
          component={NavScreen} 
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
        <Stack.Screen 
          name="Menu" 
          component={MenuScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Tabs" 
          component={TabNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Bucket" 
          component={BucketListScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Calendar" 
          component={CalendarScreen} 
        />
        <Stack.Screen 
          name="ViewCalendar" 
          component={ViewCalendarScreen} 
        />
        <Stack.Screen 
          name="PhotoGallery" 
          component={PhotoGalleryScreen} 
        />
        <Stack.Screen 
          name="StarJar" 
          component={StarJarScreen} 
        />
        <Stack.Screen 
          name="AllNotes" 
          component={AllNotesScreen} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}