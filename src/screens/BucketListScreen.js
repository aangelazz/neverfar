import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBucketListIdeas } from '../utils/geminiAPI';

export default function BucketListScreen({ navigation }) {
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [userInput, setUserInput] = useState('');
  const [bucketList, setBucketList] = useState([]);
  const [loading, setLoading] = useState(false);

  const generatePrompt = async () => {
    setLoading(true);
    const { generatedPrompt } = await getBucketListIdeas();
    setGeneratedPrompt(generatedPrompt);
    setLoading(false);
  };

  const saveResponse = async () => {
    if (!userInput.trim()) return;

    const newList = [...bucketList, { prompt: generatedPrompt, response: userInput }];
    setBucketList(newList);
    setUserInput('');
    await AsyncStorage.setItem('bucketList', JSON.stringify(newList));
  };

  useEffect(() => {
    const loadBucketList = async () => {
      try {
        const savedList = await AsyncStorage.getItem('bucketList');
        if (savedList) {
          setBucketList(JSON.parse(savedList));
        }
      } catch (error) {
        console.error('Failed to load bucket list:', error);
      }
    };
    loadBucketList();
  }, []);

  const goToHome = () => {
    navigation.navigate('Home');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate('Nav')}
          >
            <Text style={styles.menuButtonText}>🧭 Go to Menu</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Bucket List Generator</Text>

        <Button title="Generate a Prompt" onPress={generatePrompt} disabled={loading} />

        <Text style={styles.prompt}>
          {generatedPrompt || 'Click "Generate a Prompt" to get started!'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your response to the prompt..."
          value={userInput}
          onChangeText={setUserInput}
          placeholderTextColor="#aaa"
        />

        <Button
          title="Save Response"
          onPress={saveResponse}
          disabled={!generatedPrompt || !userInput.trim()}
        />

        {bucketList.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Saved Prompts</Text>
            {bucketList.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.promptText}>Prompt: {item.prompt}</Text>
                <Text style={styles.responseText}>Response: {item.response}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.emptyText}>Your saved prompts will appear here 📝</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
  },
  container: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  menuButton: {
    backgroundColor: '#444',
    padding: 8,
    borderRadius: 6,
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  prompt: {
    fontSize: 16,
    color: '#ffd33d',
    textAlign: 'center',
    marginVertical: 10,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  sectionTitle: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ccc',
    textAlign: 'center',
  },
  listItem: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  promptText: {
    color: '#ffd33d',
    fontSize: 14,
  },
  responseText: {
    color: '#fff',
    fontSize: 16,
  },
  emptyText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
  },
  headerButton: {
    backgroundColor: '#6366f1',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
