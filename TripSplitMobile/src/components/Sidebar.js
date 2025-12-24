import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { width } from '../config';

export default function Sidebar({ visible, onClose, userProfile, onNavigate, onLogout, onChangePassword }) {
    
    const handlePress = (screen) => {
        if (screen === 'graphs' && userProfile?.subscriptionPlan === 'free') {
            Alert.alert("Locked", "Please upgrade to view graphs.");
        } else {
            onNavigate(screen);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.name}>{userProfile?.name || 'User'}</Text>
                        <Text style={styles.email}>{userProfile?.email}</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {userProfile?.subscriptionPlan?.toUpperCase() || 'FREE'} PLAN
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                            <Ionicons name="close" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={{ paddingTop: 10 }}>
                        <TouchableOpacity style={styles.item} onPress={() => handlePress('profile')}>
                            <Text style={styles.text}>👤 Your Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.item, userProfile?.subscriptionPlan === 'free' && {opacity: 0.5}]} 
                            onPress={() => handlePress('graphs')}
                        >
                            <Text style={styles.text}>📊 Graphs {userProfile?.subscriptionPlan === 'free' && '🔒'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.item} onPress={() => handlePress('upgrade')}>
                            <Text style={styles.text}>👑 Upgrade Plan</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.item} onPress={() => handlePress('about')}>
                            <Text style={styles.text}>ℹ️ About Page</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.item} onPress={() => handlePress('contact')}>
                            <Text style={styles.text}>📞 Contact Page</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.item} onPress={() => handlePress('howto')}>
                            <Text style={styles.text}>❓ How To Use</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.item} onPress={() => handlePress('terms')}>
                            <Text style={styles.text}>📜 Terms & Conditions</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.item} onPress={() => handlePress('copyright')}>
                            <Text style={styles.text}>©️ Copyright</Text>
                        </TouchableOpacity>
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.item} onPress={onChangePassword}>
                            <Text style={[styles.text, { color: '#0288d1' }]}>Change Password</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.item} onPress={onLogout}>
                            <Text style={[styles.text, { color: 'red' }]}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <TouchableOpacity style={{ flex: 1 }} onPress={onClose} />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.5)' },
    container: { width: width * 0.75, backgroundColor: '#fff', height: '100%' },
    header: { padding: 20, backgroundColor: '#0288d1', paddingTop: 50 },
    name: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    email: { color: '#e1f5fe', fontSize: 12 },
    badge: { marginTop: 5, backgroundColor: '#ff9800', alignSelf: 'flex-start', paddingHorizontal: 5, borderRadius: 3 },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    closeBtn: { position: 'absolute', top: 10, right: 10 },
    item: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    text: { fontSize: 16 },
    footer: { borderTopWidth: 1, borderColor: '#eee' }
});