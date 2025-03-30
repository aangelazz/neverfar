import React, { useState, useEffect, useLayoutEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Image, 
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Modal
} from 'react-native';
import { getUserSession, getUserPhotos, deleteUserPhoto } from '../services/DatabaseService';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

const photoSize = width / 2 - 15; // 2 columns with some margin

export default function PhotoGalleryScreen({ navigation, route }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Move the useLayoutEffect inside the component
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.navigate('Nav')} // Navigate to Nav instead of Camera
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);
  
  // Load user session and photos
  useEffect(() => {
    loadUserData();
    
    // Refresh photos when returning to this screen
    const unsubscribe = navigation.addListener('focus', () => {
      console.log("PhotoGallery: Screen focused, reloading data");
      loadUserData();
    });
    
    return unsubscribe;
  }, [navigation]);

  // Load user session and photos
  const loadUserData = async () => {
    try {
      console.log("PhotoGallery: Loading user data...");
      const session = await getUserSession();
      console.log("PhotoGallery: Session loaded:", session);
      
      if (session && session.isLoggedIn) {
        const user = {
          userId: session.userId,
          username: session.username,
          firstName: session.firstName
        };
        console.log("PhotoGallery: User set:", user);
        setCurrentUser(user);
        
        // Load user photos with debugging
        console.log(`PhotoGallery: Loading photos for user ${user.userId}`);
        const userPhotos = await getUserPhotos(user.userId);
        console.log(`PhotoGallery: Loaded ${userPhotos.length} photos:`, userPhotos);
        setPhotos(userPhotos);
      } else {
        console.log("PhotoGallery: No active user session");
        Alert.alert('Authentication Required', 'Please log in to view your photos');
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      setError('Failed to load your photos. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Separate function to load photos (for refreshing)
  const loadUserPhotos = async (userId) => {
    setLoading(true);
    try {
      const userPhotos = await getUserPhotos(userId);
      setPhotos(userPhotos);
    } catch (error) {
      console.error('Failed to load user photos:', error);
      setError('Failed to load your photos');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle photo deletion
  const handleDeletePhoto = (photo) => {
    Alert.alert(
      'Delete Photo',
      'Are you sure you want to delete this photo? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteUserPhoto(photo.id);
              
              // Close modal if the deleted photo is currently selected
              if (selectedPhoto && selectedPhoto.id === photo.id) {
                setModalVisible(false);
                setSelectedPhoto(null);
              }
              
              // Reload photos after deletion
              if (currentUser) {
                await loadUserPhotos(currentUser.userId);
              }
            } catch (error) {
              console.error('Failed to delete photo:', error);
              Alert.alert('Error', 'Failed to delete photo');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  // Show photo in modal
  const viewPhoto = (photo) => {
    setSelectedPhoto(photo);
    setModalVisible(true);
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.message}>Loading your photos...</Text>
      </SafeAreaView>
    );
  }
  
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => currentUser && loadUserPhotos(currentUser.userId)}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {currentUser?.firstName ? `${currentUser.firstName}'s Photos` : 'My Photos'}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Nav')} // Navigate to Nav instead of Camera
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
      
      {photos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You haven't taken any photos yet</Text>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('Camera')}
          >
            <Text style={styles.buttonText}>Take a Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.photoContainer}
              onPress={() => viewPhoto(item)}
              onLongPress={() => handleDeletePhoto(item)}
            >
              <Image source={{ uri: item.photoUri }} style={styles.thumbnail} />
              {item.caption ? (
                <Text style={styles.caption} numberOfLines={1}>
                  {item.caption}
                </Text>
              ) : null}
              <Text style={styles.timestamp}>
                {new Date(item.timestamp).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.photoList}
        />
      )}
      
      {/* Photo Modal */}
      <Modal
        animationType="fade"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {selectedPhoto && (
            <>
              <Image 
                source={{ uri: selectedPhoto.photoUri }} 
                style={styles.fullImage} 
              />
              
              <View style={styles.modalInfo}>
                {selectedPhoto.caption ? (
                  <Text style={styles.modalCaption}>{selectedPhoto.caption}</Text>
                ) : null}
                <Text style={styles.modalTimestamp}>
                  {new Date(selectedPhoto.timestamp).toLocaleString()}
                </Text>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.modalButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.dangerButton, styles.modalButton]}
                  onPress={() => handleDeletePhoto(selectedPhoto)}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </SafeAreaView>
      </Modal>
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Camera')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 5,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  photoList: {
    padding: 5,
  },
  photoContainer: {
    margin: 5,
    width: photoSize,
    backgroundColor: '#222',
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: photoSize,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  caption: {
    padding: 8,
    color: '#fff',
    fontSize: 14,
  },
  timestamp: {
    padding: 8,
    color: '#999',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
  errorMessage: {
    color: '#ff6b6b',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    width: '45%',
  },
  primaryButton: {
    backgroundColor: '#6366f1',
  },
  dangerButton: {
    backgroundColor: '#e53935',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    width: 60,
    height: 60,
    backgroundColor: '#6366f1',
    borderRadius: 30,
    bottom: 20,
    right: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 30,
    color: 'white',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'space-between',
  },
  fullImage: {
    flex: 1,
    width: '100%',
    resizeMode: 'contain',
  },
  modalInfo: {
    padding: 15,
  },
  modalCaption: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 5,
  },
  modalTimestamp: {
    color: '#999',
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 20,
  },
  modalButton: {
    marginTop: 0,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 5,
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 5,
  }
});
