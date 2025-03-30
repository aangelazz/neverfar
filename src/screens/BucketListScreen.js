import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
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
    <View style={styles.container}>
      <TouchableOpacity style={styles.headerButton} onPress={goToHome}>
        <Text style={styles.buttonText}> Home</Text>
      </TouchableOpacity>
      <Text style={styles.header}>Bucket List Generator</Text>
      <Button title="Generate a Prompt" onPress={generatePrompt} disabled={loading} />
      <Text style={styles.prompt}>{generatedPrompt || 'Click "Generate a Prompt" to get started!'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your response to the prompt..."
        value={userInput}
        onChangeText={setUserInput}
      />
      <Button title="Save Response" onPress={saveResponse} disabled={!generatedPrompt || !userInput.trim()} />
      <FlatList
        data={bucketList}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.promptText}>Prompt: {item.prompt}</Text>
            <Text style={styles.responseText}>Response: {item.response}</Text>
          </View>
        )}
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
  header: {
    fontSize: 20,
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
    padding: 10,
    borderRadius: 5,
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
  },
  responseText: {
    color: '#fff',
    fontSize: 16,
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
