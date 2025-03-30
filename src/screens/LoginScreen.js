import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Button,
  Image,
  SafeAreaView
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';  // Make sure to install this
import {
  initDatabase,
  authenticateUser,
  registerUser,
  verifyCredentials,
  listAllUsers,
  clearAllSessions,
  getUserSession,
  saveUserSession
} from '../services/DatabaseService';

// Validation schemas
const LoginSchema = Yup.object().shape({
  username: Yup.string()
    .required('Username is required'),
  password: Yup.string()
    .required('Password is required')
});

const RegisterSchema = Yup.object().shape({
  username: Yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters'),
  password: Yup.string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required')
});

export default function LoginScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    const setup = async () => {
      try {
        console.log('Setting up database...');
        
        // Initialize database with test user
        await initDatabase();
        
        // Check for existing session
        const session = await getUserSession();
        
        if (session.isLoggedIn) {
          console.log('Found existing session, navigating to Menu');
          setCurrentUser({
            userId: session.userId,
            username: session.username,
            firstName: session.firstName || session.username // Store as firstName instead of name
          });
          navigation.replace('Menu');
          return;
        }
        
      } catch (error) {
        console.error('Setup error:', error);
        Alert.alert('Setup Error', error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    setup();
  }, []);

  const handleLogin = async (values) => {
    try {
      console.log('Login attempt:', values.username);
      
      const result = await verifyCredentials(values.username, values.password);
      
      if (result.success) {
        navigation.replace('Menu');
      } else {
        Alert.alert('Login Failed', result.error || 'Invalid username or password');
      }
    } catch (error) {
      Alert.alert('Login Error', error.message);
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permission to upload profile pictures.');
        return;
      }
      
      // Launch the image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets[0].uri) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleRegister = async (values) => {
    try {
      // Check if profile image is provided - prevent registration without it
      if (!profileImage) {
        Alert.alert(
          'Profile Picture Required',
          'Please upload a profile picture to complete registration.',
          [{ text: 'OK' }]
        );
        return; // Stop the registration process
      }
      
      // Register the user with the profile image
      const userId = await registerUser(
        values.username,
        values.password,
        values.firstName,
        values.lastName,
        profileImage  // Pass the profileImage URI here
      );
      
      // After successful registration, update the session and navigate to Menu
      await saveUserSession(userId, values.username, values.firstName);
      
      // Show success message and automatically navigate
      Alert.alert(
        'Registration Successful',
        'Your account has been created!',
        [{ text: 'Continue', onPress: () => navigation.replace('Menu') }]
      );
    } catch (error) {
      Alert.alert('Registration Failed', error.message || 'Username may already exist');
    }
  };
  
  // Reset database function for debugging
  const resetDatabase = async () => {
    try {
      setIsLoading(true);
      await clearAllSessions();
      await initDatabase();
      const users = await listAllUsers();
      setDebug(`Database reset. Found ${users.length} users.`);
      Alert.alert('Database Reset', 'Test user has been recreated.');
    } catch (error) {
      Alert.alert('Reset Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4287f5" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/welcomeBackTitle.png')} // Path to your image
          style={styles.logoImage}
          resizeMode="contain" // Ensures the image scales proportionally
        />
        </View>

        {!isRegistering ? (
          <Formik
            initialValues={{ username: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={handleLogin}
          >
            {({ handleChange, handleSubmit, values, errors, touched }) => (
              <View style={styles.formContainer}>
                <Text style={styles.title}>Log In</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Username</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your username"
                    value={values.username}
                    onChangeText={handleChange('username')}
                    autoCapitalize="none"
                  />
                  {errors.username && touched.username && (
                    <Text style={styles.errorText}>{errors.username}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    value={values.password}
                    onChangeText={handleChange('password')}
                    secureTextEntry
                  />
                  {errors.password && touched.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleSubmit}
                >
                  <Text style={styles.buttonText}>LOGIN</Text>
                </TouchableOpacity>

                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>Don't have an account?</Text>
                  <TouchableOpacity onPress={() => setIsRegistering(true)}>
                    <Text style={styles.switchLink}>Register</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Formik>
        ) : (
          <Formik
            initialValues={{
              username: '',
              password: '',
              confirmPassword: '',
              firstName: '',
              lastName: ''
            }}
            validationSchema={RegisterSchema}
            onSubmit={handleRegister}
          >
            {({ handleChange, handleSubmit, values, errors, touched }) => (
              <View style={styles.formContainer}>
                <Text style={styles.title}>Register</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your first name"
                    value={values.firstName}
                    onChangeText={handleChange('firstName')}
                  />
                  {errors.firstName && touched.firstName && (
                    <Text style={styles.errorText}>{errors.firstName}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your last name"
                    value={values.lastName}
                    onChangeText={handleChange('lastName')}
                  />
                  {errors.lastName && touched.lastName && (
                    <Text style={styles.errorText}>{errors.lastName}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Username</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Choose a username"
                    value={values.username}
                    onChangeText={handleChange('username')}
                    autoCapitalize="none"
                  />
                  {errors.username && touched.username && (
                    <Text style={styles.errorText}>{errors.username}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Choose a password"
                    value={values.password}
                    onChangeText={handleChange('password')}
                    secureTextEntry
                  />
                  {errors.password && touched.password && (
                    <Text style={styles.errorText}>{errors.password}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    value={values.confirmPassword}
                    onChangeText={handleChange('confirmPassword')}
                    secureTextEntry
                  />
                  {errors.confirmPassword && touched.confirmPassword && (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  )}
                </View>

                <View style={styles.imagePickerContainer}>
                  <Text style={styles.label}>Profile Picture <Text style={styles.requiredLabel}>(Required)</Text></Text>
                  <TouchableOpacity onPress={pickImage} style={[
                    styles.imagePicker,
                    !profileImage && styles.imagePickerRequired // Add red border when no image is selected
                  ]}>
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.profilePreview} />
                    ) : (
                      <View style={styles.imagePickerPlaceholder}>
                        <Text style={styles.imagePickerText}>Tap to upload profile picture</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {!profileImage && (
                    <Text style={styles.errorText}>Profile picture is required</Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.button}
                  onPress={() => {
                    setFormSubmitted(true);
                    if (!profileImage) {
                      Alert.alert(
                        'Profile Picture Required',
                        'Please upload a profile picture to complete registration.'
                      );
                      return;
                    }
                    handleSubmit();
                  }}
                >
                  <Text style={styles.buttonText}>REGISTER</Text>
                </TouchableOpacity>

                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>Already have an account?</Text>
                  <TouchableOpacity onPress={() => setIsRegistering(false)}>
                    <Text style={styles.switchLink}>Login</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Formik>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#832161',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  logoContainer: {
    position: 'absolute', // Allows absolute positioning
    top: 40, // Distance from the top of the screen
    left: -20, // Distance from the left of the screen
    width: '120%', // Let the image size itself
    height: 'auto', // Let the image size itself
    alignItems: 'flex-start', // Aligns content to the start (left)
    justifyContent: 'flex-start', // Ensures the container spans the full width
  },
  logoImage: {
    width: '80%', // Adjust the width as needed
    height: undefined, // Let the height adjust automatically to maintain aspect ratio
    aspectRatio: 2, // Adjust this to match the aspect ratio of your image
    marginBottom: 30, // Add spacing below the image
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputGroup: {
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
  switchContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: '#4b5563',
    fontSize: 14,
  },
  switchLink: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#6366f1',
  },
  profilePreview: {
    width: '100%',
    height: '100%',
  },
  imagePickerText: {
    color: '#666',
    textAlign: 'center',
    padding: 10,
  },
  imagePickerRequired: {
    borderColor: '#ef4444', // Red border color
  },
  imagePickerPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
  },
  requiredLabel: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
});