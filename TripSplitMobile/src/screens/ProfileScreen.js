import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, Image, SafeAreaView, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy'; // ✅ FIX: Imported from legacy to stop error
import { Ionicons } from '@expo/vector-icons';
import { DateInput, PasswordInput } from '../components/CustomInputs';
import ChangePasswordModal from '../components/ChangePasswordModal'; 
import { API_BASE_URL, WEB_URL } from '../config';
import { Linking } from 'react-native';

export default function ProfileScreen({ token, userProfile, onUpdate, onLogout }) {
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [showChangePassModal, setShowChangePassModal] = useState(false);
    const [editProfileData, setEditProfileData] = useState({});
    
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [subscriptionInfo, setSubscriptionInfo] = useState({ daysLeft: null, isExpired: false });

    useEffect(() => {
        if (userProfile?.subscriptionExpiresAt) {
            const days = Math.ceil(
                (new Date(userProfile.subscriptionExpiresAt) - new Date()) / (1000 * 60 * 60 * 24)
            );
            const expired = new Date() > new Date(userProfile.subscriptionExpiresAt);
            setSubscriptionInfo({ daysLeft: days, isExpired: expired });
        }
    }, [userProfile]);

    const handleEditProfile = () => {
        setEditProfileData({
            name: userProfile.name || '',
            mobile: userProfile.mobile || '',
            dob: userProfile.dob ? userProfile.dob.split('T')[0] : '',
            gender: userProfile.gender || '',
            profilePicture: userProfile.profilePicture || ''
        });
        setShowEditProfileModal(true);
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need gallery access to change your photo.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            handleUploadBase64(result.assets[0].uri);
        }
    };

    const handleUploadBase64 = async (uri) => {
        setIsUploading(true);
        try {
            // ✅ FIX: Using legacy readAsStringAsync with explicit string 'base64'
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
            const imageString = `data:image/jpeg;base64,${base64}`;

            await axios.put(`${API_BASE_URL}/users/update`, {
                ...userProfile, 
                profilePicture: imageString
            }, { 
                headers: { 'x-auth-token': token } 
            });
            
            Alert.alert("Success", "Profile Picture Updated!");
            onUpdate(); 
        } catch (err) {
            console.log("Upload Error:", err);
            Alert.alert("Error", "Failed to update picture.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(false); 
        if (selectedDate) {
            const dateStr = selectedDate.toISOString().split('T')[0];
            setEditProfileData({ ...editProfileData, dob: dateStr });
        }
    };

    const handleSaveProfile = async () => {
        try {
            await axios.put(`${API_BASE_URL}/users/update`, editProfileData, { headers: { 'x-auth-token': token } });
            onUpdate();
            setShowEditProfileModal(false);
            Alert.alert("Success", "Profile Updated");
        } catch (err) { Alert.alert("Error", "Failed to update profile"); }
    };

    const handleDeleteAccount = async () => {
        Alert.alert("Delete Account", "Are you sure? This cannot be undone.", [
            { text: "Cancel" },
            { text: "Delete", style: 'destructive', onPress: async () => {
                try {
                    await axios.delete(`${API_BASE_URL}/users/delete`, { headers: { 'x-auth-token': token } });
                    onLogout();
                } catch (err) { Alert.alert("Error", "Failed to delete account"); }
            }}
        ]);
    };

    return (
        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.card}>
               <View style={{alignItems:'center', marginBottom:20}}>
                   <View style={styles.avatarContainer}>
                       {userProfile?.profilePicture ? 
                           <Image source={{uri: userProfile.profilePicture}} style={styles.avatar} /> : 
                           <Text style={styles.avatarText}>
                               {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                           </Text>
                       }
                       {isUploading ? (
                           <View style={styles.uploadingOverlay}><ActivityIndicator color="#fff" /></View>
                       ) : (
                           <TouchableOpacity style={styles.cameraIconBtn} onPress={pickImage}>
                               <Ionicons name="camera" size={18} color="#fff" />
                           </TouchableOpacity>
                       )}
                   </View>
               </View>
               
               <Text style={styles.label}>Name: <Text style={styles.value}>{userProfile?.name}</Text></Text>
               <Text style={styles.label}>Email: <Text style={styles.value}>{userProfile?.email}</Text></Text>
               <Text style={styles.label}>Mobile: <Text style={styles.value}>{userProfile?.mobile}</Text></Text>
               <Text style={styles.label}>DOB: <Text style={styles.value}>{userProfile?.dob ? new Date(userProfile.dob).toLocaleDateString() : ''}</Text></Text>
               <Text style={styles.label}>Gender: <Text style={styles.value}>{userProfile?.gender}</Text></Text>
               
               <View style={styles.badgeContainer}>
                   <View style={[styles.planBadge, getPlanStyle(userProfile?.subscriptionPlan)]}>
                        <Text style={styles.planText}>
                            {getPlanIcon(userProfile?.subscriptionPlan)} {userProfile?.subscriptionPlan?.toUpperCase()} PLAN
                        </Text>
                   </View>
                   
                   {!subscriptionInfo.isExpired && subscriptionInfo.daysLeft !== null && (
                       <Text style={[styles.subText, subscriptionInfo.daysLeft <= 5 ? {color:'red'} : {color:'#e65100'}]}>
                           {subscriptionInfo.daysLeft} day(s) left
                       </Text>
                   )}
                   
                   {(subscriptionInfo.isExpired) && (
                       <View style={{alignItems:'center', marginTop:5}}>
                           <Text style={{color:'red', fontWeight:'bold'}}>❌ Subscription Expired</Text>
                           <TouchableOpacity 
                               style={styles.renewBtn} 
                               onPress={() => Linking.openURL(`${WEB_URL}/subscription`)}
                           >
                               <Text style={{color:'white', fontWeight:'bold'}}>Renew Now</Text>
                           </TouchableOpacity>
                       </View>
                   )}
               </View>
            </View>

            <TouchableOpacity style={[styles.button, {backgroundColor:'#006b74', marginBottom:10}]} onPress={handleEditProfile}>
               <Text style={styles.btnText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, {backgroundColor:'#0288d1', marginBottom:10}]} onPress={() => setShowChangePassModal(true)}>
               <Text style={styles.btnText}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, {backgroundColor:'#d32f2f'}]} onPress={handleDeleteAccount}>
               <Text style={styles.btnText}>Delete Account</Text>
            </TouchableOpacity>

            <Modal visible={showEditProfileModal} animationType="slide">
                <SafeAreaView style={styles.modalContainer}>
                    <Text style={styles.title}>Edit Profile</Text>
                    <TextInput style={styles.input} placeholder="Name" value={editProfileData.name} onChangeText={t => setEditProfileData({...editProfileData, name:t})} placeholderTextColor="#888" />
                    <TextInput style={styles.input} placeholder="Mobile" value={editProfileData.mobile} onChangeText={t => setEditProfileData({...editProfileData, mobile:t})} keyboardType="phone-pad" placeholderTextColor="#888" />
                    <DateInput value={editProfileData.dob} onChange={t => setEditProfileData({...editProfileData, dob:t})} placeholder="DOB (YYYY-MM-DD)" onPress={() => setShowDatePicker(true)} />
                    
                    <View style={styles.pickerBox}>
                        <Picker 
                            selectedValue={editProfileData.gender} 
                            onValueChange={v => setEditProfileData({...editProfileData, gender:v})}
                            dropdownIconColor="#000" style={{ color: '#000' }}
                        >
                            <Picker.Item label="Select Gender" value="" color="#888" />
                            <Picker.Item label="Male" value="Male" color="#000" />
                            <Picker.Item label="Female" value="Female" color="#000" />
                            <Picker.Item label="Other" value="Other" color="#000" />
                        </Picker>
                    </View>
                    <Text style={styles.note}>* To crop, please use the system editor when selecting image.</Text>
                    
                    <TouchableOpacity style={styles.button} onPress={handleSaveProfile}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.button, {backgroundColor:'#ccc', marginTop:10}]} onPress={() => setShowEditProfileModal(false)}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
                    
                    {showDatePicker && <DateTimePicker value={new Date()} mode="date" display="default" onChange={handleDateChange} />}
                </SafeAreaView>
            </Modal>

            <ChangePasswordModal visible={showChangePassModal} onClose={() => setShowChangePassModal(false)} token={token} />
        </ScrollView>
    );
}

const getPlanStyle = (plan) => {
    switch(plan) {
        case 'basic': return { backgroundColor: '#bbdefb', borderColor: '#1976d2' };
        case 'advance': return { backgroundColor: '#e1bee7', borderColor: '#7b1fa2' };
        case 'premium': return { backgroundColor: '#ffecb3', borderColor: '#ffa000' };
        default: return { backgroundColor: '#f5f5f5', borderColor: '#999' };
    }
}
const getPlanIcon = (plan) => {
    switch(plan) {
        case 'basic': return '🤗';
        case 'advance': return '🚀';
        case 'premium': return '👑';
        default: return '🆓';
    }
}

const styles = StyleSheet.create({
    content: { padding: 15 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, elevation: 2 },
    avatarContainer: { width:100, height:100, borderRadius:50, backgroundColor:'#ccc', justifyContent:'center', alignItems:'center', position:'relative' },
    avatar: { width:100, height:100, borderRadius:50 },
    avatarText: { fontSize:40, color:'white' },
    cameraIconBtn: { position:'absolute', bottom:0, right:0, backgroundColor:'#0288d1', width:30, height:30, borderRadius:15, justifyContent:'center', alignItems:'center', borderWidth:2, borderColor:'#fff' },
    uploadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,0.5)', borderRadius:50, justifyContent:'center', alignItems:'center' },
    label: { marginBottom: 5, fontWeight: 'bold', color: '#555' },
    value: { fontWeight: 'normal', color: '#000' },
    badgeContainer: { marginVertical:10, alignItems:'center', borderTopWidth:1, borderColor:'#eee', paddingTop:10, width:'100%' },
    planBadge: { paddingHorizontal:12, paddingVertical:4, borderRadius:15, borderWidth:1, marginBottom:5 },
    planText: { fontWeight:'bold', color:'#333', fontSize:12 },
    subText: { fontSize:12, fontWeight:'bold', marginTop:2 },
    renewBtn: { marginTop:5, backgroundColor:'#d32f2f', paddingHorizontal:15, paddingVertical:6, borderRadius:5 },
    button: { backgroundColor: '#0288d1', padding: 15, borderRadius: 8, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    modalContainer: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#e1f5fe' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color:'#0288d1' },
    input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#b3e5fc', marginBottom: 15, color: '#000' },
    pickerBox: { borderWidth: 1, borderColor: '#b3e5fc', borderRadius: 8, marginBottom: 15, backgroundColor: '#fff' },
    note: { fontSize:12, color:'#888', marginBottom:10 }
});