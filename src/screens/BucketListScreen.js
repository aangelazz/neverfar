import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  FlatList, 
  StyleSheet, 
  Alert,
  TouchableOpacity,
  ImageBackground, 
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBucketListIdeas } from '../utils/geminiAPI';
import { getUserSession } from '../services/DatabaseService'; // Import to get current user

const { width } = Dimensions.get('window');

export default function BucketListScreen({ navigation }) { // Add navigation prop here
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [userInput, setUserInput] = useState('');
  const [bucketList, setBucketList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // First, load the current user session when component mounts
  useEffect(() => {
    const loadUserSession = async () => {
      try {
        const session = await getUserSession();
        console.log("Session:", session);  // Debug the session
        
        if (session && session.isLoggedIn) {
          // Make sure we store firstName correctly
          setCurrentUser({
            userId: session.userId,
            username: session.username,
            firstName: session.firstName || session.username // Store firstName explicitly
          });
          console.log("Set currentUser:", {
            userId: session.userId,
            username: session.username,
            firstName: session.firstName || session.username
          });
        } else {
          // Handle case where user is not logged in
          Alert.alert('Authentication Required', 'Please log in to use the Bucket List feature');
        }
      } catch (error) {
        console.error('Failed to get user session:', error);
      }
    };
    
    loadUserSession();
  }, []);

  // Add a debug output temporarily to check what currentUser contains
  useEffect(() => {
    console.log("currentUser updated:", currentUser);
  }, [currentUser]);

  const goToHomeScreen = () => {
    navigation.navigate('Menu'); // Navigate to the Menu/Home screen
  };

  // Generate a prompt using Gemini
  const generatePrompt = async () => {
    setLoading(true);
    try {
      const { generatedPrompt } = await getBucketListIdeas();
      setGeneratedPrompt(generatedPrompt);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate a prompt. Please try again.');
      console.error('Error generating prompt:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save the user's response to the bucket list
  const saveResponse = async () => {
    if (!userInput.trim() || !currentUser) return;

    try {
      // Create a new bucket list item with user information
      const newItem = {
        userId: currentUser.userId,
        username: currentUser.username,
        firstName: currentUser.firstName, // Use firstName instead of name
        prompt: generatedPrompt,
        response: userInput,
        timestamp: new Date().toISOString()
      };

      // Get all bucket list items from storage
      const savedListStr = await AsyncStorage.getItem('bucketList');
      const allBucketListItems = savedListStr ? JSON.parse(savedListStr) : [];

      // Add new item to the list
      const newAllList = [...allBucketListItems, newItem];
      
      // Save all items back to storage
      await AsyncStorage.setItem('bucketList', JSON.stringify(newAllList));
      
      // Update state with only the current user's items
      const userItems = newAllList.filter(item => item.userId === currentUser.userId);
      setBucketList(userItems);
      
      // Clear input field
      setUserInput('');
      setGeneratedPrompt(''); // Optional: clear the prompt after saving
    } catch (error) {
      console.error('Failed to save response:', error);
      Alert.alert('Error', 'Failed to save your response. Please try again.');
    }
  };

  // Load only the current user's bucket list items from AsyncStorage
  useEffect(() => {
    const loadBucketList = async () => {
      if (!currentUser) return;
      
      try {
        const savedListStr = await AsyncStorage.getItem('bucketList');
        if (savedListStr) {
          const allItems = JSON.parse(savedListStr);
          
          // Filter items to only show those belonging to the current user
          const userItems = allItems.filter(item => item.userId === currentUser.userId);
          setBucketList(userItems);
        }
      } catch (error) {
        console.error('Failed to load bucket list:', error);
      }
    };
    
    if (currentUser) {
      loadBucketList();
    }
  }, [currentUser]); // Re-run when currentUser changes

  if (!currentUser) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Please log in to use the Bucket List feature</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Nav')}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ImageBackground
      source={require('../../assets/images/bucketBackground.png')} // Set the background image
      style={styles.background} // Use the background style
    >
<View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Nav')}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.username}>{currentUser.firstName}'s Bucket List</Text>
      
      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]} // Apply styles and a disabled style if loading
        onPress={generatePrompt}
        disabled={loading} // Disable the button when loading
      >
        <Text style={styles.buttonText}>Generate a Prompt</Text>
      </TouchableOpacity>

      {loading ? (
        <Text style={styles.prompt}>Generating an interesting prompt...</Text>
      ) : (
        <>
          {/* Only show the prompt, textbox and save button when a prompt has been generated */}
          {generatedPrompt ? (
            <>
              <Text style={styles.prompt}>{generatedPrompt}</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Enter your response to the prompt..."
                value={userInput}
                onChangeText={setUserInput}
              />
              
              <TouchableOpacity
                style={[styles.saveButton, !userInput.trim() && styles.disabledButton]} // Apply styles and a disabled style if input is empty
                onPress={saveResponse}
                disabled={!userInput.trim()} // Disable the button if input is empty
              >
                <Text style={styles.saveButtonText}>Save Response</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </>
      )}
      
      <Text style={styles.listHeader}>
        {bucketList.length > 0 
          ? 'Your Bucket List Items:' 
          : 'You have no bucket list items yet. Generate a prompt and save your response to create one!'}
      </Text>
      
      <FlatList
        data={bucketList}
        keyExtractor={(item, index) => `${item.userId}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.promptText}>Prompt: {item.prompt}</Text>
            <Text style={styles.responseText}>Response: {item.response}</Text>
            <Text style={styles.timestamp}>
              {new Date(item.timestamp).toLocaleDateString()}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No bucket list items yet</Text>
        }
      />
    </View>
    </ImageBackground>
    
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover', // Ensures the image covers the entire screen
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 40, // Add padding to the top to shift the screen down slightly
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#832161', // Light blue background
    paddingVertical: 12, // Vertical padding
    paddingHorizontal: 20, // Horizontal padding
    alignItems: 'center', // Center the text
    marginVertical: 10, // Add vertical spacing
  },
  
  buttonText: {
    color: '#bcd2ee', // Dark red text color
    fontSize: 16, // Font size
    fontWeight: 'bold', // Bold text
  },
  
  disabledButton: {
    backgroundColor: '#d3d3d3', // Gray background when disabled
  },
  backButton: {
    position: 'absolute', // Position the button absolutely
    top: width*0.04, // Distance from the top of the screen
    left: width*0.3, // Distance from the left of the screen
    backgroundColor: 'rgba(210, 130, 166, 0.7)', // Keep the background color
    paddingVertical: 8, // Vertical padding
    paddingHorizontal: 12, // Horizontal padding
  },
  backButtonText: {
    color: '56200A', // Dark red text color
    fontWeight: '500',
  },
  username: {
    fontSize: 20,
    color: '#52050A',
    textAlign: 'center',
    marginBottom: 15,
    backgroundColor: '#bcd2ee',
    padding: 15,
    borderRadius: 24,
  },
  prompt: {
    fontSize: 16,
    color: '#52050A',
    textAlign: 'center',
    marginVertical: 10,
    padding: 10,
    backgroundColor: 'rgba(188, 210, 238,0.7)',
    borderRadius: 5,
  },
  input: {
    backgroundColor: 'rgba(188, 210, 238,0.7)',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderStyle: 'solid',
    borderColor: '#52050A',
    borderWidth: 2,
  },
  listHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#52050A',
    marginTop: 20,
    marginBottom: 10,
    padding: 14,
    borderRadius: 5,
    backgroundColor: 'rgba(210, 130, 166, 0.7)',
  },
  listItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'rgba(210, 130, 166, 0.7)',
    borderRadius: 5,
  },
  promptText: {
    color: '#52050A',
    fontSize: 14,
    marginBottom: 5,
  },
  responseText: {
    color: '#52050A',
    fontSize: 16,
    marginBottom: 5,
  },
  timestamp: {
    color: '#52050A',
    fontSize: 12,
    textAlign: 'right',
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: 'rgba(188, 210, 238,0.7)', // Dark red background
    paddingVertical: 12, // Vertical padding
    paddingHorizontal: 20, // Horizontal padding
    borderRadius: 8, // Rounded corners
    alignItems: 'center', // Center the text
    marginVertical: 10, // Add vertical spacing
    borderStyle: 'solid',
    borderColor: '#52050A',
    borderWidth: 2,
  },
  
  saveButtonText: {
    color: '#52050A', // White text color
    fontSize: 16, // Font size
    fontWeight: 'bold', // Bold text
  },
  
  disabledButton: {
    backgroundColor: '#d3d3d3', // Gray background when disabled
  },
});
