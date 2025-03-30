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
    return 'unknown';
  }
};

// Ensure SQLite directory exists
const ensureDirectoryExists = async () => {
  if (isWeb) return;
  
  try {
    const dbDir = `${FileSystem.documentDirectory}SQLite/`;
    await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });
    const dirContents = await FileSystem.readDirectoryAsync(dbDir);
    console.log('SQLite directory contents:', dirContents);
  } catch (error) {
    // Silently continue if directory creation fails
  }
};

// Initialize database
let dbInitPromise; // Promise to track database initialization

// Modified database initialization code
if (!isWeb) {
  dbInitPromise = (async () => {
    try {
      await ensureDirectoryExists();
      const dbDir = `${FileSystem.documentDirectory}SQLite/`;
      const dbPath = `${dbDir}neverfar.db`;
      console.log('Using database path:', dbPath);

      // Debug: Check if SQLite is available
      console.log('SQLite available:', !!SQLite);
      console.log('SQLite.openDatabase available:', !!SQLite?.openDatabase);
      
      if (!SQLite || typeof SQLite.openDatabase !== 'function') {
        console.log('SQLite module unavailable, using mock database');
        db = createMockDatabase();
      } else {
        try {
          // Use the ABSOLUTE file path to ensure persistence
          db = SQLite.openDatabase(dbPath);
          console.log('Database opened successfully with path');
          
          // Test the database connection immediately
          let testConnectionSuccessful = false;
          await new Promise((resolve, reject) => {
            try {
              db.transaction(tx => {
                tx.executeSql(
                  'SELECT 1',
                  [],
                  () => {
                    console.log('Database test query successful');
                    testConnectionSuccessful = true;
                    resolve();
                  },
                  (_, error) => {
                    console.log('Database test query failed:', error);
                    resolve(); // Still resolve to continue
                  }
                );
              });
            } catch (err) {
              console.log('Transaction error in test:', err);
              resolve(); // Still resolve to continue
            }
          });
          
          // If test failed, fall back to the mock database
          if (!testConnectionSuccessful) {
            console.log('Database test failed, falling back to mock database');
            db = createMockDatabase();
          }
        } catch (dbError) {
          console.log('Error opening database:', dbError);
          db = createMockDatabase();
        }
      }

      // Initialize database (only if db is defined)
      if (db) {
        try {
          await initDatabase();
          console.log('Database initialization complete');
        } catch (initError) {
          console.log('Database initialization failed:', initError);
          db = createMockDatabase();
        }
      } else {
        console.log('Database not defined after opening attempt');
        db = createMockDatabase();
      }
      
      return true;
    } catch (error) {
      console.log('Database setup error:', error);
      db = createMockDatabase();
      return false;
    } finally {
      // Ensure db is always defined
      if (!db) {
        console.log('Setting fallback database in finally block');
        db = createMockDatabase();
      }
    }
  })();
} else {
  console.log('Using persistent mock database for web');
  db = createPersistentMockDatabase();
  dbInitPromise = Promise.resolve(true);
}

// Helper function to ensure database is ready before operations
const ensureDatabaseReady = async () => {
  if (!db) {
    console.log('Database not ready, waiting for initialization...');
    try {
      await dbInitPromise;
      
      if (!db) {
        console.log('Database still not available after initialization, creating mock');
        db = createMockDatabase();
      }
    } catch (error) {
      console.log('Error waiting for database initialization');
      db = createMockDatabase();
    }
  }
  
  // Extra safety check
  if (!db) {
    console.log('Database still undefined after all attempts, creating last-resort mock');
    db = createMockDatabase();
  }
  
  return db;
};

// Persistent mock database for web
function createPersistentMockDatabase() {
  let users = [];
  try {
    const storedUsers = localStorage.getItem('neverfar_users');
    if (storedUsers) {
      users = JSON.parse(storedUsers);
      console.log('Loaded', users.length, 'users from localStorage');
    }
  } catch (error) {
    // Silent failure for localStorage
  }

  let nextId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;

  const saveUsers = () => {
    try {
      localStorage.setItem('neverfar_users', JSON.stringify(users));
      console.log('Saved', users.length, 'users to localStorage');
    } catch (error) {
      // Silent failure
    }
  };

  return {
    transaction: (callback) => {
      const tx = {
        executeSql: (query, params, successCallback, errorCallback) => {
          console.log('Mock DB Query:', query);
          try {
            if (query.includes('CREATE TABLE')) {
              successCallback(tx, { rows: { _array: [], length: 0 } });
            } else if (query.includes('INSERT INTO users')) {
              const [username, password, email] = params;
              if (users.find(u => u.username === username)) {
                if (errorCallback) errorCallback(tx, { message: 'Username already exists' });
                return;
              }
              const newUser = { id: nextId++, username, password, email: email || '' };
              users.push(newUser);
              saveUsers();
              successCallback(tx, { insertId: newUser.id });
            } else if (query.includes('SELECT * FROM users')) {
              successCallback(tx, { rows: { _array: users, length: users.length } });
            } else {
              console.log('Unhandled mock query:', query);
              successCallback(tx, { rows: { _array: [], length: 0 } });
            }
          } catch (error) {
            if (errorCallback) errorCallback(tx, error);
          }
        }
      };
      callback(tx);
    }
  };
}

// Simple mock database for fallback
function createMockDatabase() {
  const users = [];
  let userId = 1;

  return {
    transaction: (callback) => {
      const tx = {
        executeSql: (query, params, successCallback, errorCallback) => {
          console.log('Mock DB Query:', query);
          try {
            if (query.includes('CREATE TABLE')) {
              successCallback(tx, { rows: { _array: [], length: 0 } });
            } else if (query.includes('INSERT INTO users')) {
              const [username, password, email] = params;
              users.push({ id: userId++, username, password, email: email || '' });
              successCallback(tx, { insertId: userId - 1 });
            } else if (query.includes('SELECT * FROM users')) {
              successCallback(tx, { rows: { _array: users, length: users.length } });
            } else {
              console.log('Unhandled mock query:', query);
              successCallback(tx, { rows: { _array: [], length: 0 } });
            }
          } catch (error) {
            if (errorCallback) errorCallback(tx, error);
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
            
            // Force creation of default user without checking count
            tx.executeSql(
              'INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)',
              ['test', 'password123'],
              (_, result) => {
                console.log('Default user created/verified');
                
                // Verify the user exists by selecting it
                tx.executeSql(
                  'SELECT * FROM users WHERE username = ?',
                  ['test'],
                  (_, { rows }) => {
                    if (rows.length > 0) {
                      console.log('Confirmed default user exists:', rows._array[0]);
                    } else {
                      console.log('WARNING: Failed to create default user!');
                      
                      // Try one more time with a direct insert
                      tx.executeSql(
                        'INSERT OR REPLACE INTO users (username, password) VALUES (?, ?)',
                        ['test', 'password123'],
                        () => console.log('Retry: Default user inserted'),
                        (_, insertError) => console.log('Retry insert failed')
                      );
                    }
                    resolve();
                  },
                  (_, error) => {
                    console.log('Error verifying default user');
                    resolve();
                  }
                );
              },
              (_, error) => {
                console.log('Error creating default user:', error);
                resolve();
              }
            );
          },
          (_, error) => {
            console.log('Error creating table:', error);
            reject(error);
          }
        );
      });
    } catch (error) {
      console.log('Transaction error during initialization:', error);
      reject(error);
    }
  });
};

export const registerUser = async (username, password, email = '') => {
  console.log(`Registering user: ${username}`);
  
  // Ensure database is initialized before proceeding
  await ensureDatabaseReady();
  
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized despite attempts'));
      return;
    }
    
    try {
      // Define these functions first
      function performRegistration() {
        db.transaction(tx => {
          tx.executeSql(
            'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
            [username, password, email || ''],
            (_, { insertId }) => {
              console.log('User registered with ID:', insertId);
              resolve(insertId);
            },
            (_, error) => {
              console.log('Error inserting user:', error);
              reject(error);
            }
          );
        });
      }
      
      // Check if username exists
      db.transaction(tx => {
        tx.executeSql(
          'SELECT id FROM users WHERE username = ?',
          [username],
          (_, { rows }) => {
            if (rows.length > 0) {
              reject(new Error('Username already exists'));
            } else {
              performRegistration();
            }
          },
          (_, error) => {
            console.log('Error checking username:', error);
            reject(error);
          }
        );
      });
    } catch (error) {
      console.log('Transaction error in registration:', error);
      reject(error);
    }
  });
};

// Add authenticateUser function
export const authenticateUser = async (username, password) => {
  console.log(`Authenticating user: ${username}`);
  
  // Ensure database is initialized
  await ensureDatabaseReady();
  
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM users WHERE username = ? AND password = ?',
          [username, password],
          (_, { rows }) => {
            if (rows.length > 0) {
              resolve(rows._array[0]);
            } else {
              reject(new Error('Invalid credentials'));
            }
          },
          (_, error) => {
            console.log('Auth error:', error);
            reject(error);
          }
        );
      });
    } catch (error) {
      console.log('Transaction error during auth:', error);
      reject(error);
    }
  });
};

// Add getUserSession function
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
    
    console.log(`Session: logged in: ${isLoggedIn === 'true'}, user: ${username}`);
    return { 
      userId, 
      username, 
      isLoggedIn: isLoggedIn === 'true' 
    };
  } catch (error) {
    console.log('Error getting session:', error);
    return { isLoggedIn: false };
  }
};

// Add saveUserSession function
export const saveUserSession = async (userId, username) => {
  console.log(`Saving session for user: ${username}`);
  
  try {
    if (!isWeb) {
      await SecureStore.setItemAsync('user_id', userId.toString());
      await SecureStore.setItemAsync('username', username);
      await SecureStore.setItemAsync('isLoggedIn', 'true');
    } else {
      // Web fallback using localStorage
      localStorage.setItem('user_id', userId.toString());
      localStorage.setItem('username', username);
      localStorage.setItem('isLoggedIn', 'true');
    }
    return true;
  } catch (error) {
    console.log('Error saving session:', error);
    return false;
  }
};

// Add logoutUser function
export const logoutUser = async () => {
  try {
    if (!isWeb) {
      await SecureStore.deleteItemAsync('user_id');
      await SecureStore.deleteItemAsync('username');
      await SecureStore.deleteItemAsync('isLoggedIn');
    } else {
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
      localStorage.removeItem('isLoggedIn');
    }
    return true;
  } catch (error) {
    console.log('Error during logout:', error);
    return false;
  }
};

// Add listAllUsers function
export const listAllUsers = async () => {
  await ensureDatabaseReady();
  
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM users',
          [],
          (_, { rows }) => {
            console.log('All users:', JSON.stringify(rows._array));
            resolve(rows._array);
          },
          (_, error) => {
            console.log('Error listing users:', error);
            reject(error);
          }
        );
      });
    } catch (error) {
      console.log('Transaction error listing users:', error);
      reject(error);
    }
  });
};

// Add this to export all functions for easy importing
export default {
  registerUser,
  authenticateUser,
  getUserSession,
  saveUserSession,
  logoutUser,
  listAllUsers,
  initDatabase
};