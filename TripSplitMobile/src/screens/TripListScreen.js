import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet, Modal } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { Ionicons } from '@expo/vector-icons'; // ✅ Added for empty state icon

export default function TripListScreen({ token, onSelectTrip }) {
    const [trips, setTrips] = useState([]);
    const [newTripName, setNewTripName] = useState('');
    const [isAddingTrip, setIsAddingTrip] = useState(false);
    
    // Loading States
    const [isLoading, setIsLoading] = useState(false);
    const [isServerSlow, setIsServerSlow] = useState(false); // ✅ New state for "Cold Start" message

    // Invite States
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteTrip, setInviteTrip] = useState(null);
    const [isInviting, setIsInviting] = useState(false);

    useEffect(() => {
        if (token) fetchTrips();
    }, [token]);

    const fetchTrips = async () => {
        setIsLoading(true);
        setIsServerSlow(false);

        // ✅ 1. Start a timer: If data takes > 5 seconds, show "Waking up server" message
        const slowServerTimer = setTimeout(() => {
            setIsServerSlow(true);
        }, 5000);

        try {
            const res = await axios.get(`${API_BASE_URL}/trips`, { headers: { 'x-auth-token': token } });
            setTrips(res.data);
        } catch (err) { 
            console.log("Fetch trips error:", err); 
        } finally {
            // ✅ 2. Clear timer & stop loading regardless of success/fail
            clearTimeout(slowServerTimer);
            setIsLoading(false);
            setIsServerSlow(false);
        }
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

    const handleSendInvite = async () => {
        if(!inviteEmail) return;
        setIsInviting(true);
        try {
            await axios.post(`${API_BASE_URL}/invitations/send`, { email: inviteEmail, tripId: inviteTrip._id }, { headers: { 'x-auth-token': token } });
            Alert.alert("Success", "Invitation sent!");
            setShowInviteModal(false);
            setInviteEmail('');
        } catch (err) { Alert.alert("Error", err.response?.data?.msg || "Failed to send invite"); }
        setIsInviting(false);
    }

    return (
        <ScrollView contentContainerStyle={styles.content}>
            {/* CREATE TRIP SECTION */}
            <View style={styles.row}>
                <Text style={[styles.label, {flex: 1, marginBottom: 0, marginRight: 10}]}>Create Trip</Text>
            </View>
            <View style={styles.row}>
                <TextInput 
                    style={[styles.input, {flex:1, marginBottom:0}]} 
                    placeholder="New Trip Name" 
                    value={newTripName} 
                    onChangeText={setNewTripName} 
                    placeholderTextColor="#888" 
                />
                <TouchableOpacity 
                    style={[styles.smallBtn, isAddingTrip && {opacity:0.6}]} 
                    onPress={handleAddTrip} 
                    disabled={isAddingTrip}
                >
                    {isAddingTrip ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.smallBtnText}>Create</Text>}
                </TouchableOpacity>
            </View>

            {/* --- LOADING & SERVER STATUS --- */}
            {isLoading && (
                <View style={{marginTop: 30, alignItems: 'center'}}>
                    <ActivityIndicator size="large" color="#0288d1" />
                    {isServerSlow && (
                        <View style={{marginTop: 15, padding: 10, backgroundColor: '#fff3e0', borderRadius: 8}}>
                            <Text style={{color: '#e65100', textAlign: 'center', fontWeight: 'bold'}}>
                                ⏳ Waking up server...
                            </Text>
                            <Text style={{color: '#e65100', textAlign: 'center', fontSize: 12}}>
                                This can take up to 60 seconds. Please wait.
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* --- TRIP LIST --- */}
            {!isLoading && (
                <View style={{marginTop:20}}>
                    {/* ✅ Empty State Logic */}
                    {trips.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="airplane-outline" size={50} color="#ccc" />
                            <Text style={{color: '#888', marginTop: 10}}>No trips found.</Text>
                            <Text style={{color: '#aaa', fontSize: 12}}>Create one above to get started!</Text>
                        </View>
                    ) : (
                        trips.map(trip => (
                            <TouchableOpacity key={trip._id} style={styles.tripCard} onPress={() => onSelectTrip(trip)}>
                                <View style={{flexDirection:'row', alignItems:'center'}}>
                                    <Text style={styles.tripText}>{trip.name}</Text>
                                    <Text style={{marginLeft:10, fontSize:18, color:'#006b74'}}>›</Text>
                                </View>
                                <View style={{flexDirection:'row', gap:10}}>
                                    <TouchableOpacity onPress={() => { setInviteTrip(trip); setShowInviteModal(true); }}>
                                        <Text style={{color:'#673ab7', fontWeight:'bold'}}>Invite</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDeleteTrip(trip._id)}>
                                        <Text style={{color:'#d32f2f', fontWeight:'bold'}}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            )}

            {/* INVITE MODAL */}
            <Modal visible={showInviteModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Invite Friend</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Friend's Email" 
                            value={inviteEmail} 
                            onChangeText={setInviteEmail} 
                            autoCapitalize="none" 
                            placeholderTextColor="#888" 
                        />
                        <TouchableOpacity 
                            style={[styles.button, {backgroundColor: isInviting ? '#9575cd' : '#673ab7'}]} 
                            onPress={handleSendInvite}
                            disabled={isInviting}
                        >
                            {isInviting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Invite</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.button, {backgroundColor:'#ccc', marginTop:10}]} 
                            onPress={() => setShowInviteModal(false)}
                            disabled={isInviting}
                        >
                            <Text style={styles.btnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    
    // Empty State Style
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 50, opacity: 0.8 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalBox: { backgroundColor: '#fff', padding: 20, borderRadius: 10 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color:'#0288d1' },
    button: { backgroundColor: '#0288d1', padding: 15, borderRadius: 8, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});