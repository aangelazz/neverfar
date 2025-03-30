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

// Updated authenticateUser function with strict validation
export const authenticateUser = async (username, password) => {
  console.log(`Authenticating user: ${username}`);
  
  if (!username || !password) {
    return Promise.reject(new Error('Username and password are both required'));
  }
  
  // Ensure database is initialized
  await ensureDatabaseReady();
  
  return new Promise((resolve, reject) => {
    try {
      db.transaction(tx => {
        // IMPORTANT: Only use a SINGLE query that checks both username AND password
        tx.executeSql(
          'SELECT * FROM users WHERE username = ? AND password = ?',
          [username, password],
          (_, { rows }) => {
            console.log(`Auth result: found ${rows.length} matching users`);
            
            if (rows.length > 0) {
              console.log('Authentication successful');
              resolve(rows._array[0]);
            } else {
              console.log('Invalid credentials for:', username);
              reject(new Error('Invalid username or password'));
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

// Updated verifyCredentials function
export const verifyCredentials = async (username, password) => {
  try {
    console.log(`Verifying credentials for: ${username}`);
    
    // Try to authenticate with exact username/password match
    const user = await authenticateUser(username, password);
    
    // If we get here, authentication was successful
    console.log('Verification successful, saving session');
    
    // Save the session
    await saveUserSession(user.id, user.username);
    
    return {
      success: true,
      user: user
    };
  } catch (error) {
    console.log('Verification failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

// Modify getUserSession to validate the stored credentials
export const getUserSession = async () => {
  try {
    let isLoggedIn, userId, username, lastValidated;
    
    if (!isWeb) {
      isLoggedIn = await SecureStore.getItemAsync('isLoggedIn');
      if (isLoggedIn === 'true') {
        userId = await SecureStore.getItemAsync('user_id');
        username = await SecureStore.getItemAsync('username');
        lastValidated = await SecureStore.getItemAsync('session_validated');
        
        // Check if session needs validation (validate at least once per day)
        const now = new Date().getTime();
        const lastValidTime = lastValidated ? parseInt(lastValidated) : 0;
        const needsValidation = now - lastValidTime > 24 * 60 * 60 * 1000;
        
        // If session is old, validate the user actually exists in DB
        if (needsValidation && userId) {
          const isValid = await validateUserExists(userId);
          if (!isValid) {
            console.log('Invalid session detected, logging out');
            await logoutUser();
            return { isLoggedIn: false };
          }
          
          // Update validation timestamp
          await SecureStore.setItemAsync('session_validated', now.toString());
        }
      }
    } else {
      // Similar logic for web
      isLoggedIn = localStorage.getItem('isLoggedIn');
      if (isLoggedIn === 'true') {
        userId = localStorage.getItem('user_id');
        username = localStorage.getItem('username');
        lastValidated = localStorage.getItem('session_validated');
        
        const now = new Date().getTime();
        const lastValidTime = lastValidated ? parseInt(lastValidated) : 0;
        const needsValidation = now - lastValidTime > 24 * 60 * 60 * 1000;
        
        if (needsValidation && userId) {
          const isValid = await validateUserExists(userId);
          if (!isValid) {
            await logoutUser();
            return { isLoggedIn: false };
          }
          localStorage.setItem('session_validated', now.toString());
        }
      }
    }
    
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

// Add a helper function to validate that a user ID exists
export const validateUserExists = async (userId) => {
  await ensureDatabaseReady();
  
  return new Promise((resolve) => {
    try {
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM users WHERE id = ?',
          [userId],
          (_, { rows }) => {
            resolve(rows.length > 0);
          },
          () => resolve(false)
        );
      });
    } catch (error) {
      console.log('Error validating user:', error);
      resolve(false);
    }
  });
};

// Add saveUserSession function
export const saveUserSession = async (userId, username) => {
  console.log(`Saving session for user: ${username}`);
  
  try {
    const now = new Date().getTime().toString();
    
    if (!isWeb) {
      await SecureStore.setItemAsync('user_id', userId.toString());
      await SecureStore.setItemAsync('username', username);
      await SecureStore.setItemAsync('isLoggedIn', 'true');
      await SecureStore.setItemAsync('session_start', now);
      await SecureStore.setItemAsync('session_validated', now);
    } else {
      localStorage.setItem('user_id', userId.toString());
      localStorage.setItem('username', username);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('session_start', now);
      localStorage.setItem('session_validated', now);
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
      await SecureStore.deleteItemAsync('session_start');
      await SecureStore.deleteItemAsync('session_validated');
    } else {
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('session_start');
      localStorage.removeItem('session_validated');
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

// Add checkSessionValidity function
export const checkSessionValidity = async () => {
  try {
    const sessionData = await getUserSession();
    if (!sessionData.isLoggedIn) return false;
    
    // Get session start time
    let sessionStart;
    if (!isWeb) {
      sessionStart = await SecureStore.getItemAsync('session_start');
    } else {
      sessionStart = localStorage.getItem('session_start');
    }
    
    if (sessionStart) {
      const startTime = parseInt(sessionStart);
      const now = new Date().getTime();
      const sessionAge = now - startTime;
      
      // Session expires after 7 days
      const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
      
      if (sessionAge > SESSION_MAX_AGE) {
        console.log('Session expired, logging out');
        await logoutUser();
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.log('Error checking session validity:', error);
    return false;
  }
};

// Add this function to ensure default user exists
export const ensureDefaultUserExists = async () => {
  console.log('Ensuring default test user exists...');
  await ensureDatabaseReady();
  
  return new Promise((resolve, reject) => {
    try {
      // First check if test user exists
      db.transaction(tx => {
        tx.executeSql(
          'SELECT * FROM users WHERE username = ?',
          ['test'],
          (_, { rows }) => {
            if (rows.length > 0) {
              console.log('Default test user already exists');
              resolve(rows._array[0]);
            } else {
              console.log('Creating default test user...');
              // Create the default user
              tx.executeSql(
                'INSERT INTO users (username, password) VALUES (?, ?)',
                ['test', 'password123'],
                (_, { insertId }) => {
                  console.log('Default test user created with ID:', insertId);
                  resolve({ id: insertId, username: 'test', password: 'password123' });
                },
                (_, error) => {
                  console.log('Error creating default user:', error);
                  reject(error);
                }
              );
            }
          },
          (_, error) => {
            console.log('Error checking for default user:', error);
            reject(error);
          }
        );
      });
    } catch (error) {
      console.log('Transaction error in ensureDefaultUserExists:', error);
      reject(error);
    }
  });
};

// Add this function to delete the database
export const deleteDatabase = async () => {
  console.log('Attempting to delete database...');
  
  // Close the database connection first
  db = null;
  
  if (isWeb) {
    // Web version - clear localStorage
    localStorage.removeItem('neverfar_users');
    console.log('Cleared web database from localStorage');
    return true;
  } else {
    try {
      // For native apps
      const dbDir = `${FileSystem.documentDirectory}SQLite/`;
      const dbPath = `${dbDir}neverfar.db`;
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      
      if (fileInfo.exists) {
        // Delete the file
        await FileSystem.deleteAsync(dbPath);
        console.log('Database file deleted successfully');
      } else {
        console.log('Database file does not exist');
      }
      
      // Also delete any journal or temporary files
      const dirContents = await FileSystem.readDirectoryAsync(dbDir);
      for (const file of dirContents) {
        if (file.includes('neverfar.db')) {
          await FileSystem.deleteAsync(`${dbDir}${file}`);
          console.log(`Deleted related file: ${file}`);
        }
      }
      
      return true;
    } catch (error) {
      console.log('Error deleting database:', error);
      return false;
    }
  }
};

// Add this to export all functions for easy importing
export default {
  registerUser,
  authenticateUser,
  getUserSession,
  saveUserSession,
  logoutUser,
  listAllUsers,
  initDatabase,
  validateUserExists,
  checkSessionValidity,
  verifyCredentials,
  ensureDefaultUserExists,
  deleteDatabase
};
