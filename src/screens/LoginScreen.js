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
  SafeAreaView,
  Dimensions
} from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import * as ImagePicker from 'expo-image-picker';
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

const { width, height } = Dimensions.get('window');

const LoginSchema = Yup.object().shape({
  username: Yup.string().required('Username is required'),
  password: Yup.string().required('Password is required')
});

const RegisterSchema = Yup.object().shape({
  username: Yup.string().required('Username is required').min(3, 'Username must be at least 3 characters'),
  password: Yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
  confirmPassword: Yup.string().oneOf([Yup.ref('password'), null], 'Passwords must match').required('Confirm password is required'),
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
        await initDatabase();
        const session = await getUserSession();
        if (session.isLoggedIn) {
          navigation.replace('Menu');
          return;
        }
      } catch (error) {
        Alert.alert('Setup Error', error.message);
      } finally {
        setIsLoading(false);
      }
    };
    setup();
  }, []);

  const handleLogin = async (values) => {
    try {
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

  if (isLoading) {
    return (
      <View style={styles.container}><ActivityIndicator size="large" color="#4287f5" /></View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <Image source={require('../../assets/images/loginHearts.png')} style={styles.loginHearts} resizeMode="contain" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/images/welcomeBackTitle.png')} style={styles.logoImage} resizeMode="contain" />
        </View>

        {!isRegistering ? (
          <Formik initialValues={{ username: '', password: '' }} validationSchema={LoginSchema} onSubmit={handleLogin}>
            {({ handleChange, handleSubmit, values, errors, touched }) => (
              <View style={styles.loginContainer}>
                <View style={styles.loginInputGroup}>
                  <TextInput style={styles.input} placeholder="Enter your username" placeholderTextColor="#832161" value={values.username} onChangeText={handleChange('username')} autoCapitalize="none" />
                  {errors.username && touched.username && (<Text style={styles.errorText}>{errors.username}</Text>)}
                </View>

                <View style={styles.loginInputGroup}>
                  <TextInput style={styles.input} placeholder="Enter your password" placeholderTextColor="#832161" value={values.password} onChangeText={handleChange('password')} secureTextEntry />
                  {errors.password && touched.password && (<Text style={styles.errorText}>{errors.password}</Text>)}
                </View>

                <TouchableOpacity 
                  style={[
                    styles.button, 
                    { 
                      width: '120%', // Match the width of the registration prompt container
                      alignSelf: 'center' 
                    }
                  ]} 
                  onPress={handleSubmit}
                >
                  <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>

                <View style={styles.loginSwitchPromptContainer}>
                  <Text style={styles.loginSwitchText}>Don't have an account?</Text>
                  <TouchableOpacity onPress={() => setIsRegistering(true)}>
                    <Text style={styles.loginSwitchLink}>Register</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Formik>
        ) : (
          <Formik initialValues={{ username: '', password: '', confirmPassword: '', firstName: '', lastName: '' }} validationSchema={RegisterSchema} onSubmit={handleRegister}>
            {({ handleChange, handleSubmit, values, errors, touched }) => (
              <View style={styles.registerContainer}>
                <Image source={require('../../assets/images/registerTitle.png')} style={styles.registerTitleImage} resizeMode="contain" />

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your first name"
                    placeholderTextColor="#832161"
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
                    placeholderTextColor="#832161"
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
                    placeholderTextColor="#832161" // Match the color used in other fields
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
                    placeholderTextColor="#832161" // Match the color used in other fields
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
                    placeholderTextColor="#832161" // Match the color used in other fields
                    value={values.confirmPassword}
                    onChangeText={handleChange('confirmPassword')}
                    secureTextEntry
                  />
                  {errors.confirmPassword && touched.confirmPassword && (
                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Profile Picture</Text>
                  <TouchableOpacity 
                    onPress={pickImage} 
                    style={[styles.input, styles.imagePickerBox]}
                  >
                    {profileImage ? (
                      <Image source={{ uri: profileImage }} style={styles.profilePreview} />
                    ) : (
                      <View style={styles.imagePickerPlaceholder}>
                        <Text style={styles.imagePickerText}>Tap to upload profile picture</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.button, 
                    { 
                      width: width * 0.5,
                      borderWidth: 3, // Increase to match the updated button style
                      borderColor: '#832161',
                    }
                  ]}
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
                    <Text style={styles.registrationSwitchLink}>Login</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Formik>
        )}
      </ScrollView>
      <Image source={require('../../assets/images/logoBlue.png')} style={styles.logoBlue} resizeMode="contain" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#832161'
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 0
  },
  logoContainer: {
    position: 'absolute',
    top: 40,
    left: -20,
    width: '120%',
    height: 'auto',
    alignItems: 'flex-start',
    justifyContent: 'flex-start'
  },
  logoImage: {
    width: '80%',
    height: undefined,
    aspectRatio: 2,
    marginBottom: 30
  },
  loginContainer: {
    width: '40%',
    alignSelf: 'center',
    position: 'absolute',
    top: '50%', // Change from 40% to 50% to move everything down
    transform: [{ translateY: -100 }],
  },
  loginInputGroup: {
    marginBottom: 16,
    marginTop: 10, // Add some top margin to the first input group
    width: '200%', // Increase from 120% to 140% for even longer textboxes
    alignSelf: 'center',
  },
  registerContainer: {
    alignItems: 'center',
    paddingTop: 30, // Reduced from 60 to move the form up
    paddingBottom: 60, // Keep the same bottom padding
    backgroundColor: 'white',
    height: height,
  },
  registerTitleImage: {
    width: '80%',
    height: undefined,
    aspectRatio: 3,
    marginBottom: 20
  },
  inputGroup: {
    marginBottom: 16,
    width: width * 0.7, // Reduce from 0.8 to 0.7 (or your preferred width)
    alignSelf: 'center', // This centers the input group if needed
  },
  registerInputGroup: {
    marginBottom: 16,
    width: width * 0.8, // Adjust if needed
  },
  registerInput: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingVertical: 12
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#bcd2ed',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    height: 48,
    borderWidth: 2, // Increase from 1 to 2 for thicker border
    borderColor: '#832161',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 5
  },
  button: {
    backgroundColor: '#bcd2ee',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#832161',
    width: '110%', // Match width of textboxes
    alignSelf: 'center',
    height: 48,
  },
  registerButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    width: width * 0.8,
  },
  buttonText: {
    color: '#832161',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButtonText: {
    color: '#832161',
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    alignItems: 'center',
    marginTop: 30, // Increase from 20 to 30 for more space
    zIndex: 2,
  },
  loginSwitchPromptContainer: {
    flexDirection: 'column', // Change from 'row' to 'column'
    backgroundColor: '#BCD2EE',
    borderWidth: 2,
    borderColor: '#832161',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10, // Slightly increase vertical padding
    alignItems: 'center', // Center items horizontally
    justifyContent: 'center',
    marginTop: 20,
    width: '120%', // Increase from 100% to 120% to make it wider
    alignSelf: 'center', // Ensure it's centered
  },
  loginSwitchText: {
    color: '#832161',
    backgroundColor: 'transparent',
    fontSize: 14,
    marginBottom: 6, // Add margin at the bottom instead of right
  },
  switchText: {
    color: '#52050A',
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Add slight opacity to make text stand out
    fontSize: 14,
    paddingHorizontal: 5, // Add some padding for better visibility
    paddingVertical: 2,
  },
  switchLink: {
    color: '#832161',
    backgroundColor: '#BCD2ee',
    fontSize: 20,
    fontWeight: '500',
  },
  loginSwitchLink: {
    color: '#832161',
    backgroundColor: 'transparent', // Change from '#BCD2ee' to 'transparent'
    fontSize: 20,
    fontWeight: '500',
  },
  registrationSwitchText: {
    color: '#52050A',
    backgroundColor: 'white',
    fontSize: 14
  },
  registrationSwitchLink: {
    color: '#832161',
    backgroundColor: 'transparent', // Change from blue to transparent
    fontSize: 20,
    fontWeight: '500',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  loginHearts: {
    position: 'absolute',
    top: '26%',
    left: '-30%',
    width: width * 2,
    height: height * 0.6,
    aspectRatio: 1.5
  },
  logoBlue: {
    position: 'absolute',
    bottom: width * 0.01,
    right: width * 0.05,
    width: width * 0.33,
    height: undefined,
    aspectRatio: 1,
    zIndex: 1, // Lower zIndex means it will be behind elements with higher zIndex
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#bcd2ed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#bcd2ed',
  },
  profilePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePickerText: {
    color: '#832161',
    textAlign: 'left',
    fontSize: 14,
    paddingHorizontal: 0,
    width: '100%',
  },
  imagePickerRequired: {
    borderColor: '#ef4444',
  },
  imagePickerPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    width: '100%',
    padding: 0,
  },
  requiredLabel: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  imagePickerBox: {
    height: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});