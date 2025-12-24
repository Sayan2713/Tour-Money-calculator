import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert, SafeAreaView } from 'react-native';
import axios from 'axios';
import { PasswordInput } from './CustomInputs'; 
import { API_BASE_URL } from '../config';

export default function ChangePasswordModal({ visible, onClose, token }) {
    const [passData, setPassData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async () => {
        if (!passData.oldPassword || !passData.newPassword || !passData.confirmPassword) {
            return Alert.alert("Error", "All fields are required");
        }
        if (passData.newPassword !== passData.confirmPassword) {
            return Alert.alert("Error", "New passwords do not match");
        }

        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/users/change-password`, passData, { headers: { 'x-auth-token': token } });
            Alert.alert("Success", "Password updated successfully!");
            setPassData({ oldPassword: '', newPassword: '', confirmPassword: '' }); 
            onClose();
        } catch (err) {
            Alert.alert("Error", err.response?.data?.msg || "Failed to update password");
        }
        setLoading(false);
    };

    return (
        <Modal visible={visible} animationType="slide">
            <SafeAreaView style={styles.modalContainer}>
                <Text style={styles.title}>Change Password</Text>
                
                <Text style={styles.label}>Old Password</Text>
                <PasswordInput 
                    placeholder="Enter Old Password" 
                    value={passData.oldPassword} 
                    onChangeText={t => setPassData({ ...passData, oldPassword: t })} 
                />

                <View style={{ height: 15 }} />

                <Text style={styles.label}>New Password</Text>
                <PasswordInput 
                    placeholder="Enter New Password" 
                    value={passData.newPassword} 
                    onChangeText={t => setPassData({ ...passData, newPassword: t })} 
                />

                <View style={{ height: 15 }} />

                <Text style={styles.label}>Confirm New Password</Text>
                <PasswordInput 
                    placeholder="Confirm New Password" 
                    value={passData.confirmPassword} 
                    onChangeText={t => setPassData({ ...passData, confirmPassword: t })} 
                />

                <View style={{ height: 30 }} />

                <TouchableOpacity 
                    style={[styles.button, loading && { opacity: 0.7 }]} 
                    onPress={handleChangePassword}
                    disabled={loading}
                >
                    <Text style={styles.btnText}>{loading ? "Updating..." : "Update Password"}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.button, { backgroundColor: '#ccc', marginTop: 15 }]} 
                    onPress={onClose}
                >
                    <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalContainer: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#e1f5fe' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#0288d1' },
    label: { marginBottom: 8, fontWeight: 'bold', color: '#555', fontSize: 16 },
    button: { backgroundColor: '#0288d1', padding: 15, borderRadius: 8, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});