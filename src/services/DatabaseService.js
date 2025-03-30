import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
export const registerUser = async (username, password, firstName = '', lastName = '') => {
  console.log(`Registering user with firstName: ${firstName}`);
  
  return new Promise((resolve, reject) => {
    dbMemory.transaction(tx => {
      // Check if username exists
      tx.executeSql(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (_, { rows }) => {
          if (rows.length > 0) {
            reject(new Error('Username already exists'));
          } else {
            // Insert new user WITH firstName and lastName
            tx.executeSql(
              'INSERT INTO users (username, password, firstName, lastName) VALUES (?, ?, ?, ?)',
              [username, password, firstName, lastName],
              (_, { insertId }) => {
                console.log('User registered with ID and firstName:', insertId, firstName);
                resolve(insertId);
              },
              (_, error) => {
                reject(error);
              }
            );
          }
        },
        (_, error) => {
          reject(error);
        }
      );
    });
  });
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
  deleteUserPhoto
};