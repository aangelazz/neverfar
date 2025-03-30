import axios from 'axios';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: 'AIzaSyD2ygvoFJC7k3OPjglP8ENmbzu_u5va4aw' });

export const getBucketListIdeas = async () => {
  try {
    // Clear the console on reload
    console.clear();

    // Step 1: Generate text using Gemini
    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents:
        'Generate one creative and fun prompt to inspire long-distance friends to come up with a bucket list idea, to be saved for later. For example, Something fun to do on a hot summer day. Please keep the prompt to ideally 1 sentence, or 2 sentences max if additional context is crucial. Use straightforward language. Be more realistic. It should be something friends should be able to do to hang out in a regular weekend.',
    });

    const generatedPrompt = geminiResponse?.text || 'No prompt generated.';

    // Step 2: Output the generated text
    console.log('Generated Prompt:', generatedPrompt);

    // Return the generated prompt
    return {
      generatedPrompt,
    };
  } catch (error) {
    console.error('Error generating prompt:', error);
    return {
      generatedPrompt: 'Error generating prompt.',
    };
  }
};


