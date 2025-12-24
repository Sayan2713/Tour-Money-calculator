import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateInput, PasswordInput } from '../components/CustomInputs';
import { API_BASE_URL } from '../config';

export default function AuthScreen({ onLogin }) {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);
    const [authData, setAuthData] = useState({ email: '', password: '', confirmPassword: '', name: '', mobile: '', dob: '' });
    
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotStep, setForgotStep] = useState(1);
    const [forgotData, setForgotData] = useState({ email: '', dob: '', otp: '', newPassword: '', confirmPassword: '' });
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verifyOtp, setVerifyOtp] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [dateField, setDateField] = useState('');

    const handleAuth = async () => {
        if (!isLoginMode && authData.password !== authData.confirmPassword) return Alert.alert("Error", "Passwords do not match");
        setAuthLoading(true);
        const url = isLoginMode ? '/auth/login' : '/auth/signup';
        try {
            const res = await axios.post(`${API_BASE_URL}${url}`, authData);
            if (isLoginMode) {
                if (res.data.token) {
                    await AsyncStorage.setItem('userToken', res.data.token);
                    onLogin(res.data.token);
                }
            } else {
                Alert.alert("Verify Email", "OTP sent to your email.");
                setShowVerifyModal(true);
            }
        } catch (error) { Alert.alert("Error", error.response?.data?.msg || "Authentication failed"); }
        setAuthLoading(false);
    };

    const handleVerifySignup = async () => {
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/signup-verify`, { email: authData.email, otp: verifyOtp });
            setShowVerifyModal(false);
            await AsyncStorage.setItem('userToken', res.data.token);
            onLogin(res.data.token);
            Alert.alert("Success", "Account verified!");
        } catch (error) { Alert.alert("Error", error.response?.data?.msg || "Verification failed"); }
    };

    const handleForgotStep1 = async () => { try { await axios.post(`${API_BASE_URL}/auth/forgot-init`, { email: forgotData.email, dob: forgotData.dob }); setForgotStep(2); Alert.alert("OTP Sent", "Check your email."); } catch (err) { Alert.alert("Error", err.response?.data?.msg || "Failed"); } };
    const handleForgotStep2 = async () => { try { await axios.post(`${API_BASE_URL}/auth/forgot-verify`, { email: forgotData.email, otp: forgotData.otp }); setForgotStep(3); } catch (err) { Alert.alert("Error", err.response?.data?.msg || "Invalid OTP"); } };
    const handleForgotStep3 = async () => { if (forgotData.newPassword !== forgotData.confirmPassword) { Alert.alert("Error", "Passwords do not match"); return; } try { await axios.post(`${API_BASE_URL}/auth/forgot-reset`, { email: forgotData.email, otp: forgotData.otp, newPassword: forgotData.newPassword }); setShowForgotModal(false); setForgotStep(1); Alert.alert("Success", "Password reset! Please login."); } catch (err) { Alert.alert("Error", "Reset failed"); } };

    const openDatePicker = (field) => { setDateField(field); setShowDatePicker(true); };
    const handleDateChange = (e, selectedDate) => { setShowDatePicker(false); if(selectedDate) { const d = selectedDate.toISOString().split('T')[0]; if(dateField==='dob') setAuthData({...authData, dob:d}); else setForgotData({...forgotData, dob:d}); }};

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <ScrollView contentContainerStyle={styles.scrollAuth}>
                <View style={styles.authBox}>
                    <Text style={styles.title}>TripSplit</Text>
                    <Text style={styles.subtitle}>{isLoginMode ? 'Login' : 'Create Account'}</Text>
                    {isLoginMode ? (
                        <>
                            <Text style={styles.label}>Email</Text>
                            <TextInput style={styles.input} placeholder="Email" value={authData.email} onChangeText={t => setAuthData({...authData, email:t})} autoCapitalize="none" placeholderTextColor="#888" />
                            <Text style={styles.label}>Password</Text>
                            <PasswordInput placeholder="Password" value={authData.password} onChangeText={t => setAuthData({...authData, password:t})} />
                        </>
                    ) : (
                        <>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput style={styles.input} placeholder="Full Name" value={authData.name} onChangeText={t => setAuthData({...authData, name:t})} placeholderTextColor="#888" />
                            <Text style={styles.label}>Email</Text>
                            <TextInput style={styles.input} placeholder="Email ID" value={authData.email} onChangeText={t => setAuthData({...authData, email:t})} autoCapitalize="none" placeholderTextColor="#888" />
                            <Text style={styles.label}>Mobile</Text>
                            <TextInput style={styles.input} placeholder="Mobile" value={authData.mobile} onChangeText={t => setAuthData({...authData, mobile:t})} keyboardType="phone-pad" placeholderTextColor="#888" />
                            <Text style={styles.label}>Date of Birth</Text>
                            <DateInput value={authData.dob} onChange={t => setAuthData({...authData, dob:t})} placeholder="YYYY-MM-DD" onPress={() => openDatePicker('dob')} />
                            <Text style={styles.label}>Password</Text>
                            <PasswordInput placeholder="Password" value={authData.password} onChangeText={t => setAuthData({...authData, password:t})} />
                            <Text style={styles.label}>Confirm Password</Text>
                            <PasswordInput placeholder="Confirm Password" value={authData.confirmPassword} onChangeText={t => setAuthData({...authData, confirmPassword:t})} />
                        </>
                    )}
                    <View style={{height:20}} />
                    <TouchableOpacity style={[styles.button, authLoading && {opacity:0.6}]} onPress={handleAuth} disabled={authLoading}>
                        {authLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isLoginMode ? 'Login' : 'Sign Up'}</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsLoginMode(!isLoginMode)}>
                        <Text style={styles.linkText}>{isLoginMode ? "Create Account" : "Back to Login"}</Text>
                    </TouchableOpacity>
                    {isLoginMode && (
                        <TouchableOpacity onPress={() => setShowForgotModal(true)}>
                            <Text style={[styles.linkText, {marginTop:10, fontSize:14}]}>Forgot Password?</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            <Modal visible={showForgotModal} animationType="slide">
                <SafeAreaView style={styles.modalContainer}>
                    <Text style={styles.title}>Forgot Password</Text>
                    {forgotStep === 1 && (
                        <>
                            <Text style={styles.label}>Email Address</Text>
                            <TextInput style={styles.input} placeholder="Email" value={forgotData.email} onChangeText={t => setForgotData({...forgotData, email:t})} placeholderTextColor="#888" />
                            <Text style={styles.label}>Date of Birth</Text>
                            <DateInput value={forgotData.dob} onChange={t => setForgotData({...forgotData, dob:t})} placeholder="DOB (YYYY-MM-DD)" onPress={() => openDatePicker('forgotDob')} />
                            <View style={{height:10}} />
                            <TouchableOpacity style={styles.button} onPress={handleForgotStep1}><Text style={styles.btnText}>Next</Text></TouchableOpacity>
                        </>
                    )}
                    {forgotStep === 2 && (
                        <>
                            <Text style={styles.label}>Enter OTP</Text>
                            <TextInput style={styles.input} placeholder="Enter OTP" value={forgotData.otp} onChangeText={t => setForgotData({...forgotData, otp:t})} placeholderTextColor="#888" />
                            <TouchableOpacity style={styles.button} onPress={handleForgotStep2}><Text style={styles.btnText}>Verify</Text></TouchableOpacity>
                        </>
                    )}
                    {forgotStep === 3 && (
                        <>
                            <Text style={styles.label}>New Password</Text>
                            <PasswordInput placeholder="New Password" value={forgotData.newPassword} onChangeText={t => setForgotData({...forgotData, newPassword:t})} />
                            <View style={{height:10}} />
                            <Text style={styles.label}>Confirm New Password</Text>
                            <PasswordInput placeholder="Confirm New Password" value={forgotData.confirmPassword} onChangeText={t => setForgotData({...forgotData, confirmPassword:t})} />
                            <View style={{height:20}} />
                            <TouchableOpacity style={styles.button} onPress={handleForgotStep3}><Text style={styles.btnText}>Reset</Text></TouchableOpacity>
                        </>
                    )}
                    <TouchableOpacity style={[styles.button, {backgroundColor:'#ccc', marginTop:10}]} onPress={() => setShowForgotModal(false)}><Text style={styles.btnText}>Close</Text></TouchableOpacity>
                </SafeAreaView>
            </Modal>

            <Modal visible={showVerifyModal} animationType="slide">
                <SafeAreaView style={styles.modalContainer}>
                    <Text style={styles.title}>Verify Email</Text>
                    <Text style={{marginBottom:20, textAlign:'center'}}>Enter the OTP sent to {authData.email}</Text>
                    <TextInput style={styles.input} placeholder="OTP" value={verifyOtp} onChangeText={setVerifyOtp} placeholderTextColor="#888" />
                    <TouchableOpacity style={styles.button} onPress={handleVerifySignup}><Text style={styles.btnText}>Verify & Login</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.button, {backgroundColor:'#ccc', marginTop:10}]} onPress={() => setShowVerifyModal(false)}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
                </SafeAreaView>
            </Modal>

            {showDatePicker && <DateTimePicker value={new Date()} mode="date" display="default" onChange={handleDateChange} />}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', backgroundColor: '#e1f5fe', padding: 20 },
    scrollAuth: { padding: 20, justifyContent: 'center', flexGrow: 1 },
    authBox: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 5 },
    title: { fontSize: 26, fontWeight: 'bold', color: '#0288d1', textAlign: 'center', marginBottom: 5 },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
    label: { marginBottom: 5, fontWeight: 'bold', color: '#555' },
    input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#b3e5fc', marginBottom: 15, color: '#000' },
    button: { backgroundColor: '#0288d1', padding: 15, borderRadius: 8, alignItems: 'center' },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    linkText: { marginTop: 15, textAlign: 'center', color: '#0288d1' },
    modalContainer: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#e1f5fe' },
});