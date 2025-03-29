import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList } from 'react-native';

const FRIENDS = [
  {
    id: '1',
    name: 'Sarah Johnson',
    school: 'Stanford University',
    distance: '124 miles',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    nextBreak: 'Spring Break: Mar 20-27'
  },
  {
    id: '2',
    name: 'Michael Chen',
    school: 'UC Berkeley',
    distance: '83 miles',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    nextBreak: 'Spring Break: Mar 15-22'
  },
  {
    id: '3',
    name: 'Emma Wilson',
    school: 'UCLA',
    distance: '380 miles',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    nextBreak: 'Spring Break: Mar 22-29'
  },
  {
    id: '4',
    name: 'James Taylor',
    school: 'NYU',
    distance: '2,934 miles',
    avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
    nextBreak: 'Spring Break: Mar 13-20'
  }
];

export default function FriendsScreen() {
  const renderFriendItem = ({ item }) => (
    <View style={styles.friendItem}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        <Text style={styles.schoolText}>{item.school}</Text>
        <Text style={styles.breakText}>{item.nextBreak}</Text>
      </View>
      <View style={styles.distanceContainer}>
        <Text style={styles.distanceText}>{item.distance}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Friends ({FRIENDS.length})</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={FRIENDS}
        renderItem={renderFriendItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
      />
      
      <View style={styles.upcomingContainer}>
        <Text style={styles.upcomingTitle}>Upcoming Meetups</Text>
        <View style={styles.meetupCard}>
          <View style={styles.meetupHeader}>
            <Text style={styles.meetupName}>Coffee with Emma</Text>
            <Text style={styles.meetupDate}>Mar 25</Text>
          </View>
          <Text style={styles.meetupLocation}>Blue Bottle Coffee, 3pm</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  list: {
    padding: 15,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  friendInfo: {
    flex: 1,
    marginLeft: 15,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  schoolText: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 2,
  },
  breakText: {
    fontSize: 13,
    color: '#6c757d',
  },
  distanceContainer: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
  },
  upcomingContainer: {
    padding: 20,
  },
  upcomingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  meetupCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  meetupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  meetupName: {
    fontSize: 16,
    fontWeight: '500',
  },
  meetupDate: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  meetupLocation: {
    fontSize: 14,
    color: '#6c757d',
  },
});