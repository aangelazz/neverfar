import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { initDatabase, authenticateUser, registerUser, saveUserSession, getUserSession } from '../services/DatabaseService';

// Validation schema
const LoginSchema = Yup.object().shape({
  username: Yup.string()
    .min(3, 'Username too short')
    .required('Username is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
});

export default function LoginScreen({ navigation }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setup = async () => {
      try {
        // Initialize database
        await initDatabase();
        
        // Check if user is already logged in
        const session = await getUserSession();
        if (session.isLoggedIn) {
          navigation.replace('Menu');
        }
      } catch (error) {
        console.error('Setup error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    setup();
  }, [navigation]);

  const handleLogin = async (values) => {
    try {
      const user = await authenticateUser(values.username, values.password);
      await saveUserSession(user.id, user.username);
      navigation.replace('Menu');
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid username or password');
    }
  };

  const handleRegister = async (values) => {
    try {
      const userId = await registerUser(values.username, values.password);
      await saveUserSession(userId, values.username);
      Alert.alert('Success', 'Registration successful!');
      navigation.replace('Menu');
    } catch (error) {
      Alert.alert('Registration Failed', 'Username may already exist');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <Text style={styles.title}>NeverFar</Text>
        <Text style={styles.subtitle}>
          {isRegistering ? 'Create Account' : 'Welcome Back!'}
        </Text>

        <Formik
          initialValues={{ username: '', password: '', confirmPassword: '' }}
          validationSchema={LoginSchema}
          onSubmit={(values) => {
            if (isRegistering) {
              if (values.password !== values.confirmPassword) {
                Alert.alert('Error', 'Passwords do not match');
                return;
              }
              handleRegister(values);
            } else {
              handleLogin(values);
            }
          }}
        >
          {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={handleChange('username')}
                  onBlur={handleBlur('username')}
                  value={values.username}
                  placeholder="Enter your username"
                  autoCapitalize="none"
                />
                {touched.username && errors.username && (
                  <Text style={styles.errorText}>{errors.username}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  onChangeText={handleChange('password')}
                  onBlur={handleBlur('password')}
                  value={values.password}
                  secureTextEntry
                  placeholder="Enter your password"
                />
                {touched.password && errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {isRegistering && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    onChangeText={handleChange('confirmPassword')}
                    onBlur={handleBlur('confirmPassword')}
                    value={values.confirmPassword}
                    secureTextEntry
                    placeholder="Confirm your password"
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.button}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>
                  {isRegistering ? 'Register' : 'Login'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchModeButton}
                onPress={() => setIsRegistering(!isRegistering)}
              >
                <Text style={styles.switchModeText}>
                  {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Formik>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 5,
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  switchModeButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchModeText: {
    color: '#6366f1',
    fontSize: 14,
  },
});