import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Check if running on web
const isWeb = Platform.OS === 'web';

console.log('==== DATABASE SERVICE INITIALIZING ====');

// Database connection
let db;

// Get database file path for debugging
const getDatabasePath = async () => {
  if (isWeb) return 'localStorage (Web)';
  
  try {
    const dbDir = `${FileSystem.documentDirectory}SQLite/`;
    await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
    const dbPath = `${dbDir}neverfar.db`;
    console.log('Database file path:', dbPath);
    return dbPath;
  } catch (error) {
    console.error('Error getting database path:', error);
    return 'unknown';
  }
};

// Initialize database
if (!isWeb) {
  try {
    getDatabasePath();
    const dbName = 'neverfar.db';
    console.log('Opening database:', dbName);
    
    if (typeof SQLite.openDatabase === 'function') {
      db = SQLite.openDatabase(dbName);
      console.log('Database opened with SQLite.openDatabase');
    } else if (typeof SQLite.default?.openDatabase === 'function') {
      db = SQLite.default.openDatabase(dbName);
      console.log('Database opened with SQLite.default.openDatabase');
    } else {
      console.error('SQLite.openDatabase not available');
      db = createMockDatabase();
    }
  } catch (error) {
    console.error('Error opening database:', error);
    db = createMockDatabase();
  }
} else {
  // Web environment - use persistent mock database
  console.log('Using persistent mock database for web');
  db = createPersistentMockDatabase();
}

// Persistent mock database for web
function createPersistentMockDatabase() {
  // Load users from localStorage
  let users = [];
  try {
    const storedUsers = localStorage.getItem('neverfar_users');
    if (storedUsers) {
      users = JSON.parse(storedUsers);
      console.log('Loaded', users.length, 'users from localStorage');
    }
  } catch (error) {
    console.error('Error loading stored users:', error);
  }
  
  // Generate next ID
  let nextId = 1;
  if (users.length > 0) {
    nextId = Math.max(...users.map(u => u.id)) + 1;
  }
  
  // Save users to localStorage
  const saveUsers = () => {
    try {
      localStorage.setItem('neverfar_users', JSON.stringify(users));
      console.log('Saved', users.length, 'users to localStorage');
    } catch (error) {
      console.error('Error saving users:', error);
    }
  };
  
  return {
    transaction: (callback) => {
      const tx = {
        executeSql: (query, params, successCallback, errorCallback) => {
          console.log('Mock DB Query:', query);
          
          try {
            // Handle different query types
            if (query.includes('CREATE TABLE')) {
              // Table creation - nothing to do in mock
              successCallback(tx, { rows: { _array: [], length: 0 } });
            } 
            else if (query.includes('INSERT INTO users')) {
              const [username, password, email] = params;
              
              // Check if username already exists
              if (users.find(u => u.username === username)) {
                if (errorCallback) {
                  errorCallback(tx, { message: 'Username already exists' });
                  return;
                }
              }
              
              // Add new user
              const newUser = {
                id: nextId++,
                username,
                password,
                email: email || ''
              };
              
              users.push(newUser);
              saveUsers();
              
              successCallback(tx, { insertId: newUser.id });
            }
            else if (query.includes('SELECT * FROM users WHERE username')) {
              const [username, password] = params;
              const user = users.find(u => u.username === username && u.password === password);
              
              successCallback(tx, { 
                rows: { 
                  _array: user ? [user] : [],
                  length: user ? 1 : 0
                } 
              });
            }
            else if (query.includes('SELECT COUNT(*) as count FROM users')) {
              successCallback(tx, { 
                rows: { 
                  _array: [{ count: users.length }],
                  length: 1
                } 
              });
            }
            else if (query.includes('INSERT OR IGNORE INTO users')) {
              const [username, password] = params;
              
              // Only add if doesn't exist
              if (!users.find(u => u.username === username)) {
                const newUser = {
                  id: nextId++,
                  username,
                  password,
                  email: ''
                };
                
                users.push(newUser);
                saveUsers();
              }
              
              successCallback(tx, { insertId: nextId - 1 });
            }
            else {
              console.warn('Unhandled mock query:', query);
              successCallback(tx, { rows: { _array: [], length: 0 } });
            }
          } catch (error) {
            console.error('Mock DB error:', error);
            if (errorCallback) {
              errorCallback(tx, error);
            }
          }
        }
      };
      
      callback(tx);
    }
  };
}

// Simple mock database for fallback
function createMockDatabase() {
  // In-memory storage
  const users = [];
  let userId = 1;
  
  return {
    transaction: (callback) => {
      const tx = {
        executeSql: (query, params, successCallback, errorCallback) => {
          console.log('Mock DB Query:', query);
          
          try {
            // Handle different query types
            if (query.includes('CREATE TABLE')) {
              successCallback(tx, { rows: { _array: [], length: 0 } });
            } 
            else if (query.includes('INSERT INTO users')) {
              const [username, password, email] = params;
              users.push({
                id: userId++,
                username,
                password,
                email: email || ''
              });
              successCallback(tx, { insertId: userId - 1 });
            }
            else if (query.includes('SELECT * FROM users WHERE username')) {
              const [username, password] = params;
              const user = users.find(u => u.username === username && u.password === password);
              successCallback(tx, { 
                rows: { 
                  _array: user ? [user] : [],
                  length: user ? 1 : 0
                } 
              });
            }
            else if (query.includes('INSERT OR IGNORE INTO users')) {
              const [username, password] = params;
              
              // Only add if doesn't exist
              if (!users.find(u => u.username === username)) {
                users.push({
                  id: userId++,
                  username,
                  password,
                  email: ''
                });
              }
              
              successCallback(tx, { insertId: userId - 1 });
            }
            else if (query.includes('SELECT COUNT(*) as count FROM users')) {
              successCallback(tx, { 
                rows: { 
                  _array: [{ count: users.length }],
                  length: 1
                } 
              });
            }
            else {
              console.warn('Unhandled mock query:', query);
              successCallback(tx, { rows: { _array: [], length: 0 } });
            }
          } catch (error) {
            console.error('Mock DB error:', error);
            if (errorCallback) {
              errorCallback(tx, error);
            }
          }
        }
      };
      
      callback(tx);
    }
  };
}

// Initialize database with tables
export const initDatabase = async () => {
  console.log('Initializing database tables and default user...');
  
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        // Create users table if not exists
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            email TEXT
          )`,
          [],
          () => { 
            console.log('Users table initialized');
            
            // Add a test user if none exist
            tx.executeSql(
              'SELECT COUNT(*) as count FROM users',
              [],
              (_, { rows }) => {
                const count = rows._array[0].count;
                console.log(`Found ${count} existing users`);
                
                if (count === 0) {
                  console.log('Creating default user: test/password123');
                  
                  tx.executeSql(
                    'INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)',
                    ['test', 'password123'],
                    () => {
                      console.log('Default user created successfully');
                      resolve();
                    },
                    (_, error) => {
                      console.error('Error creating default user:', error);
                      resolve();
                    }
                  );
                } else {
                  resolve();
                }
              },
              (_, error) => {
                console.error('Error counting users:', error);
                resolve(); // Still resolve to not block app startup
              }
            );
          },
          (_, error) => { 
            console.error('Error creating users table:', error);
            reject(error); 
          }
        );
      });
    } catch (error) {
      console.error('Transaction error during initialization:', error);
      reject(error);
    }
  });
};

export const registerUser = (username, password, email = '') => {
  console.log(`Registering user: ${username}`);
  
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        tx.executeSql(
          'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
          [username, password, email],
          (_, { insertId }) => {
            console.log('User registered with ID:', insertId);
            resolve(insertId);
          },
          (_, error) => {
            console.error('Registration error:', error);
            reject(error);
          }
        );
      });
    } catch (error) {
      console.error('Transaction error during registration:', error);
      reject(error);
    }
  });
};

export const authenticateUser = (username, password) => {
  console.log(`Authenticating user: ${username}`);
  
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM users WHERE username = ? AND password = ?',
          [username, password],
          (_, { rows }) => {
            console.log('Auth result rows:', rows.length);
            if (rows.length > 0) {
              resolve(rows._array[0]);
            } else {
              reject(new Error('Invalid credentials'));
            }
          },
          (_, error) => {
            console.error('Auth error:', error);
            reject(error);
          }
        );
      });
    } catch (error) {
      console.error('Transaction error during authentication:', error);
      reject(error);
    }
  });
};

export const saveUserSession = async (userId, username) => {
  console.log(`Saving session for user: ${username} (ID: ${userId})`);
  
  try {
    if (!isWeb) {
      await SecureStore.setItemAsync('user_id', userId.toString());
      await SecureStore.setItemAsync('username', username);
      await SecureStore.setItemAsync('isLoggedIn', 'true');
      console.log('Session saved to SecureStore');
    } else {
      // Web fallback using localStorage
      localStorage.setItem('user_id', userId.toString());
      localStorage.setItem('username', username);
      localStorage.setItem('isLoggedIn', 'true');
      console.log('Session saved to localStorage');
    }
    return true;
  } catch (error) {
    console.error('Error saving session:', error);
    return false;
  }
};

export const getUserSession = async () => {
  try {
    let isLoggedIn, userId, username;
    
    if (!isWeb) {
      isLoggedIn = await SecureStore.getItemAsync('isLoggedIn');
      if (isLoggedIn === 'true') {
        userId = await SecureStore.getItemAsync('user_id');
        username = await SecureStore.getItemAsync('username');
      }
    } else {
      // Web fallback
      isLoggedIn = localStorage.getItem('isLoggedIn');
      if (isLoggedIn === 'true') {
        userId = localStorage.getItem('user_id');
        username = localStorage.getItem('username');
      }
    }
    
    console.log(`Got session: logged in: ${isLoggedIn === 'true'}, user: ${username}`);
    return { 
      userId, 
      username, 
      isLoggedIn: isLoggedIn === 'true' 
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return { isLoggedIn: false };
  }
};

export const logoutUser = async () => {
  try {
    if (!isWeb) {
      await SecureStore.deleteItemAsync('user_id');
      await SecureStore.deleteItemAsync('username');
      await SecureStore.deleteItemAsync('isLoggedIn');
    } else {
      // Web fallback
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
      localStorage.removeItem('isLoggedIn');
    }
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};