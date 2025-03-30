import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getUserSession,
  getUserFriends,
  addFriend,
  removeFriend,
  getUserProfileImage,
  getConsistentProfileImage,
  listAllUsers
} from '../services/DatabaseService';
import ProfileImage from '../components/ProfileImage';

export default function FriendsScreen({ navigation }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load user data when screen mounts
  useEffect(() => {
    loadUserData();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
      return () => {
        // Optional cleanup if needed
      };
    }, [])
  );

  // Refresh handler - used for pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  // Load user data and friends
  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Get current user session
      const session = await getUserSession();
      
      if (session && session.isLoggedIn) {
        const user = {
          userId: session.userId,
          username: session.username,
          firstName: session.firstName
        };
        
        setCurrentUser(user);
        
        // Load user's friends with profile images
        const userFriends = await getUserFriends(user.userId);
        const friendsWithImages = await Promise.all(
          userFriends.map(async (friend) => {
            // Use the consistent profile image function
            const profileImage = await getConsistentProfileImage(friend.id);
            return {
              ...friend,
              image: profileImage
            };
          })
        );
        
        setFriends(friendsWithImages);
        
        // Only load other users if we haven't reached the max friends limit
        if (friendsWithImages.length < 6) {
          // Get all users except current user for friend suggestions
          const allUsers = await listAllUsers();
          
          // Filter out:
          // 1. Current user (self)
          // 2. Users who are already friends
          const filteredUsers = allUsers.filter(u => {
            // Remove self from results
            if (u.id === user.userId) {
              return false;
            }
            
            // Check if this user is already a friend
            const isAlreadyFriend = friendsWithImages.some(friend => 
              friend.id === u.id || 
              friend.id.toString() === u.id.toString()
            );
            
            // Only include users who are not already friends
            return !isAlreadyFriend;
          });
          
          setAllUsers(filteredUsers);
          console.log(`Filtered to ${filteredUsers.length} potential friends`);
        } else {
          // Clear the users list if we already have 6 friends
          setAllUsers([]);
        }
      } else {
        Alert.alert('Authentication Required', 'Please log in to view friends');
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      Alert.alert('Error', 'Failed to load friends. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Add friend function
  const handleAddFriend = async (friendId, friendUsername) => {
    if (!currentUser) return;
    
    // Safety check to prevent adding yourself
    if (friendId === currentUser.userId) {
      Alert.alert('Error', 'You cannot add yourself as a friend');
      return;
    }
    
    try {
      const result = await addFriend(currentUser.userId, friendId);
      
      if (result.success) {
        Alert.alert('Success', `${friendUsername} added to your friends!`);
        
        // Immediately update the UI by adding the new friend to the list
        // Get the friend details
        const friendUser = allUsers.find(user => user.id === friendId);
        if (friendUser) {
          // Get profile image for the new friend
          const profileImage = await getConsistentProfileImage(friendId);
          
          // Add friend to the list with image
          const newFriend = {
            ...friendUser,
            image: profileImage
          };
          
          // Update friends list immediately
          const updatedFriends = [...friends, newFriend];
          setFriends(updatedFriends);
          
          // If we now have 6 friends, clear the allUsers list to hide search
          if (updatedFriends.length >= 6) {
            setAllUsers([]);
          } else {
            // Remove the new friend from the allUsers list
            setAllUsers(allUsers.filter(user => user.id !== friendId));
          }
        } else {
          // If we couldn't find the user in allUsers, refresh the whole list
          await loadUserData();
        }
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', 'Failed to add friend. Please try again.');
    }
  };
  
  // Remove friend function
  const handleRemoveFriend = async (friendId, friendName) => {
    if (!currentUser) return;
    
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await removeFriend(currentUser.userId, friendId);
              
              if (result.success) {
                // Update the friends list immediately
                const updatedFriends = friends.filter(friend => friend.id !== friendId);
                setFriends(updatedFriends);
                
                // If we now have less than 6 friends, reload the user list
                if (updatedFriends.length < 6) {
                  // Get all users except current user for friend suggestions
                  const allUsers = await listAllUsers();
                  const filteredUsers = allUsers.filter(
                    u => u.id !== currentUser.userId && 
                    !updatedFriends.some(friend => friend.id === u.id)
                  );
                  setAllUsers(filteredUsers);
                }
              } else {
                Alert.alert('Error', result.message);
              }
            } catch (error) {
              console.error('Error removing friend:', error);
              Alert.alert('Error', 'Failed to remove friend. Please try again.');
            }
          }
        }
      ]
    );
  };
  
  // Get filtered users for search
  const filteredUsers = allUsers.filter(user => {
    // First check if the user has a valid ID
    if (!user.id) {
      return false;
    }
    
    // Never show current user in search
    if (user.id === currentUser?.userId || 
        user.id.toString() === currentUser?.userId?.toString()) {
      return false;
    }
    
    // Check if already a friend
    const isFriend = friends.some(friend => 
      friend.id === user.id || 
      friend.id.toString() === user.id.toString()
    );
    
    // Check if matches search text
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchText.toLowerCase()) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchText.toLowerCase()));
    
    // Only show users who are not friends and match the search
    return !isFriend && matchesSearch;
  });

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading friends...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {currentUser?.firstName || currentUser?.username}'s Friends
        </Text>
        {friends.length < 6 ? (
          <Text style={styles.subTitle}>
            {`${friends.length}/6 friends added`}
          </Text>
        ) : (
          <Text style={styles.maxFriends}>
            Maximum friends reached (6)
          </Text>
        )}
      </View>
      
      {/* Current friends list */}
      <View style={styles.friendsContainer}>
        <Text style={styles.sectionTitle}>Your Friends</Text>
        {friends.length === 0 ? (
          <Text style={styles.emptyText}>
            You haven't added any friends yet. Search for users below!
          </Text>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.friendItem}>
                <ProfileImage 
                  userId={item.id} 
                  user={item} 
                  style={styles.friendImage} 
                />
                <View style={styles.friendInfo}>
                  <Text style={styles.friendName}>
                    {item.firstName || item.username}
                  </Text>
                  <Text style={styles.friendUsername}>@{item.username}</Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => navigation.navigate('PhotoGallery', {
                      userId: item.id, 
                      username: item.firstName || item.username
                    })}
                  >
                    <Text style={styles.buttonText}>Photos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveFriend(item.id, item.firstName || item.username)}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}
      </View>
      
      {/* Only show Find Friends section if we have less than 6 friends */}
      {friends.length < 6 && (
        <View style={styles.searchContainer}>
          <Text style={styles.sectionTitle}>Find Friends</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
          <FlatList
            data={filteredUsers}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.userItem}>
                <ProfileImage user={item} />
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {item.firstName || item.username}
                  </Text>
                  <Text style={styles.userUsername}>@{item.username}</Text>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAddFriend(item.id, item.firstName || item.username)}
                >
                  <Text style={styles.buttonText}>Add Friend</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={() => (
              <Text style={styles.emptyText}>
                {searchText ? 
                  "No users found matching your search" : 
                  "Type a username to search for friends"}
              </Text>
            )}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  header: {
    padding: 15,
    backgroundColor: '#6366f1',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subTitle: {
    fontSize: 14,
    color: '#e0e0ff',
    marginTop: 5,
  },
  maxFriends: {
    fontSize: 14,
    color: '#ffcc00',
    marginTop: 5,
    fontWeight: 'bold',
  },
  friendsContainer: {
    flex: 1,
    padding: 15,
  },
  searchContainer: {
    flex: 1,
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  friendItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  friendImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  friendInfo: {
    flex: 1,
    marginLeft: 15,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  friendUsername: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  viewButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    marginRight: 5,
  },
  removeButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
  removeButtonText: {
    color: '#ff3b30',
    fontSize: 14,
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  userItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userUsername: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  addButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
  },
  defaultAvatarContainer: {
    backgroundColor: '#BCD2EE', // Light blue background
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#832161', // Dark pink text
  }
});