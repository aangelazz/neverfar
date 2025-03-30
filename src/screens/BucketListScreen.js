import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  FlatList, 
  StyleSheet, 
  Alert,
  TouchableOpacity 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBucketListIdeas } from '../utils/geminiAPI';
import { getUserSession } from '../services/DatabaseService'; // Import to get current user

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
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Bucket List Idea Generator</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Nav')}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.username}>{currentUser.firstName}'s Bucket List Answers</Text>
      
      <Button 
        title="Generate a Prompt" 
        onPress={generatePrompt} 
        disabled={loading} 
      />

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
              
              <Button 
                title="Save Response" 
                onPress={saveResponse} 
                disabled={!userInput.trim()} 
              />
            </>
          ) : (
            <Text style={styles.prompt}>Click "Generate a Prompt" to get started!</Text>
          )}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#25292e',
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
  backButton: {
    position: 'absolute',
    right: 0,
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  username: {
    fontSize: 16,
    color: '#4ade80',
    textAlign: 'center',
    marginBottom: 15,
  },
  prompt: {
    fontSize: 16,
    color: '#ffd33d',
    textAlign: 'center',
    marginVertical: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 211, 61, 0.1)',
    borderRadius: 5,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  listHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  listItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#333',
    borderRadius: 5,
  },
  promptText: {
    color: '#ffd33d',
    fontSize: 14,
    marginBottom: 5,
  },
  responseText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  timestamp: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'right',
  },
  emptyText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20,
  }
});
