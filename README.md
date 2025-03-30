# Welcome to your Expo app: NeverFar - Stay Connected with Friends

NeverFar is a React Native mobile application built with Expo that helps you stay connected with friends through photo sharing and interactive features. The app provides a simple and intuitive interface for maintaining friendships, no matter the distance.

## Features 
- User Authentication: Create an account or use the test account to explore the app
- Friend Management: Add up to 6 friends and view their profiles
- Photo Sharing: Upload and share photos with your friends
- Interactive Home Screen: Navigate through a visually appealing heart-centered interface
- Profile Images: Set your profile image during account creation

## Get started

Prerequisites
- Node.js (v14 or newer)
- npm or yarn
- iOS Simulator, Android Emulator, or physical device with Expo Go

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/neverfar.git
   cd neverfar
   ```

2. Install dependencies


   ```bash
    npm install
   ```
3. Start the development server
   ```bash
   npx expo start
   ```
4. Launch the app in your preferred environment:
- Press i for iOS simulator
- Press a for Android emulator
- Scan the QR code with Expo Go on your physical device
- In the output, you'll find options to open the app in a

## Testing
You can use the test account to explore the app:

- Username: test
- Password: password123

## Technical Notes

- Local Database: The app uses a local database (AsyncStorage), meaning that user accounts and data are stored on the device.
- Test User: A default test user is automatically created with a predefined profile image.
- Image Storage: Profile images and shared photos are stored locally on the device.
- Cross-Platform: Works on both iOS and Android devices through React Native.


## App Configuration
This app is built with Expo SDK 52.0.0 and includes the following configuration:
- App Name: NeverFar
- Version: 1.0.0
- Orientation: Portrait mode only
- Bundle Identifiers: iOS: com.a6zhuang.neverfar, Android: com.a6zhuang.neverfar
- Plugins: expo-camera (with custom permission messages), expo-image-picker, expo-sqlite, expo-secure-store, expo-font
- Custom Fonts: CrimsonPro font family

## Some Limitations
- The database is not remote or cloud-based, meaning that accounts and data are device-specific
- Testing should be performed on a single device (physical device or simulator)

## Future Enhancements
- Remote database integration for cross-device functionality
- Enhanced profile customization options
- Real-time chat features
- Location sharing between friends
- Notification system for friend requests and photo uploads

## Development
This project is built with:

- React Native (with Expo)
- AsyncStorage for data persistence
- Custom memory database implementation
- File system integration for image storage

## License and Credits
See LICENSE file for details. This project was created by Emma Hong, Angeline Yan, Angela Zhuang.