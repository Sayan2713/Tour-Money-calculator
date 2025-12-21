import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import api from '../../services/api';
import TripDetailsScreen from './TripDetailsScreen';

export default function TripListScreen() {
  const [trips, setTrips] = useState([]);
  const [newTrip, setNewTrip] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);

  // ---------------- LOAD TRIPS ----------------
  const loadTrips = async () => {
    try {
      const res = await api.get('/trips');
      setTrips(res.data || []);
    } catch {
      Alert.alert('Error', 'Failed to load trips');
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  // ---------------- ADD TRIP ----------------
  const addTrip = async () => {
    if (!newTrip.trim()) return;
    try {
      await api.post('/trips/add', { name: newTrip });
      setNewTrip('');
      loadTrips();
    } catch {
      Alert.alert('Error', 'Failed to create trip');
    }
  };

  // ---------------- DELETE TRIP ----------------
  const deleteTrip = async (id) => {
    Alert.alert('Delete Trip', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await api.delete(`/trips/delete/${id}`);
          loadTrips();
        }
      }
    ]);
  };

  // ---------------- SHOW DETAILS ----------------
  if (selectedTrip) {
    return (
      <TripDetailsScreen
        trip={selectedTrip}
        onBack={() => setSelectedTrip(null)}
      />
    );
  }

  // ---------------- TRIP LIST UI ----------------
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 22, marginBottom: 10 }}>Your Trips</Text>

      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        <TextInput
          placeholder="New Trip Name"
          value={newTrip}
          onChangeText={setNewTrip}
          style={{
            borderWidth: 1,
            flex: 1,
            marginRight: 8,
            padding: 8
          }}
        />
        <TouchableOpacity onPress={addTrip}>
          <Text>Create</Text>
        </TouchableOpacity>
      </View>

      {trips.map(trip => (
        <View
          key={trip._id}
          style={{
            padding: 12,
            borderWidth: 1,
            marginBottom: 8,
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}
        >
          <TouchableOpacity onPress={() => setSelectedTrip(trip)}>
            <Text style={{ fontSize: 16 }}>{trip.name}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => deleteTrip(trip._id)}>
            <Text style={{ color: 'red' }}>Delete</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
