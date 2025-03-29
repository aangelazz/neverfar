import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Check if running on web
const isWeb = Platform.OS === 'web';

let db;

if (!isWeb) {
  try {
    db = SQLite.openDatabase('neverfar.db');
  } catch (error) {
    console.error('Error opening database:', error);
    // Provide fallback in case of error
    db = createMockDatabase();
  }
} else {
  // Web environment - use mock database
  console.log('Using mock database for web');
  db = createMockDatabase();
}

// Mock database for web or error fallback
function createMockDatabase() {
  // In-memory storage
  const users = [];
  let userId = 1;
  
  return {
    transaction: (callback) => {
      const tx = {
        executeSql: (query, params, successCallback) => {
          console.log('Mock DB Query:', query);
          
          // Handle different query types
          if (query.includes('CREATE TABLE')) {
            successCallback(tx, { rows: { _array: [] } });
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
        }
      };
      callback(tx);
    }
  };
}

export const initDatabase = async () => {
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
            console.log('Database initialized');
            resolve(); 
          },
          (_, error) => { 
            console.error('SQL error:', error);
            reject(error); 
          }
        );
      });
    } catch (error) {
      console.error('Transaction error:', error);
      reject(error);
    }
  });
};

export const registerUser = (username, password, email = '') => {
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
      console.error('Transaction error:', error);
      reject(error);
    }
  });
};

export const authenticateUser = (username, password) => {
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
      console.error('Transaction error:', error);
      reject(error);
    }
  });
};

export const saveUserSession = async (userId, username) => {
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