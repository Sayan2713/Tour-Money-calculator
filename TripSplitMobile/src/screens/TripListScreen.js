import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config';

export default function TripListScreen({ token, onSelectTrip }) {
    const [trips, setTrips] = useState([]);
    const [newTripName, setNewTripName] = useState('');
    const [isAddingTrip, setIsAddingTrip] = useState(false);

    useEffect(() => { fetchTrips(); }, []);

    const fetchTrips = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/trips`, { headers: { 'x-auth-token': token } });
            setTrips(res.data);
        } catch (err) { console.log(err); }
    };

    const handleAddTrip = async () => {
        if(!newTripName) return;
        setIsAddingTrip(true);
        try {
            await axios.post(`${API_BASE_URL}/trips/add`, { name: newTripName }, { headers: { 'x-auth-token': token } });
            setNewTripName('');
            fetchTrips();
        } catch (err) { Alert.alert("Error", "Failed to add trip"); }
        setIsAddingTrip(false);
    };

    const handleDeleteTrip = async (id) => {
        Alert.alert("Delete Trip", "Are you sure?", [
            { text: "Cancel" },
            { text: "Delete", style: 'destructive', onPress: async () => {
                try {
                    await axios.delete(`${API_BASE_URL}/trips/delete/${id}`, { headers: { 'x-auth-token': token } });
                    fetchTrips();
                } catch (err) { Alert.alert("Error", "Failed to delete"); }
            }}
        ]);
    };

    return (
        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.row}>
                <Text style={[styles.label, {flex: 1, marginBottom: 0, marginRight: 10}]}>Create Trip</Text>
            </View>
            <View style={styles.row}>
                <TextInput style={[styles.input, {flex:1, marginBottom:0}]} placeholder="New Trip Name" value={newTripName} onChangeText={setNewTripName} placeholderTextColor="#888" />
                <TouchableOpacity style={[styles.smallBtn, isAddingTrip && {opacity:0.6}]} onPress={handleAddTrip} disabled={isAddingTrip}>
                    {isAddingTrip ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.smallBtnText}>Create</Text>}
                </TouchableOpacity>
            </View>
            <View style={{marginTop:20}}>
                {trips.map(trip => (
                    <TouchableOpacity key={trip._id} style={styles.tripCard} onPress={() => onSelectTrip(trip)}>
                        <View style={{flexDirection:'row', alignItems:'center'}}>
                            <Text style={styles.tripText}>{trip.name}</Text>
                            <Text style={{marginLeft:10, fontSize:18, color:'#006b74'}}>›</Text>
                        </View>
                        <View style={{flexDirection:'row', gap:10}}>
                            <TouchableOpacity onPress={() => { Alert.alert("Use Trip Details", "Please open the trip to invite friends.") }}>
                                <Text style={{color:'#673ab7', fontWeight:'bold'}}>Invite</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteTrip(trip._id)}>
                                <Text style={{color:'#d32f2f', fontWeight:'bold'}}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: { padding: 15, marginBottom: 20 },
    label: { marginBottom: 5, fontWeight: 'bold', color: '#555' },
    input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#b3e5fc', marginBottom: 15, color: '#000' },
    row: { flexDirection: 'row', gap: 10 },
    smallBtn: { backgroundColor: '#0288d1', padding: 12, borderRadius: 8, justifyContent: 'center' },
    smallBtnText: { color: '#fff', fontWeight: 'bold' },
    tripCard: { backgroundColor: '#fff', padding: 20, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2, borderLeftWidth: 5, borderLeftColor: '#0288d1' },
    tripText: { fontSize: 18, fontWeight: '600', color:'#333' },
});