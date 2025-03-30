import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

// Check if running on web
const isWeb = Platform.OS === 'web';

console.log('==== DATABASE SERVICE INITIALIZING ====');
console.log('Platform:', Platform.OS);

// Memory database implementation
class MemoryDatabase {
  constructor() {
    this.users = [];
    this.initialized = false;
    this.loadInitialData();
  }
  
  async loadInitialData() {
    if (isWeb) {
      try {
        const storedUsers = localStorage.getItem('users');
        if (storedUsers) {
          this.users = JSON.parse(storedUsers);
          console.log(`Loaded ${this.users.length} users from localStorage`);
        }
      } catch (e) {
        console.log('Error loading stored users from localStorage:', e);
      }
    } else {
      // For native platforms, use AsyncStorage
      try {
        const storedUsers = await AsyncStorage.getItem('users');
        if (storedUsers) {
          this.users = JSON.parse(storedUsers);
          console.log(`Loaded ${this.users.length} users from AsyncStorage`);
        }
      } catch (e) {
        console.log('Error loading stored users from AsyncStorage:', e);
      }
    }
    
    // Always ensure test user exists
    this.ensureTestUser();
    this.initialized = true;
  }
  
  ensureTestUser() {
    if (!this.users.some(u => u.username === 'test')) {
      this.users.push({
        id: this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1,
        username: 'test',
        password: 'password123',
        firstName: 'Test', // Add firstName
        lastName: 'User'   // Add lastName
      });
      this.saveData();
      console.log('Default test user added');
    }
  }
  
  async saveData() {
    if (isWeb) {
      localStorage.setItem('users', JSON.stringify(this.users));
    } else {
      // For native platforms, use AsyncStorage
      try {
        await AsyncStorage.setItem('users', JSON.stringify(this.users));
        console.log('Saved users to AsyncStorage');
      } catch (e) {
        console.log('Error saving users to AsyncStorage:', e);
      }
    }
  }
  
  transaction(callback) {
    const tx = {
      executeSql: (query, params, successCallback, errorCallback) => {
        console.log('Memory DB query:', query);
        
        try {
          // Simulate SQL operations using our in-memory data
          if (query.includes('CREATE TABLE')) {
            // No-op, tables always exist in memory DB
            successCallback(tx, { rows: { _array: [], length: 0 } });
          } else if (query.includes('INSERT INTO users')) {
            const [username, password] = params;
            
            // Check if username exists
            const existingUser = this.users.find(u => u.username === username);
            
            if (query.includes('INSERT OR IGNORE') || query.includes('INSERT OR REPLACE')) {
              // Upsert operation
              if (!existingUser) {
                const newUser = {
                  id: this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1,
                  username,
                  password
                };
                this.users.push(newUser);
                this.saveData();
                successCallback(tx, { insertId: newUser.id });
              } else {
                if (query.includes('REPLACE')) {
                  existingUser.password = password;
                  this.saveData();
                }
                successCallback(tx, { insertId: existingUser.id });
              }
            } else {
              // Regular insert
              if (existingUser) {
                errorCallback && errorCallback(tx, new Error('Username already exists'));
              } else {
                const newUser = {
                  id: this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1,
                  username,
                  password
                };
                this.users.push(newUser);
                this.saveData();
                successCallback(tx, { insertId: newUser.id });
              }
            }
          } else if (query.includes('SELECT * FROM users WHERE username = ? AND password = ?')) {
            const [username, password] = params;
            const user = this.users.find(u => 
              u.username === username && u.password === password
            );
            
            successCallback(tx, {
              rows: {
                _array: user ? [user] : [],
                length: user ? 1 : 0
              }
            });
          } else if (query.includes('SELECT * FROM users WHERE username =')) {
            const username = params[0];
            const user = this.users.find(u => u.username === username);
            
            successCallback(tx, {
              rows: {
                _array: user ? [user] : [],
                length: user ? 1 : 0
              }
            });
          } else if (query.includes('SELECT * FROM users')) {
            successCallback(tx, {
              rows: {
                _array: this.users,
                length: this.users.length
              }
            });
          } else if (query.includes('DELETE FROM users')) {
            // Never delete the test user
            this.users = this.users.filter(u => u.username === 'test');
            this.saveData();
            successCallback(tx, {});
          } else {
            successCallback(tx, { rows: { _array: [], length: 0 } });
          }
        } catch (error) {
          console.log('Memory DB error:', error);
          errorCallback && errorCallback(tx, error);
        }
      }
    };
    
    callback(tx);
  }
}

// Create database instance
const memoryDb = new MemoryDatabase();
const dbMemory = memoryDb;

// Initialize database with error handling - using AsyncStorage now
export const initDatabase = async () => {
  console.log("Initializing AsyncStorage database...");
  try {
    // Check if photos have been initialized before
    const photosJson = await AsyncStorage.getItem('photos');
    if (photosJson === null) {
      // Initialize empty photos array
      await AsyncStorage.setItem('photos', JSON.stringify([]));
      console.log("Photos storage initialized");
    } else {
      const photos = JSON.parse(photosJson);
      console.log(`Found ${photos.length} existing photos in storage`);
    }
    return true;
  } catch (error) {
    console.error("AsyncStorage initialization failed:", error);
    return false;
  }
};

// The rest of your functions can remain mostly the same
// They all use the db.transaction API which our memory implementation provides

// Add this to help with debugging
export const getDatabase = () => {
  return {
    type: 'memory',
    users: memoryDb.users
  };
};

// Clear all sessions (for testing)
export const clearAllSessions = async () => {
  console.log('Clearing all sessions');
  if (isWeb) {
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('isLoggedIn');
  } else {
    try {
      // Clear AsyncStorage
      await AsyncStorage.removeItem('user_id');
      await AsyncStorage.removeItem('username');
      await AsyncStorage.removeItem('isLoggedIn');
      
      // Clear SecureStore
      await SecureStore.deleteItemAsync('user_id');
      await SecureStore.deleteItemAsync('username');
      await SecureStore.deleteItemAsync('isLoggedIn');
    } catch (e) {
      console.log('Error clearing sessions:', e);
    }
  }
};

// Simplified authentication - strict check for username AND password
export const authenticateUser = async (username, password) => {
  console.log(`Authenticating: '${username}' with password '${password}'`);
  
  if (!username || !password) {
    console.log('Missing username or password');
    return Promise.reject(new Error('Username and password are required'));
  }
  
  // Special case for test/password123
  if (username === 'test' && password === 'password123') {
    console.log('Using test credentials...');
    
    // Check if test user exists in database
    return new Promise((resolve, reject) => {
      dbMemory.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM users WHERE username = ?',
          ['test'],
          (_, { rows }) => {
            if (rows.length > 0) {
              console.log('Test user found, authenticating');
              resolve(rows._array[0]);
            } else {
              console.log('Test user not found, creating it first');
              // Create test user if it doesn't exist
              tx.executeSql(
                'INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)',
                ['test', 'password123'],
                () => {
                  console.log('Created test user during authentication');
                  // Now get the user to return
                  tx.executeSql(
                    'SELECT * FROM users WHERE username = ?',
                    ['test'],
                    (_, { rows }) => {
                      if (rows.length > 0) {
                        resolve(rows._array[0]);
                      } else {
                        reject(new Error('Failed to create test user'));
                      }
                    },
                    (_, error) => reject(error)
                  );
                },
                (_, error) => reject(error)
              );
            }
          },
          (_, error) => reject(error)
        );
      });
    });
  }
  
  // Standard authentication logic for non-test users
  return new Promise((resolve, reject) => {
    dbMemory.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username, password],
        (_, { rows }) => {
          console.log(`Found ${rows.length} matching users`);
          
          if (rows.length > 0) {
            console.log('Authentication successful');
            resolve(rows._array[0]);
          } else {
            console.log('Authentication failed');
            reject(new Error('Invalid username or password'));
          }
        },
        (_, error) => {
          console.log('Authentication error:', error);
          reject(error);
        }
      );
    });
  });
};

// Unified credential verification
export const verifyCredentials = async (username, password) => {
  try {
    const user = await authenticateUser(username, password);
    
    if (user) {
      console.log("User authenticated:", user);  // Debug the user object
      
      // Save user info in session with firstName explicitly
      await saveUserSession(user.id, user.username, user.firstName);
      return { success: true, user };
    } else {
      return { success: false, error: 'Invalid username or password' };
    }
  } catch (error) {
    console.log('Verification error:', error);
    return { success: false, error: error.message };
  }
};

// Save user session - update to ensure persistence
export const saveUserSession = async (userId, username, firstName = '') => {
  console.log(`Saving session with firstName: ${firstName}`);
  
  if (isWeb) {
    localStorage.setItem('user_id', userId.toString());
    localStorage.setItem('username', username);
    localStorage.setItem('firstName', firstName || '');
    localStorage.setItem('isLoggedIn', 'true');
  } else {
    try {
      await AsyncStorage.setItem('user_id', userId.toString());
      await AsyncStorage.setItem('username', username);
      await AsyncStorage.setItem('firstName', firstName || '');
      await AsyncStorage.setItem('isLoggedIn', 'true');
      
      // Also save in SecureStore as a backup
      await SecureStore.setItemAsync('user_id', userId.toString());
      await SecureStore.setItemAsync('username', username);
      await SecureStore.setItemAsync('firstName', firstName || '');
      await SecureStore.setItemAsync('isLoggedIn', 'true');
    } catch (e) {
      console.log('Error saving session:', e);
    }
  }
  console.log(`Session saved for user: ${username}`);
  return true;
};

// Get user session - update to check both AsyncStorage and SecureStore
export const getUserSession = async () => {
  try {
    let userId, username, firstName, isLoggedIn;
    
    if (isWeb) {
      isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      userId = localStorage.getItem('user_id');
      username = localStorage.getItem('username');
      firstName = localStorage.getItem('firstName');
    } else {
      // Try AsyncStorage first
      isLoggedIn = await AsyncStorage.getItem('isLoggedIn') === 'true';
      userId = await AsyncStorage.getItem('user_id');
      username = await AsyncStorage.getItem('username');
      firstName = await AsyncStorage.getItem('firstName');
      
      // If not found, try SecureStore as backup
      if (!isLoggedIn) {
        isLoggedIn = await SecureStore.getItemAsync('isLoggedIn') === 'true';
        userId = await SecureStore.getItemAsync('user_id');
        username = await SecureStore.getItemAsync('username');
        firstName = await SecureStore.getItemAsync('firstName');
      }
    }
    
    console.log("getUserSession returning:", { userId, username, firstName, isLoggedIn });
    return { userId, username, firstName, isLoggedIn };
  } catch (error) {
    console.log('Error getting session:', error);
    return { isLoggedIn: false };
  }
};

// Log out
export const logoutUser = async () => {
  return clearAllSessions();
};

// List all users
export const listAllUsers = async () => {
  return new Promise((resolve, reject) => {
    dbMemory.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM users',
        [],
        (_, { rows }) => {
          console.log('All users:', rows._array);
          resolve(rows._array);
        },
        (_, error) => {
          console.log('Error listing users:', error);
          reject(error);
        }
      );
    });
  });
};

// User registration
export const registerUser = async (username, password, firstName = '', lastName = '', profileImage = null) => {
  console.log(`Registering user with firstName: ${firstName} and profile image: ${profileImage ? 'provided' : 'not provided'}`);
  
  try {
    // Check if username exists first
    const usersJson = await AsyncStorage.getItem('users');
    const users = usersJson ? JSON.parse(usersJson) : [];
    
    // Check if username exists
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
      throw new Error('Username already exists');
    }
    
    // Create new user with all fields
    const newUserId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const newUser = {
      id: newUserId,
      username,
      password,
      firstName: firstName || '',
      lastName: lastName || '',
      hasProfileImage: !!profileImage, // Flag to indicate if user has a profile image
      createdAt: new Date().toISOString()
    };
    
    // Add to users array
    users.push(newUser);
    
    // Save users to AsyncStorage
    await AsyncStorage.setItem('users', JSON.stringify(users));
    
    // If profile image is provided, save it
    if (profileImage) {
      // Try to save image to file system for native platforms
      let finalImageUri = profileImage;
      
      try {
        // Save image to file system if possible
        if (Platform.OS !== 'web') {
          finalImageUri = await saveImageToFileSystem(profileImage, newUserId);
        }
      } catch (error) {
        console.error('Error saving image to file system:', error);
        // Continue with original URI if there's an error
        finalImageUri = profileImage;
      }
      
      // Now save the profile image reference in AsyncStorage
      const profileImagesJson = await AsyncStorage.getItem('profile_images');
      const profileImages = profileImagesJson ? JSON.parse(profileImagesJson) : {};
      profileImages[newUserId] = finalImageUri;
      await AsyncStorage.setItem('profile_images', JSON.stringify(profileImages));
      console.log(`Saved profile image for user ${newUserId}`);
    }
    
    return newUserId;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// UPDATED PHOTO FUNCTIONS USING ASYNCSTORAGE

// Save a photo
export const saveUserPhoto = async (userId, photoUri, caption = '') => {
  console.log(`Saving photo for user ${userId} with caption: ${caption}`);
  
  try {
    // Check inputs
    if (!userId || !photoUri) {
      throw new Error('User ID and photo URI are required');
    }
    
    // Get existing photos
    const photosJson = await AsyncStorage.getItem('photos');
    const photos = photosJson ? JSON.parse(photosJson) : [];
    
    // Create a new photo object with a unique ID
    const newPhoto = {
      id: Date.now().toString(), // Simple unique ID
      userId: userId,
      photoUri: photoUri,
      caption: caption || '',
      timestamp: new Date().toISOString()
    };
    
    // Add to photos array
    photos.push(newPhoto);
    
    // Save back to AsyncStorage
    await AsyncStorage.setItem('photos', JSON.stringify(photos));
    console.log(`Photo saved successfully with ID: ${newPhoto.id}`);
    
    return newPhoto.id;
  } catch (error) {
    console.error("Error saving photo:", error);
    throw error;
  }
};

// Get photos for a user
export const getUserPhotos = async (userId) => {
  console.log(`Getting photos for user ${userId}`);
  
  try {
    // Get all photos
    const photosJson = await AsyncStorage.getItem('photos');
    
    if (!photosJson) {
      console.log('No photos found in storage');
      return [];
    }
    
    const photos = JSON.parse(photosJson);
    
    // Filter by user ID and sort by timestamp (newest first)
    const userPhotos = photos
      .filter(photo => photo.userId == userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    console.log(`Found ${userPhotos.length} photos for user ${userId}`);
    if (userPhotos.length > 0) {
      console.log("First photo sample:", JSON.stringify(userPhotos[0]));
    }
    
    return userPhotos;
  } catch (error) {
    console.error("Error getting user photos:", error);
    throw error;
  }
};

// Delete a photo
export const deleteUserPhoto = async (photoId) => {
  console.log(`Deleting photo ${photoId}`);
  
  try {
    // Get all photos
    const photosJson = await AsyncStorage.getItem('photos');
    
    if (!photosJson) {
      console.log('No photos found in storage');
      return false;
    }
    
    const photos = JSON.parse(photosJson);
    
    // Filter out the photo to delete
    const updatedPhotos = photos.filter(photo => photo.id !== photoId);
    
    // Check if any photo was removed
    if (photos.length === updatedPhotos.length) {
      console.log(`No photo found with ID: ${photoId}`);
      return false;
    }
    
    // Save the updated array
    await AsyncStorage.setItem('photos', JSON.stringify(updatedPhotos));
    console.log(`Photo ${photoId} deleted successfully`);
    
    return true;
  } catch (error) {
    console.error("Error deleting photo:", error);
    throw error;
  }
};

// Add these functions to your DatabaseService

// Store user friends in AsyncStorage
const FRIENDS_STORAGE_KEY = 'user_friends';

// Function to add a friend relationship
export const addFriend = async (userId, friendId) => {
  try {
    console.log(`Adding friend ${friendId} to user ${userId}`);
    
    // Safety check - prevent adding yourself as a friend
    if (userId == friendId) {
      return { success: false, message: 'You cannot add yourself as a friend' };
    }
    
    // Get current friends
    const friendsJson = await AsyncStorage.getItem('user_friends');
    const allFriendships = friendsJson ? JSON.parse(friendsJson) : {};
    
    // Initialize user's friend array if it doesn't exist
    if (!allFriendships[userId]) {
      allFriendships[userId] = [];
    }
    
    // Check if already a friend (handle both string and number IDs)
    const currentFriends = allFriendships[userId];
    if (currentFriends.includes(friendId) || 
        currentFriends.includes(friendId.toString()) || 
        currentFriends.includes(Number(friendId))) {
      return { success: false, message: 'This user is already your friend' };
    }
    
    // Check if max friends reached
    if (currentFriends.length >= 6) {
      return { success: false, message: 'You can only have up to 6 friends' };
    }
    
    // Add to friends - store ID as string for consistency
    allFriendships[userId].push(friendId.toString());
    
    // Save to AsyncStorage
    await AsyncStorage.setItem('user_friends', JSON.stringify(allFriendships));
    console.log(`Friend ${friendId} added successfully to user ${userId}`);
    
    return { success: true };
  } catch (error) {
    console.error('Error adding friend:', error);
    return { success: false, message: 'An error occurred' };
  }
};

/**
 * Remove a friend relationship
 * @param {number|string} userId - Current user's ID
 * @param {number|string} friendId - ID of the friend to remove
 * @returns {Promise<object>} - Result object with success status
 */
export const removeFriend = async (userId, friendId) => {
  try {
    console.log(`Removing friend ${friendId} from user ${userId}`);
    
    // Get existing friend relationships from AsyncStorage
    const friendsJson = await AsyncStorage.getItem('user_friends');
    const allFriendships = friendsJson ? JSON.parse(friendsJson) : {};
    
    // Check if the user has any friends stored
    if (!allFriendships[userId]) {
      console.log(`No friends found for user ${userId}`);
      return { success: false, message: 'No friends to remove' };
    }
    
    // Get current friends array
    const currentFriends = allFriendships[userId] || [];
    
    // Check if friend exists in the list
    if (!currentFriends.includes(friendId.toString()) && !currentFriends.includes(Number(friendId))) {
      console.log(`Friend ${friendId} not found in user's friend list`);
      return { success: false, message: 'Friend not found in your friends list' };
    }
    
    // Remove friendId from user's friends (handles both string and number IDs)
    allFriendships[userId] = currentFriends.filter(
      id => id !== friendId && id !== friendId.toString() && id !== Number(friendId)
    );
    
    // Save updated friendships back to AsyncStorage
    await AsyncStorage.setItem('user_friends', JSON.stringify(allFriendships));
    console.log(`Friend ${friendId} successfully removed from user ${userId}`);
    
    return { success: true, message: 'Friend removed successfully' };
  } catch (error) {
    console.error('Error removing friend:', error);
    return { success: false, message: 'Failed to remove friend' };
  }
};

// Function to get user's friends
export const getUserFriends = async (userId) => {
  try {
    console.log(`Getting friends for user ${userId}`);
    
    // Get friend relationships from AsyncStorage
    const friendsJson = await AsyncStorage.getItem('user_friends');
    const allFriendships = friendsJson ? JSON.parse(friendsJson) : {};
    
    // Get user's friend IDs (convert to string for comparison)
    const friendIds = allFriendships[userId] || [];
    console.log(`Found ${friendIds.length} friend IDs:`, friendIds);
    
    // If no friends, return empty array
    if (friendIds.length === 0) {
      return [];
    }
    
    // Get all users to lookup friend details
    const usersJson = await AsyncStorage.getItem('users');
    const users = usersJson ? JSON.parse(usersJson) : [];
    
    // Map friend IDs to user objects
    const friends = friendIds
      .map(friendId => {
        // Handle both string and number IDs when finding the user
        const user = users.find(u => 
          u.id === friendId || 
          u.id === Number(friendId) || 
          u.id.toString() === friendId.toString()
        );
        
        if (user) {
          return {
            id: user.id,
            username: user.username,
            firstName: user.firstName || '',
            lastName: user.lastName || ''
          };
        }
        return null;
      })
      .filter(Boolean); // Remove any null entries (friends that weren't found)
    
    console.log(`Returning ${friends.length} friends for user ${userId}`);
    return friends;
  } catch (error) {
    console.error('Error getting user friends:', error);
    return [];
  }
};

// Function to get a user's profile image
export const getUserProfileImage = async (userId) => {
  try {
    // First check if we have a stored profile image
    const profileImagesJson = await AsyncStorage.getItem('profile_images');
    const profileImages = profileImagesJson ? JSON.parse(profileImagesJson) : {};
    
    // Return the profile image if it exists
    if (profileImages[userId]) {
      return profileImages[userId];
    }
    
    // Otherwise return null (will use default image)
    return null;
  } catch (error) {
    console.error('Error getting profile image:', error);
    return null;
  }
};

// Function to set a user's profile image
export const setUserProfileImage = async (userId, imageUri) => {
  try {
    // Get existing profile images
    const profileImagesJson = await AsyncStorage.getItem('profile_images');
    const profileImages = profileImagesJson ? JSON.parse(profileImagesJson) : {};
    
    // Set this user's profile image
    profileImages[userId] = imageUri;
    
    // Save updated profile images
    await AsyncStorage.setItem('profile_images', JSON.stringify(profileImages));
    
    return true;
  } catch (error) {
    console.error('Error setting profile image:', error);
    return false;
  }
};

// Function to get photos by a specific user
export const getUserPhotosByUserId = async (userId) => {
  try {
    // Get all photos from AsyncStorage
    const photosJson = await AsyncStorage.getItem('photos');
    
    if (!photosJson) {
      return [];
    }
    
    const photos = JSON.parse(photosJson);
    
    // Filter by this user id
    const userPhotos = photos
      .filter(photo => photo.userId == userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return userPhotos;
  } catch (error) {
    console.error("Error getting user photos by ID:", error);
    return [];
  }
};

// Add this function to store consistent profile images

// Constants
const PROFILE_IMAGES_KEY = 'profile_images_mapping';

// Get or generate a consistent profile image for a user
export const getConsistentProfileImage = async (userId) => {
  try {
    // First check if the user has an actual profile image
    const profileImagesJson = await AsyncStorage.getItem('profile_images');
    const profileImages = profileImagesJson ? JSON.parse(profileImagesJson) : {};
    
    // If user has a custom profile image, return it
    if (profileImages[userId]) {
      console.log(`Found stored profile image for user ${userId}`);
      return profileImages[userId];
    }
    
    // Check if we've already assigned a random image
    const randomImagesJson = await AsyncStorage.getItem('random_profile_images');
    const randomImages = randomImagesJson ? JSON.parse(randomImagesJson) : {};
    
    // If we've already assigned a random image, return it
    if (randomImages[userId]) {
      console.log(`Found random profile image for user ${userId}`);
      return randomImages[userId];
    }
    
    // Generate and store a random image for this user
    console.log(`Generating new random profile image for user ${userId}`);
    const gender = Math.random() > 0.5 ? 'men' : 'women';
    const imageNumber = Math.floor(Math.random() * 100);
    const randomImageUrl = `https://randomuser.me/api/portraits/${gender}/${imageNumber}.jpg`;
    
    // Store this assignment for future use
    randomImages[userId] = randomImageUrl;
    await AsyncStorage.setItem('random_profile_images', JSON.stringify(randomImages));
    
    return randomImageUrl;
  } catch (error) {
    console.error('Error getting consistent profile image:', error);
    // Fallback to a default image
    return `https://randomuser.me/api/portraits/lego/1.jpg`;
  }
};

// Add this function to save the image to the file system
export const saveImageToFileSystem = async (imageUri, userId) => {
  try {
    // Only works on native platforms
    if (Platform.OS === 'web') {
      // For web, just return the original URI
      return imageUri;
    }
    
    // Make sure FileSystem is available
    if (!FileSystem) {
      console.log('FileSystem not available, returning original URI');
      return imageUri;
    }
    
    // Create directory if it doesn't exist
    const profileDirectory = `${FileSystem.documentDirectory}profiles/`;
    const dirInfo = await FileSystem.getInfoAsync(profileDirectory);
    
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(profileDirectory, { intermediates: true });
    }
    
    // Generate a unique filename
    const filename = `profile_${userId}_${Date.now()}.jpg`;
    const newUri = `${profileDirectory}${filename}`;
    
    // Copy the image to our app's file system
    await FileSystem.copyAsync({
      from: imageUri,
      to: newUri
    });
    
    console.log(`Image saved to file system at: ${newUri}`);
    return newUri;
  } catch (error) {
    console.error('Error saving image to file system:', error);
    // Return original URI if there's an error
    return imageUri;
  }
};

// Add these to your default export
export default {
  initDatabase,
  authenticateUser,
  registerUser,
  verifyCredentials,
  saveUserSession,
  getUserSession,
  logoutUser,
  listAllUsers,
  clearAllSessions,
  getDatabase,
  saveUserPhoto,
  getUserPhotos,
  deleteUserPhoto,
  addFriend,
  removeFriend,
  getUserFriends,
  getUserProfileImage,
  setUserProfileImage,
  getUserPhotosByUserId,
  getConsistentProfileImage,
  saveImageToFileSystem
};