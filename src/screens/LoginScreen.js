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
                <View style={styles.inputGroup}>
                  <TextInput style={styles.input} placeholder="Enter your username" placeholderTextColor="#832161" value={values.username} onChangeText={handleChange('username')} autoCapitalize="none" />
                  {errors.username && touched.username && (<Text style={styles.errorText}>{errors.username}</Text>)}
                </View>

                <View style={styles.inputGroup}>
                  <TextInput style={styles.input} placeholder="Enter your password" placeholderTextColor="#832161" value={values.password} onChangeText={handleChange('password')} secureTextEntry />
                  {errors.password && touched.password && (<Text style={styles.errorText}>{errors.password}</Text>)}
                </View>

                <TouchableOpacity style={styles.button} onPress={handleSubmit}><Text style={styles.buttonText}>Login</Text></TouchableOpacity>

                <View style={styles.switchContainer}>
                  <Text style={styles.loginSwitchText}>Don't have an account?</Text>
                  <TouchableOpacity onPress={() => setIsRegistering(true)}><Text style={styles.loginSwitchLink}>Register</Text></TouchableOpacity>
                </View>
              </View>
            )}
          </Formik>
        ) : (
          <Formik initialValues={{ username: '', password: '', confirmPassword: '', firstName: '', lastName: '' }} validationSchema={RegisterSchema} onSubmit={handleRegister}>
            {({ handleChange, handleSubmit, values, errors, touched }) => (
              <View style={styles.registerContainer}>
                <Image source={require('../../assets/images/registerTitle.png')} style={styles.registerTitleImage} resizeMode="contain" />

                {[{ label: 'First Name', field: 'firstName' }, { label: 'Last Name', field: 'lastName' }, { label: 'Username', field: 'username' }, { label: 'Password', field: 'password', secure: true }, { label: 'Confirm Password', field: 'confirmPassword', secure: true }].map(({ label, field, secure }) => (
                  <View key={field} style={styles.registerInputGroup}>
                    <Text style={styles.label}>{label}</Text>
                    <TextInput
                      style={styles.registerInput}
                      placeholder={`Enter your ${label.toLowerCase()}`}
                      placeholderTextColor="#832161"
                      value={values[field]}
                      onChangeText={handleChange(field)}
                      secureTextEntry={secure}
                    />
                    {errors[field] && touched[field] && (<Text style={styles.errorText}>{errors[field]}</Text>)}
                  </View>
                ))}

                <TouchableOpacity style={styles.registerButton} onPress={handleSubmit}><Text style={styles.buttonText}>Register</Text></TouchableOpacity>
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
                  <TouchableOpacity onPress={() => setIsRegistering(false)}><Text style={styles.registrationSwitchLink}>Login</Text></TouchableOpacity>
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
    position: 'absolute',
    right: 20,
    top: '30%',
    width: '50%',
    alignSelf: 'flex-end',
    paddingTop: 80
  },
  registerContainer: {
    alignItems: 'center',
    paddingVertical: 60,
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
    marginBottom: 16
  },
  registerInputGroup: {
    marginBottom: 16,
    width: width * 0.9
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
    borderBottomWidth: 2, // Add a bottom border
    borderBottomColor: '#832161', // Set the color of the bottom border
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 5
  },
  button: {
    backgroundColor: '#bcd2ee',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    borderBottomWidth: 2, // Add a bottom border
    borderBottomColor: '#832161',
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
    borderBottomWidth: 2, // Add a bottom border
    borderBottomColor: '#832161',
  },
  switchContainer: {
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 2, // Add a bottom border
    borderColor: '#832161',
    borderRadius: 70,
  },
  loginSwitchText: {
    color: '#52050A',
    backgroundColor: '#bcd2ee',
    fontSize: 14
  },
  switchLink: {
    color: '#832161',
    backgroundColor: '#BCD2ee',
    fontSize: 20,
    fontWeight: '500',
  },
  loginSwitchLink: {
    color: '#832161',
    backgroundColor: '#BCD2ee',
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
    backgroundColor: 'white',
    fontSize: 20,
    fontWeight: '500',
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
    aspectRatio: 1
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
