import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator, SafeAreaView, Image, Platform, Dimensions, Linking, KeyboardAvoidingView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons'; 
import DateTimePicker from '@react-native-community/datetimepicker'; 
import AsyncStorage from '@react-native-async-storage/async-storage'; 

// 🌍 LIVE BACKEND URL
const API_BASE_URL = 'https://tripsplit-api.onrender.com'; 
const WEB_URL = 'https://tour-money-calculator-hcq4.onrender.com';
const { width, height } = Dimensions.get('window');

// --- HELPER COMPONENTS ---

const DateInput = ({ value, onChange, placeholder, onPress }) => (
    <View style={styles.inputContainer}>
        <TextInput 
            style={[styles.input, {marginBottom:0, flex:1, borderWidth:0, color:'#000'}]} 
            placeholder={placeholder}
            placeholderTextColor="#888" 
            value={value} 
            onChangeText={onChange} 
            maxLength={10} 
        />
        <TouchableOpacity onPress={onPress}>
           <Text style={{fontSize:20}}>📅</Text> 
        </TouchableOpacity>
    </View>
);

const PasswordInput = ({ placeholder, value, onChangeText }) => {
    const [visible, setVisible] = useState(false);
    return (
        <View style={styles.passContainer}>
            <TextInput 
                style={[styles.input, {flex:1, marginBottom:0, borderWidth:0, color:'#000'}]} 
                placeholder={placeholder}
                placeholderTextColor="#888" 
                value={value} 
                onChangeText={onChangeText} 
                secureTextEntry={!visible} 
            />
            <TouchableOpacity onPress={() => setVisible(!visible)} style={{padding:10}}>
                <Ionicons name={visible ? "eye-off" : "eye"} size={20} color="#555" />
            </TouchableOpacity>
        </View>
    )
}

// --- CUSTOM GRAPH COMPONENT ---
const SimpleBarChart = ({ data }) => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    return (
        <View style={{marginVertical:10}}>
            {data.map((item, index) => {
                if(item.value === 0) return null;
                const widthPct = (item.value / maxVal) * 100;
                return (
                    <View key={index} style={{marginBottom:15}}>
                        <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:5}}>
                            <Text style={{fontSize:14, fontWeight:'600', color:'#555'}}>{item.label}</Text>
                            <Text style={{fontSize:14, fontWeight:'bold', color:'#333'}}>₹{item.value.toFixed(0)}</Text>
                        </View>
                        <View style={{height:14, backgroundColor:'#e0e0e0', borderRadius:7, width:'100%'}}>
                            <View style={{height:14, backgroundColor: item.color || '#0288d1', borderRadius:7, width: `${widthPct}%`}} />
                        </View>
                    </View>
                )
            })}
        </View>
    )
}

export default function App() {
  const [token, setToken] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [view, setView] = useState('auth'); 
  
  // --- LOADING STATES ---
  const [isAddingTrip, setIsAddingTrip] = useState(false);
  const [isAddingPart, setIsAddingPart] = useState(false);
  const [isSavingExp, setIsSavingExp] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // --- AUTH STATE ---
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authData, setAuthData] = useState({ email: '', password: '', confirmPassword: '', name: '', mobile: '', dob: '' });
  
  // Forgot Password
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); 
  const [forgotData, setForgotData] = useState({ email: '', dob: '', otp: '', newPassword: '', confirmPassword: '' });
  
  // Verify Signup
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState('');

  // --- APP DATA ---
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  
  // --- SIDEBAR & MENU ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false); 
  const [editProfileData, setEditProfileData] = useState({}); 
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [passData, setPassData] = useState({ oldPassword: '', newPassword: '' });

  // --- FORMS ---
  const [newTripName, setNewTripName] = useState('');
  const [newParticipantName, setNewParticipantName] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  // UPGRADED EXPENSE FORM
  const [expenseForm, setExpenseForm] = useState({ 
      title: '', amount: '', payer: '', category: 'Food', 
      splitType: 'EQUAL', sharedBy: [], splitDetails: {} 
  });

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteTrip, setInviteTrip] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState(''); 

  // ------------------------------------------------------------------
  // 0. PERSISTENCE
  // ------------------------------------------------------------------
  useEffect(() => {
    const loadSession = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('userToken');
            if (storedToken) {
                setToken(storedToken);
                fetchTrips(storedToken);
                fetchUserProfile(storedToken);
                setView('list');
            }
        } catch (e) { console.log('Session load error'); }
    };
    loadSession();
  }, []);

  // ------------------------------------------------------------------
  // 1. AUTHENTICATION
  // ------------------------------------------------------------------
  const handleAuth = async () => {
    if (!isLoginMode && authData.password !== authData.confirmPassword) {
        return Alert.alert("Error", "Passwords do not match");
    }
    setAuthLoading(true);
    const url = isLoginMode ? '/auth/login' : '/auth/signup';
    try {
      const res = await axios.post(`${API_BASE_URL}${url}`, authData);
      if (isLoginMode) {
        if (res.data.token) {
          const t = res.data.token;
          setToken(t);
          await AsyncStorage.setItem('userToken', t);
          fetchTrips(t);
          fetchUserProfile(t);
          setView('list');
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
      const t = res.data.token;
      setToken(t);
      await AsyncStorage.setItem('userToken', t);
      fetchTrips(t);
      fetchUserProfile(t);
      setView('list');
      Alert.alert("Success", "Account verified!");
    } catch (error) { Alert.alert("Error", error.response?.data?.msg || "Verification failed"); }
  };

  const logout = async () => {
    setToken(null);
    await AsyncStorage.removeItem('userToken');
    setView('auth');
    setTrips([]);
    setSelectedTrip(null);
    setSidebarOpen(false);
    
    // FIX: Clear all input data on logout
    setAuthData({ email: '', password: '', confirmPassword: '', name: '', mobile: '', dob: '' });
    setForgotData({ email: '', dob: '', otp: '', newPassword: '', confirmPassword: '' });
    setVerifyOtp('');
  };

  // ------------------------------------------------------------------
  // 2. DATA FETCHING
  // ------------------------------------------------------------------
  const fetchUserProfile = async (authToken) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users`, { headers: { 'x-auth-token': authToken || token } });
      setUserProfile(res.data);
    } catch (err) { console.log("Profile fetch error", err); }
  };

  useEffect(() => {
    if (!token || !selectedTrip) return;
    const interval = setInterval(() => { fetchDetails(selectedTrip, true); }, 5000); 
    return () => clearInterval(interval);
  }, [token, selectedTrip]);

  const fetchTrips = async (authToken) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/trips`, { headers: { 'x-auth-token': authToken || token } });
      setTrips(res.data);
    } catch (err) { console.log(err); }
  };

  const fetchDetails = async (trip, silent = false) => {
    if (!silent) {
        setView('details'); 
        setSelectedTrip(trip);
        setParticipants([]);
        setExpenses([]);
    }
    try {
      const pRes = await axios.get(`${API_BASE_URL}/participants/${trip._id}`, { headers: { 'x-auth-token': token } });
      const eRes = await axios.get(`${API_BASE_URL}/expenses/${trip._id}`, { headers: { 'x-auth-token': token } });
      setParticipants(pRes.data);
      setExpenses(eRes.data);
    } catch (err) { if (!silent) Alert.alert("Error", "Could not load trip details"); }
  };

  // ------------------------------------------------------------------
  // 3. TRIP ACTIONS
  // ------------------------------------------------------------------
  const handleAddTrip = async () => {
    if(!newTripName) return;
    setIsAddingTrip(true);
    try {
      await axios.post(`${API_BASE_URL}/trips/add`, { name: newTripName }, { headers: { 'x-auth-token': token } });
      setNewTripName('');
      fetchTrips(token);
    } catch (err) { Alert.alert("Error", "Failed to add trip"); }
    setIsAddingTrip(false);
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

  const handleAddParticipant = async () => {
    if(!newParticipantName) return;
    setIsAddingPart(true);
    try {
      await axios.post(`${API_BASE_URL}/participants/add`, { name: newParticipantName, tripId: selectedTrip._id }, { headers: { 'x-auth-token': token } });
      setNewParticipantName('');
      await fetchDetails(selectedTrip, true); 
    } catch (err) { Alert.alert("Error", "Failed to add participant"); }
    setIsAddingPart(false);
  };

  const handleDeleteTrip = async (id) => {
      Alert.alert("Delete Trip", "Are you sure?", [
          { text: "Cancel" },
          { text: "Delete", style: 'destructive', onPress: async () => {
              try {
                  await axios.delete(`${API_BASE_URL}/trips/delete/${id}`, { headers: { 'x-auth-token': token } });
                  fetchTrips(token);
              } catch (err) { Alert.alert("Error", "Failed to delete"); }
          }}
      ])
  }

  // ------------------------------------------------------------------
  // 4. EXPENSE ACTIONS (UPGRADED)
  // ------------------------------------------------------------------
  const handleSaveExpense = async () => {
    const totalAmt = parseFloat(expenseForm.amount);
    if(!expenseForm.title || isNaN(totalAmt) || !expenseForm.payer) return Alert.alert("Error", "Invalid inputs");

    let payload = {
        title: expenseForm.title,
        amount: totalAmt,
        category: expenseForm.category,
        payer: expenseForm.payer,
        tripId: selectedTrip._id,
        splitType: expenseForm.splitType || 'EQUAL'
    };

    if (payload.splitType === 'EQUAL') {
        if (expenseForm.sharedBy.length === 0) return Alert.alert("Error", "Select at least one person.");
        payload.sharedBy = expenseForm.sharedBy;
    } else {
        let details = [];
        let runningTotal = 0;
        participants.forEach(p => {
            const val = parseFloat(expenseForm.splitDetails[p.name]?.value || 0);
            if(val > 0) {
                let amt = payload.splitType === 'PERCENT' ? (val/100)*totalAmt : val;
                runningTotal += val;
                details.push({ name: p.name, value: val, amount: amt });
            }
        });
        if(details.length === 0) return Alert.alert("Error", "Enter split details.");
        if(payload.splitType === 'PERCENT' && Math.abs(runningTotal - 100) > 0.5) return Alert.alert("Error", "Total must be 100%");
        if(payload.splitType === 'EXACT' && Math.abs(runningTotal - totalAmt) > 1) return Alert.alert("Error", "Split total must match expense amount");
        payload.splitDetails = details;
    }

    setIsSavingExp(true);
    try {
      if (editingExpense) {
          await axios.put(`${API_BASE_URL}/expenses/update/${editingExpense._id}`, payload, { headers: { 'x-auth-token': token } });
      } else {
          await axios.post(`${API_BASE_URL}/expenses/add`, payload, { headers: { 'x-auth-token': token } });
      }
      setShowExpenseModal(false);
      fetchDetails(selectedTrip, true);
    } catch (err) { Alert.alert("Error", "Failed to save expense."); }
    setIsSavingExp(false);
  };

  const handleDeleteExpense = async (id) => {
    Alert.alert("Delete", "Delete this expense?", [
        { text: "Cancel" },
        { text: "Delete", style:'destructive', onPress: async () => {
            try {
                await axios.delete(`${API_BASE_URL}/expenses/delete/${id}`, { headers: { 'x-auth-token': token } });
                fetchDetails(selectedTrip, true);
            } catch (err) { Alert.alert("Error", "Could not delete"); }
        }}
    ]);
  }

  const handleDeleteParticipant = (id) => {
    Alert.alert("Delete", "Remove participant?", [
        { text: "Cancel" },
        { text: "Delete", onPress: async () => {
            try {
                await axios.delete(`${API_BASE_URL}/participants/delete/${id}`, { headers: { 'x-auth-token': token } });
                fetchDetails(selectedTrip, true);
            } catch (err) { Alert.alert("Error", "Failed to delete"); }
        }}
    ]);
  };

  // --- PROFILE ACTIONS (Missing in previous, RESTORED) ---
  const handleEditProfile = () => {
      setEditProfileData({
          name: userProfile.name || '',
          mobile: userProfile.mobile || '',
          dob: userProfile.dob ? userProfile.dob.split('T')[0] : '',
          gender: userProfile.gender || '',
          profilePicture: userProfile.profilePicture || ''
      });
      setShowProfileModal(false); 
      setShowEditProfileModal(true); 
  };

  const handleSaveProfile = async () => {
      try {
          await axios.put(`${API_BASE_URL}/users/update`, editProfileData, { headers: { 'x-auth-token': token } });
          fetchUserProfile(token);
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
                  logout();
              } catch (err) { Alert.alert("Error", "Failed to delete account"); }
          }}
      ]);
  };

  const handleChangePassword = async () => {
    try {
      await axios.post(`${API_BASE_URL}/users/change-password`, passData, { headers: { 'x-auth-token': token } });
      Alert.alert("Success", "Password updated!");
      setShowChangePassModal(false);
      setPassData({ oldPassword: '', newPassword: '' });
    } catch (err) { Alert.alert("Error", err.response?.data?.msg || "Failed"); }
  };

  // --- FORGOT PASSWORD ACTIONS (Missing in previous, RESTORED) ---
  const handleOpenForgot = () => {
      setForgotData({ email: '', dob: '', otp: '', newPassword: '', confirmPassword: '' });
      setForgotStep(1);
      setShowForgotModal(true);
  };
  const handleForgotStep1 = async () => {
    try { await axios.post(`${API_BASE_URL}/auth/forgot-init`, { email: forgotData.email, dob: forgotData.dob }); setForgotStep(2); Alert.alert("OTP Sent", "Check your email."); } catch (err) { Alert.alert("Error", err.response?.data?.msg || "Failed"); }
  };
  const handleForgotStep2 = async () => {
    try { await axios.post(`${API_BASE_URL}/auth/forgot-verify`, { email: forgotData.email, otp: forgotData.otp }); setForgotStep(3); } catch (err) { Alert.alert("Error", err.response?.data?.msg || "Invalid OTP"); }
  };
  const handleForgotStep3 = async () => {
    if (forgotData.newPassword !== forgotData.confirmPassword) { Alert.alert("Error", "Passwords do not match"); return; }
    try { await axios.post(`${API_BASE_URL}/auth/forgot-reset`, { email: forgotData.email, otp: forgotData.otp, newPassword: forgotData.newPassword }); setShowForgotModal(false); setForgotStep(1); Alert.alert("Success", "Password reset! Please login."); } catch (err) { Alert.alert("Error", "Reset failed"); }
  };

  // --- UI HELPERS ---
  const openExpenseModal = (expense = null) => {
      if (expense) {
          setEditingExpense(expense);
          const detailsMap = {};
          if(expense.splitDetails && Array.isArray(expense.splitDetails)) {
              expense.splitDetails.forEach(d => detailsMap[d.name] = { value: d.value.toString(), amount: d.amount });
          }
          setExpenseForm({ title: expense.title, amount: expense.amount.toString(), payer: expense.payer, category: expense.category, sharedBy: expense.sharedBy || [], splitType: expense.splitType || 'EQUAL', splitDetails: detailsMap });
      } else {
          setEditingExpense(null);
          setExpenseForm({ title: '', amount: '', payer: '', category: 'Food', sharedBy: participants.map(p => p.name), splitType: 'EQUAL', splitDetails: {} });
      }
      setShowExpenseModal(true);
  };
  const toggleShare = (name) => { setExpenseForm(prev => { const current = prev.sharedBy; return current.includes(name) ? { ...prev, sharedBy: current.filter(n => n !== name) } : { ...prev, sharedBy: [...current, name] }; }); };
  const openDatePicker = (field) => { setDateField(field); setShowDatePicker(true); };
  const handleDateChange = (event, selectedDate) => { setShowDatePicker(false); if (selectedDate) { const dateStr = selectedDate.toISOString().split('T')[0]; if (dateField === 'dob') setAuthData({...authData, dob: dateStr}); else if (dateField === 'forgotDob') setForgotData({...forgotData, dob: dateStr}); else if (dateField === 'editDob') setEditProfileData({...editProfileData, dob: dateStr}); } };
  
  const navigateFromSidebar = (screenName) => { 
      if (screenName === 'graphs' || screenName === 'upgrade') {
          // Open Website logic
          const path = screenName === 'graphs' ? 'graphs' : 'subscription';
          Alert.alert(
              "Switch to Web",
              `Opening ${screenName === 'graphs' ? 'Graphs' : 'Subscription'} on our website for the best view.`,
              [
                  { text: "Cancel", style: "cancel" },
                  { text: "Open Web", onPress: () => Linking.openURL(`${WEB_URL}/${path}`) }
              ]
          );
      } else {
          setSidebarOpen(false); 
          setView(screenName); 
      }
  }
  const openEmail = () => Linking.openURL('mailto:sayanmondal13072002@gmail.com');
  const openLinkedIn = () => Linking.openURL('https://www.linkedin.com/in/sayan2713-mondal/');

  // --- CALCULATION ---
  const settlement = useMemo(() => {
    if (!participants.length || !expenses.length) return { netPayments: [], totalSpent: 0 };
    const pNames = participants.map(p => p.name);
    const matrix = {};
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    pNames.forEach(p => { matrix[p] = {}; pNames.forEach(q => matrix[p][q] = 0); });
    
    expenses.forEach(e => {
        if(!pNames.includes(e.payer)) return;
        if (e.splitType === 'EQUAL' || !e.splitType) {
            const validSharers = (e.sharedBy || []).filter(n => pNames.includes(n));
            if (!validSharers.length) return;
            const split = e.amount / validSharers.length;
            validSharers.forEach(pName => { if (pName !== e.payer && pNames.includes(e.payer)) matrix[pName][e.payer] += split; });
        } else if (Array.isArray(e.splitDetails)) {
            e.splitDetails.forEach(d => { if(pNames.includes(d.name) && d.name !== e.payer) matrix[d.name][e.payer] += (d.amount || 0); });
        }
    });
    const netPayments = [];
    const seen = new Set();
    pNames.forEach(p => {
        pNames.forEach(q => {
            if (p === q) return;
            const net = matrix[p][q] - matrix[q][p];
            const key = [p, q].sort().join('-');
            if (net > 0.5 && !seen.has(key)) { netPayments.push({ from: p, to: q, amount: net }); seen.add(key); }
            else if (net < -0.5 && !seen.has(key)) { netPayments.push({ from: q, to: p, amount: -net }); seen.add(key); }
        });
    });
    return { netPayments, totalSpent };
  }, [expenses, participants]);


  // ------------------------------------------------------------------
  // RENDER UI
  // ------------------------------------------------------------------

  if (!token) {
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
              <TouchableOpacity onPress={handleOpenForgot}>
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
              <TouchableOpacity style={[styles.button, {backgroundColor:'#ccc', marginTop:10}]} onPress={() => {setShowForgotModal(false); setForgotStep(1);}}>
                 <Text style={styles.btnText}>Close</Text>
              </TouchableOpacity>
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

  // --- LOGGED IN VIEW ---
  return (
    <SafeAreaView style={styles.safeArea}>
        
        {/* HEADER */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => setSidebarOpen(true)}>
                 {userProfile?.profilePicture ? (
                      <Image source={{uri: userProfile.profilePicture}} style={{width:35, height:35, borderRadius:20}} />
                 ) : (
                    <View style={{width:35, height:35, borderRadius:20, backgroundColor:'#ccc', justifyContent:'center', alignItems:'center'}}>
                        <Text style={{color:'#fff', fontWeight:'bold'}}>U</Text>
                    </View>
                 )}
            </TouchableOpacity>

            <Text style={styles.headerTitle}>TripSplit</Text>

            {/* Home Icon on Right */}
            <View style={{width:35, alignItems:'flex-end'}}>
                {view !== 'list' && (
                    <TouchableOpacity onPress={() => setView('list')}>
                        <Ionicons name="home" size={24} color="#0288d1" />
                    </TouchableOpacity>
                )}
            </View>
        </View>

        {/* SIDEBAR */}
        <Modal visible={sidebarOpen} transparent animationType="fade">
            <View style={{flex:1, flexDirection:'row', backgroundColor:'rgba(0,0,0,0.5)'}}>
                <View style={{width: width * 0.75, backgroundColor:'#fff'}}>
                    <View style={{padding:20, backgroundColor:'#0288d1', paddingTop:50}}>
                        <Text style={{color:'#fff', fontSize:20, fontWeight:'bold'}}>{userProfile?.name || 'User'}</Text>
                        <Text style={{color:'#e1f5fe'}}>{userProfile?.email}</Text>
                        <View style={{marginTop:5, backgroundColor:'#ff9800', alignSelf:'flex-start', paddingHorizontal:5, borderRadius:3}}>
                            <Text style={{color:'#fff', fontSize:10, fontWeight:'bold'}}>{userProfile?.subscriptionPlan?.toUpperCase() || 'FREE'} PLAN</Text>
                        </View>
                    </View>
                    <ScrollView contentContainerStyle={{paddingTop:10}}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => {setSidebarOpen(false); setView('profile');}}><Text style={styles.menuText}>👤 Your Profile</Text></TouchableOpacity>
                        
                        <TouchableOpacity style={[styles.menuItem]} onPress={() => navigateFromSidebar('graphs')}>
                            <Text style={styles.menuText}>📊 Graphs {userProfile?.subscriptionPlan === 'free' && '🔒'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={() => navigateFromSidebar('upgrade')}><Text style={styles.menuText}>👑 Upgrade Plan</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => navigateFromSidebar('about')}><Text style={styles.menuText}>ℹ️ About Page</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => navigateFromSidebar('contact')}><Text style={styles.menuText}>📞 Contact Page</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => navigateFromSidebar('howto')}><Text style={styles.menuText}>❓ How To Use</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => navigateFromSidebar('terms')}><Text style={styles.menuText}>📜 Terms & Conditions</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => navigateFromSidebar('copyright')}><Text style={styles.menuText}>©️ Copyright</Text></TouchableOpacity>
                    </ScrollView>
                    <View style={{borderTopWidth:1, borderColor:'#eee'}}>
                         <TouchableOpacity style={styles.menuItem} onPress={() => {setSidebarOpen(false); setShowChangePassModal(true)}}><Text style={[styles.menuText, {color:'#0288d1'}]}>Change Password</Text></TouchableOpacity>
                         <TouchableOpacity style={styles.menuItem} onPress={logout}><Text style={[styles.menuText, {color:'red'}]}>Logout</Text></TouchableOpacity>
                    </View>
                    <TouchableOpacity style={{position:'absolute', top:10, right:10}} onPress={() => setSidebarOpen(false)}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={{flex:1}} onPress={() => setSidebarOpen(false)} />
            </View>
        </Modal>

        {/* PROFILE PAGE (VIEW) */}
        {view === 'profile' && (
            <ScrollView contentContainerStyle={styles.content}>
               <View style={styles.card}>
                   <View style={{alignItems:'center', marginBottom:20}}>
                       <View style={{width:100, height:100, borderRadius:50, backgroundColor:'#ccc', justifyContent:'center', alignItems:'center'}}>
                           {userProfile?.profilePicture ? <Image source={{uri: userProfile.profilePicture}} style={{width:100, height:100, borderRadius:50}} /> : <Text style={{fontSize:40, color:'white'}}>U</Text>}
                       </View>
                   </View>
                   <Text style={styles.label}>Name: <Text style={{fontWeight:'normal'}}>{userProfile?.name}</Text></Text>
                   <Text style={styles.label}>Email: <Text style={{fontWeight:'normal'}}>{userProfile?.email}</Text></Text>
                   <Text style={styles.label}>Mobile: <Text style={{fontWeight:'normal'}}>{userProfile?.mobile}</Text></Text>
                   <Text style={styles.label}>DOB: <Text style={{fontWeight:'normal'}}>{userProfile?.dob ? new Date(userProfile.dob).toLocaleDateString() : ''}</Text></Text>
                   <Text style={styles.label}>Gender: <Text style={{fontWeight:'normal'}}>{userProfile?.gender}</Text></Text>
                   <View style={{marginVertical:10, alignItems:'center'}}>
                       <Text style={{fontWeight:'bold', color:'#ff9800'}}>{userProfile?.subscriptionPlan?.toUpperCase()} PLAN</Text>
                   </View>
               </View>

               <TouchableOpacity style={[styles.button, {backgroundColor:'#006b74', marginBottom:10}]} onPress={handleEditProfile}>
                   <Text style={styles.btnText}>Edit Profile</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.button, {backgroundColor:'#d32f2f'}]} onPress={handleDeleteAccount}>
                   <Text style={styles.btnText}>Delete Account</Text>
               </TouchableOpacity>
            </ScrollView>
        )}

        {/* EDIT PROFILE MODAL */}
        <Modal visible={showEditProfileModal} animationType="slide">
            <SafeAreaView style={styles.modalContainer}>
                <Text style={styles.title}>Edit Profile</Text>
                <TextInput style={styles.input} placeholder="Name" value={editProfileData.name} onChangeText={t => setEditProfileData({...editProfileData, name:t})} placeholderTextColor="#888" />
                <TextInput style={styles.input} placeholder="Mobile" value={editProfileData.mobile} onChangeText={t => setEditProfileData({...editProfileData, mobile:t})} keyboardType="phone-pad" placeholderTextColor="#888" />
                <DateInput value={editProfileData.dob} onChange={t => setEditProfileData({...editProfileData, dob:t})} placeholder="DOB (YYYY-MM-DD)" onPress={() => openDatePicker('editDob')} />
                <View style={styles.pickerBox}>
                    <Picker selectedValue={editProfileData.gender} onValueChange={v => setEditProfileData({...editProfileData, gender:v})}>
                        <Picker.Item label="Select Gender" value="" />
                        <Picker.Item label="Male" value="Male" />
                        <Picker.Item label="Female" value="Female" />
                        <Picker.Item label="Other" value="Other" />
                    </Picker>
                </View>
                <Text style={{fontSize:12, color:'#888', marginBottom:10}}>* Profile picture update available on web</Text>
                <TouchableOpacity style={styles.button} onPress={handleSaveProfile}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.button, {backgroundColor:'#ccc', marginTop:10}]} onPress={() => setShowEditProfileModal(false)}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
            </SafeAreaView>
        </Modal>

        {/* CHANGE PASSWORD MODAL */}
        <Modal visible={showChangePassModal} animationType="slide">
           <SafeAreaView style={styles.modalContainer}>
               <Text style={styles.title}>Change Password</Text>
               <PasswordInput placeholder="Old Password" value={passData.oldPassword} onChangeText={t => setPassData({...passData, oldPassword:t})} />
               <View style={{height:10}} />
               <PasswordInput placeholder="New Password" value={passData.newPassword} onChangeText={t => setPassData({...passData, newPassword:t})} />
               <View style={{height:10}} />
               <PasswordInput placeholder="Confirm New Password" value={passData.confirmPassword || ''} onChangeText={t => setPassData({...passData, confirmPassword:t})} />
               <View style={{height:20}} />
               <TouchableOpacity style={styles.button} onPress={handleChangePassword}><Text style={styles.btnText}>Update</Text></TouchableOpacity>
               <TouchableOpacity style={[styles.button, {backgroundColor:'#ccc', marginTop:10}]} onPress={() => setShowChangePassModal(false)}><Text style={styles.btnText}>Close</Text></TouchableOpacity>
           </SafeAreaView>
        </Modal>

        {/* CONTENT AREA */}
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            
            {/* --- TRIP LIST --- */}
            {view === 'list' && (
                <>
                    <View style={styles.row}>
                        <Text style={[styles.label, {flex: 1, marginBottom: 0, marginRight: 10}]}>Create Trip</Text>
                    </View>
                    <View style={styles.row}>
                        <TextInput style={[styles.input, {flex:1, marginBottom:0}]} placeholder="New Trip Name" value={newTripName} onChangeText={setNewTripName} placeholderTextColor="#888" />
                        <TouchableOpacity 
                            style={[styles.smallBtn, isAddingTrip && {opacity:0.6}]} 
                            onPress={handleAddTrip}
                            disabled={isAddingTrip}
                        >
                            {isAddingTrip ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.smallBtnText}>Create</Text>}
                        </TouchableOpacity>
                    </View>
                    <View style={{marginTop:20}}>
                        {trips.map(trip => (
                            <TouchableOpacity key={trip._id} style={styles.tripCard} onPress={() => fetchDetails(trip)}>
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
                        ))}
                    </View>
                </>
            )}

            {/* --- TRIP DETAILS --- */}
            {view === 'details' && selectedTrip && (
                <>
                    <View style={[styles.card, {backgroundColor:'#e3f2fd', flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:10}]}>
                       <Text style={{fontSize:20, fontWeight:'bold', color:'#0277bd'}}>{selectedTrip.name}</Text>
                       <TouchableOpacity onPress={() => navigateFromSidebar('graphs')} style={{backgroundColor:'#fff', padding:5, borderRadius:5}}>
                            <Text style={{color:'#0277bd', fontSize:12}}>Graphs 📊</Text>
                       </TouchableOpacity>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Participants</Text>
                        <Text style={styles.label}>Add Participant Name</Text>
                        <View style={styles.row}>
                            <TextInput style={[styles.input, {flex:1, marginBottom:0}]} placeholder="Name" value={newParticipantName} onChangeText={setNewParticipantName} placeholderTextColor="#888" />
                            <TouchableOpacity 
                                style={[styles.smallBtn, isAddingPart && {opacity:0.6}]} 
                                onPress={handleAddParticipant}
                                disabled={isAddingPart}
                            >
                                {isAddingPart ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.smallBtnText}>Add</Text>}
                            </TouchableOpacity>
                        </View>
                        <View style={styles.chipContainer}>
                            {participants.map(p => ( 
                                <View key={p._id} style={styles.chip}>
                                    <Text style={styles.chipText}>{p.name}</Text>
                                    <TouchableOpacity onPress={() => handleDeleteParticipant(p._id)} style={{marginLeft: 8, padding: 2}}>
                                        <Text style={{color: '#d32f2f', fontWeight: 'bold'}}>✕</Text>
                                    </TouchableOpacity>
                                </View> 
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity style={styles.actionBtn} onPress={() => openExpenseModal()}>
                        <Text style={styles.btnText}>+ Add Expense</Text>
                    </TouchableOpacity>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Settlement</Text>
                        <View style={styles.rowBetween}>
                            <View style={styles.statBox}><Text>Total</Text><Text style={styles.statNum}>₹{settlement.totalSpent.toFixed(2)}</Text></View>
                            <View style={styles.statBox}><Text>Per Person</Text><Text style={styles.statNum}>₹{participants.length ? (settlement.totalSpent/participants.length).toFixed(2) : 0}</Text></View>
                        </View>
                        {settlement.netPayments.length === 0 ? <Text style={{color:'green', marginTop:10}}>All Settled!</Text> : (
                            settlement.netPayments.map((p, i) => (
                                <View key={i} style={styles.payRow}>
                                    <Text>{p.from} <Text style={{color:'red', fontWeight:'bold'}}>→</Text> {p.to}</Text>
                                    <Text style={{fontWeight:'bold'}}>₹{p.amount.toFixed(2)}</Text>
                                </View>
                            ))
                        )}
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Expense Log</Text>
                        {expenses.map(e => (
                            <View key={e._id} style={styles.expenseItem}>
                                <View style={{flex:1}}>
                                    <Text style={styles.expenseTitle}>{e.title}</Text>
                                    <Text style={styles.expenseSub}>{e.payer} paid • {e.category}</Text>
                                    <View style={{backgroundColor:'#eee', alignSelf:'flex-start', paddingHorizontal:5, borderRadius:4, marginTop:2}}>
                                        <Text style={{fontSize:10, color:'#555'}}>{e.splitType === 'PERCENT' ? 'Split by %' : e.splitType === 'EXACT' ? 'Split by ₹' : 'Equal Split'}</Text>
                                    </View>
                                </View>
                                <View style={{alignItems:'flex-end'}}>
                                    <Text style={styles.expenseAmount}>₹{e.amount}</Text>
                                    <View style={{flexDirection:'row', gap:15, marginTop: 5}}>
                                        <TouchableOpacity onPress={() => openExpenseModal(e)} style={[styles.outlineBtn, {borderColor:'#fbc02d'}]}><Text style={{color:'#fbc02d', fontWeight:'bold', fontSize:12}}>Edit</Text></TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDeleteExpense(e._id)} style={[styles.outlineBtn, {borderColor:'#d32f2f'}]}><Text style={{color:'#d32f2f', fontWeight:'bold', fontSize:12}}>Delete</Text></TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </>
            )}

            {/* --- GENUINE CONTENT PAGES --- */}
            {['about', 'contact', 'howto', 'terms', 'copyright'].includes(view) && (
                <View style={[styles.card, {minHeight: height * 0.7}]}>
                    <Text style={[styles.title, {textAlign:'left'}]}>{view.charAt(0).toUpperCase() + view.slice(1)}</Text>
                    
                    {view === 'about' && (
                        <Text style={{lineHeight:22}}>
TripSplit is a smart expense-splitting application designed to help friends, families, and groups manage shared expenses during trips, events, or daily activities.{'\n\n'}
Managing group expenses can be confusing and time-consuming. TripSplit simplifies this process by tracking who paid, who owes whom, and how much—automatically.{'\n\n'}
Key Features{'\n'}
• Create and manage multiple trips{'\n'}
• Add participants easily{'\n'}
• Log expenses with flexible splitting{'\n'}
• Automatic settlement calculation{'\n'}
• Graphical insights with subscriptions{'\n'}
• Secure authentication and data storage{'\n\n'}
Our goal is to make group expense management transparent, fair, and stress-free—so you can focus on enjoying the trip, not the math.{'\n\n'}
TripSplit. All rights reserved.
                        </Text>
                    )}
                    {view === 'contact' && (
                        <View>
                            <Text style={{lineHeight:22}}>
We’d love to hear from you. If you have any questions, feedback, feature requests, or issues, feel free to reach out.{'\n'}
                            </Text>
                            <View style={{marginVertical:10}}>
                                <Text style={styles.label}>Support Email</Text>
                                <TouchableOpacity onPress={openEmail}>
                                    <Text style={{color:'#0288d1', fontSize:16}}>sayanmondal13072002@gmail.com</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{marginVertical:10}}>
                                <Text style={styles.label}>LinkedIn</Text>
                                <TouchableOpacity onPress={openLinkedIn}>
                                    <Text style={{color:'#0288d1', fontSize:16}}>View Profile</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={{lineHeight:22, marginTop:10}}>
Response Time{'\n'}
We usually respond within 24–48 hours on business days.{'\n\n'}
TripSplit. All rights reserved.
                            </Text>
                        </View>
                    )}
                    {view === 'howto' && (
                        <Text style={{lineHeight:22}}>
1. Create a Trip{'\n'}
After logging in, create a new trip by entering a trip name. Each trip represents a journey or event where expenses will be tracked.{'\n\n'}
2. Add Participants{'\n'}
Add all people who are part of the trip. Participants can be added manually or invited via email.{'\n\n'}
3. Add Expenses{'\n'}
Record expenses by entering the title, amount, category, payer, and selecting who shared the expense.{'\n\n'}
4. Automatic Settlement{'\n'}
TripSplit automatically calculates who owes whom and how much, based on all recorded expenses.{'\n\n'}
5. View Expense Log{'\n'}
Review all expenses in the expense log. You can edit or delete expenses if needed.{'\n\n'}
6. Analyze with Graphs{'\n'}
Use the Graph section to visualize spending by category, timeline, and individuals (based on your subscription plan).{'\n\n'}
7. Manage Your Profile{'\n'}
Update your profile details, change your password, or manage your subscription from the profile section.{'\n\n'}
8. Upgrade for More Features{'\n'}
Unlock advanced analytics and premium features by upgrading your subscription plan.{'\n\n'}
TripSplit helps you focus on the trip — not the math.
                        </Text>
                    )}
                    {view === 'terms' && (
                        <Text style={{lineHeight:22}}>
By using the TripSplit application, you agree to the following terms and conditions. Please read them carefully.{'\n\n'}
1. Usage{'\n'}
TripSplit is designed to help users manage and split expenses. You agree to use the app only for lawful purposes.{'\n\n'}
2. User Responsibility{'\n'}
You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.{'\n\n'}
3. Data Accuracy{'\n'}
TripSplit does not guarantee the accuracy of calculations if incorrect data is entered by the user. Please verify expense details carefully.{'\n\n'}
4. Subscription & Payments{'\n'}
Certain features are available only under paid subscription plans. Subscription fees are non-refundable unless required by law.{'\n\n'}
5. Account Termination{'\n'}
We reserve the right to suspend or terminate accounts that violate these terms or misuse the service.{'\n\n'}
6. Limitation of Liability{'\n'}
TripSplit shall not be liable for any indirect, incidental, or consequential damages arising from the use of the app.{'\n\n'}
7. Changes to Terms{'\n'}
These terms may be updated from time to time. Continued use of the app constitutes acceptance of the updated terms.{'\n\n'}
Last updated: 2025
                        </Text>
                    )}
                    {view === 'copyright' && (
                        <Text style={{lineHeight:22}}>
All content, features, source code, designs, logos, icons, graphics, text, and software used in the TripSplit application are the exclusive property of TripSplit and are protected under applicable copyright laws.{'\n\n'}
Unauthorized copying, modification, distribution, transmission, performance, display, or other use of this application or any of its content without prior written permission is strictly prohibited.{'\n\n'}
This application is provided for personal and non-commercial use only. Any commercial use, resale, or redistribution is not permitted without explicit authorization.{'\n\n'}
For copyright-related inquiries, please contact our support team.{'\n\n'}
TripSplit — Smart expense sharing for trips.
                        </Text>
                    )}
                </View>
            )}

        </ScrollView>

        {/* INVITE MODAL */}
        <Modal visible={showInviteModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                    <Text style={styles.modalTitle}>Invite Friend</Text>
                    <TextInput style={styles.input} placeholder="Friend's Email" value={inviteEmail} onChangeText={setInviteEmail} autoCapitalize="none" placeholderTextColor="#888" />
                    <TouchableOpacity 
                        style={[styles.button, {backgroundColor: isInviting ? '#9e9e9e' : '#673ab7'}]} 
                        onPress={handleSendInvite}
                        disabled={isInviting}
                    >
                        {isInviting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Invite</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, {backgroundColor:'#ccc', marginTop:10}]} onPress={() => setShowInviteModal(false)}><Text style={styles.btnText}>Close</Text></TouchableOpacity>
                </View>
            </View>
        </Modal>

        {/* ADD/EDIT EXPENSE MODAL */}
        <Modal visible={showExpenseModal} animationType="slide">
            <SafeAreaView style={styles.modalContainer}>
                <Text style={styles.title}>{editingExpense ? 'Edit Expense' : 'Add Expense'}</Text>
                <ScrollView>
                    <Text style={styles.label}>Title</Text>
                    <TextInput style={styles.input} placeholder="Title" value={expenseForm.title} onChangeText={t => setExpenseForm({...expenseForm, title:t})} placeholderTextColor="#888" />
                    <Text style={styles.label}>Amount</Text>
                    <TextInput style={styles.input} placeholder="Amount" value={expenseForm.amount} onChangeText={t => setExpenseForm({...expenseForm, amount:t})} keyboardType="numeric" placeholderTextColor="#888" />
                    
                    <Text style={styles.label}>Category</Text>
                    <View style={styles.pickerBox}>
                        <Picker selectedValue={expenseForm.category} onValueChange={v => setExpenseForm({...expenseForm, category:v})}>
                            {['Food','Transport','Lodging','Misc','Other'].map(c => <Picker.Item key={c} label={c} value={c} />)}
                        </Picker>
                    </View>

                    <Text style={styles.label}>Paid By</Text>
                    <View style={styles.pickerBox}>
                        <Picker selectedValue={expenseForm.payer} onValueChange={v => setExpenseForm({...expenseForm, payer:v})}>
                            <Picker.Item label="Select Payer" value="" />
                            {participants.map(p => <Picker.Item key={p._id} label={p.name} value={p.name} />)}
                        </Picker>
                    </View>

                    <Text style={styles.label}>Split Method</Text>
                    <View style={{flexDirection:'row', marginBottom:15}}>
                        {['EQUAL','PERCENT','EXACT'].map(type => (
                            <TouchableOpacity key={type} 
                                style={{flex:1, padding:10, backgroundColor: expenseForm.splitType === type ? '#0288d1' : '#eee', alignItems:'center', borderWidth:1, borderColor:'#ddd'}}
                                onPress={() => setExpenseForm({...expenseForm, splitType: type})}
                            >
                                <Text style={{color: expenseForm.splitType === type ? '#fff' : '#333'}}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {expenseForm.splitType === 'EQUAL' && (
                         <View style={{flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:20}}>
                            {participants.map(p => {
                                const isSelected = expenseForm.sharedBy.includes(p.name);
                                return (
                                    <TouchableOpacity key={p._id} onPress={() => toggleShare(p.name)} 
                                        style={[styles.splitChip, isSelected ? {backgroundColor:'#0288d1'} : {backgroundColor:'#eee'}]}>
                                        <Text style={{color: isSelected ? 'white' : '#333'}}>{p.name}</Text>
                                    </TouchableOpacity>
                                )
                            })}
                        </View>
                    )}

                    {(expenseForm.splitType === 'PERCENT' || expenseForm.splitType === 'EXACT') && (
                        <View style={{marginBottom:20}}>
                             {participants.map(p => (
                                 <View key={p._id} style={{flexDirection:'row', alignItems:'center', marginBottom:10}}>
                                     <Text style={{width:80}}>{p.name}</Text>
                                     <TextInput 
                                        style={[styles.input, {flex:1, marginBottom:0}]}
                                        placeholder={expenseForm.splitType === 'PERCENT' ? '%' : '₹'}
                                        value={expenseForm.splitDetails[p.name]?.value || ''}
                                        onChangeText={val => setExpenseForm(prev => ({
                                            ...prev,
                                            splitDetails: { ...prev.splitDetails, [p.name]: { ...prev.splitDetails[p.name], value: val } }
                                        }))}
                                        keyboardType="numeric"
                                     />
                                 </View>
                             ))}
                        </View>
                    )}

                    <TouchableOpacity 
                        style={[styles.button, isSavingExp && {opacity:0.6}]} 
                        onPress={handleSaveExpense}
                        disabled={isSavingExp}
                    >
                        {isSavingExp ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, {backgroundColor:'#ccc', marginTop:10}]} onPress={() => setShowExpenseModal(false)}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
                    <View style={{height:50}} />
                </ScrollView>
            </SafeAreaView>
        </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#e1f5fe', padding: 20 },
  safeArea: { flex: 1, backgroundColor: '#e1f5fe', paddingTop: 30 },
  scrollAuth: { padding: 20, justifyContent: 'center', flexGrow: 1 },
  
  authBox: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 5 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#0288d1', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#b3e5fc', marginBottom: 15, color: '#000' },
  passContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor:'#fff', borderRadius:8, borderWidth:1, borderColor:'#b3e5fc', marginBottom:15 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#b3e5fc', marginBottom: 15, paddingHorizontal: 12 },
  
  button: { backgroundColor: '#0288d1', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkText: { marginTop: 15, textAlign: 'center', color: '#0288d1' },

  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#b3e5fc', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#01579b' },
  backText: { color: '#0288d1', fontSize: 16 },
  content: { padding: 15, marginBottom: 20 },
  
  row: { flexDirection: 'row', gap: 10 },
  smallBtn: { backgroundColor: '#0288d1', padding: 12, borderRadius: 8, justifyContent: 'center' },
  smallBtnText: { color: '#fff', fontWeight: 'bold' },
  actionBtn: { backgroundColor: '#ff9800', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 20 },

  tripCard: { backgroundColor: '#fff', padding: 20, borderRadius: 10, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems:'center', elevation: 2, borderLeftWidth: 5, borderLeftColor: '#0288d1' },
  tripText: { fontSize: 18, fontWeight: '600', color:'#333' },

  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#01579b' },

  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 10 },
  chip: { backgroundColor: '#e1f5fe', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, flexDirection:'row', alignItems:'center' },
  chipText: { color: '#0277bd' },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statBox: { backgroundColor: '#e1f5fe', padding: 10, borderRadius: 8, alignItems: 'center', width: '48%' },
  statNum: { fontSize: 18, fontWeight: 'bold', color: '#01579b' },
  payRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },

  expenseItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' },
  expenseTitle: { fontWeight: 'bold', fontSize: 16, color:'#333' },
  expenseSub: { color: '#777', fontSize: 12 },
  expenseAmount: { fontWeight: 'bold', color: '#0288d1', fontSize: 16 },

  modalContainer: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#e1f5fe' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#fff', padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color:'#0288d1' },
  pickerBox: { borderWidth: 1, borderColor: '#b3e5fc', borderRadius: 8, marginBottom: 15, backgroundColor: '#fff' },
  label: { marginBottom: 5, fontWeight: 'bold', color: '#555' },
  splitChip: { padding: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  
  menuBox: { backgroundColor: '#fff', borderRadius: 8, padding: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  menuItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuText: { fontSize: 16 },
  
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#b3e5fc', marginBottom: 15, paddingHorizontal: 12 },
  
  outlineBtn: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 5,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center'
  }
});