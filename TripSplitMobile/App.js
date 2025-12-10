import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Modal, ActivityIndicator, SafeAreaView, Image, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker'; 

// 🌍 LIVE BACKEND URL
const API_BASE_URL = 'https://tripsplit-api.onrender.com'; 

// --- HELPER COMPONENTS (Moved OUTSIDE App to fix keyboard focus) ---

const DateInput = ({ value, onChange, placeholder, onPress }) => (
    <View style={styles.inputContainer}>
        <TextInput 
            style={[styles.input, {marginBottom:0, flex:1, borderWidth:0}]} 
            placeholder={placeholder} 
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
                style={[styles.input, {flex:1, marginBottom:0, borderWidth:0}]} 
                placeholder={placeholder} 
                value={value} 
                onChangeText={onChangeText} 
                secureTextEntry={!visible} 
            />
            <TouchableOpacity onPress={() => setVisible(!visible)} style={{padding:10}}>
                <Text>{visible ? '👁️' : '🔒'}</Text>
            </TouchableOpacity>
        </View>
    )
}

export default function App() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('auth'); // auth, list, details
  
  // --- AUTH STATE ---
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [authData, setAuthData] = useState({ email: '', password: '', confirmPassword: '', name: '', mobile: '', dob: '' });
  
  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); 
  const [forgotData, setForgotData] = useState({ email: '', dob: '', otp: '', newPassword: '', confirmPassword: '' });

  // Signup Verification State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState('');

  // --- APP DATA ---
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  
  // --- MENU & PROFILE STATE ---
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false); 
  const [editProfileData, setEditProfileData] = useState({}); 
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [passData, setPassData] = useState({ oldPassword: '', newPassword: '' });

  // --- FORMS ---
  const [newTripName, setNewTripName] = useState('');
  const [newParticipantName, setNewParticipantName] = useState('');
  
  // Expense Form
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', payer: '', category: 'Food', sharedBy: [] });
  
  // Invite Form
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteTrip, setInviteTrip] = useState(null);

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState(''); 

  // ------------------------------------------------------------------
  // 1. AUTHENTICATION
  // ------------------------------------------------------------------
  const handleAuth = async () => {
    if (!isLoginMode && authData.password !== authData.confirmPassword) {
        return Alert.alert("Error", "Passwords do not match");
    }

    setLoading(true);
    const url = isLoginMode ? '/auth/login' : '/auth/signup';
    try {
      const res = await axios.post(`${API_BASE_URL}${url}`, authData);
      
      if (isLoginMode) {
        if (res.data.token) {
          setToken(res.data.token);
          fetchTrips(res.data.token);
          fetchUserProfile(res.data.token);
          setView('list');
        }
      } else {
        Alert.alert("Verify Email", "OTP sent to your email.");
        setShowVerifyModal(true); 
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.msg || "Authentication failed");
    }
    setLoading(false);
  };

  const handleVerifySignup = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/signup-verify`, {
        email: authData.email,
        otp: verifyOtp
      });
      setShowVerifyModal(false);
      setToken(res.data.token);
      fetchTrips(res.data.token);
      fetchUserProfile(res.data.token);
      setView('list');
      Alert.alert("Success", "Account verified!");
    } catch (error) {
      Alert.alert("Error", error.response?.data?.msg || "Verification failed");
    }
  };

  const logout = () => {
    setToken(null);
    setView('auth');
    setTrips([]);
    setSelectedTrip(null);
    setShowProfileMenu(false);
  };

  // ------------------------------------------------------------------
  // 4. FORGOT PASSWORD FLOW
  // ------------------------------------------------------------------
  const handleOpenForgot = () => {
      setForgotData({ email: '', dob: '', otp: '', newPassword: '', confirmPassword: '' });
      setForgotStep(1);
      setShowForgotModal(true);
  };

  const handleForgotStep1 = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-init`, { email: forgotData.email, dob: forgotData.dob });
      setForgotStep(2);
      Alert.alert("OTP Sent", "Check your email.");
    } catch (err) { Alert.alert("Error", err.response?.data?.msg || "Failed"); }
  };
  const handleForgotStep2 = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-verify`, { email: forgotData.email, otp: forgotData.otp });
      setForgotStep(3);
    } catch (err) { Alert.alert("Error", err.response?.data?.msg || "Invalid OTP"); }
  };
  const handleForgotStep3 = async () => {
    if (forgotData.newPassword !== forgotData.confirmPassword) {
        Alert.alert("Error", "Passwords do not match"); return;
    }
    try {
      await axios.post(`${API_BASE_URL}/auth/forgot-reset`, { email: forgotData.email, otp: forgotData.otp, newPassword: forgotData.newPassword });
      setShowForgotModal(false); setForgotStep(1);
      Alert.alert("Success", "Password reset! Please login.");
    } catch (err) { Alert.alert("Error", "Reset failed"); }
  };

  // ------------------------------------------------------------------
  // 3. PROFILE MANAGEMENT
  // ------------------------------------------------------------------
  const fetchUserProfile = async (authToken) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/users`, { headers: { 'x-auth-token': authToken || token } });
      setUserProfile(res.data);
    } catch (err) { console.log("Profile fetch error", err); }
  };

  const handleChangePassword = async () => {
    try {
      await axios.post(`${API_BASE_URL}/users/change-password`, passData, { headers: { 'x-auth-token': token } });
      Alert.alert("Success", "Password updated!");
      setShowChangePassModal(false);
      setPassData({ oldPassword: '', newPassword: '' });
    } catch (err) { Alert.alert("Error", err.response?.data?.msg || "Failed"); }
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

  const handleSaveProfile = async () => {
      try {
          await axios.put(`${API_BASE_URL}/users/update`, editProfileData, { headers: { 'x-auth-token': token } });
          fetchUserProfile(token);
          setShowEditProfileModal(false);
          Alert.alert("Success", "Profile Updated");
      } catch (err) { Alert.alert("Error", "Failed to update profile"); }
  };

  // ------------------------------------------------------------------
  // 2. DATA & POLLING (FIXED)
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!token || !selectedTrip) return;
    const interval = setInterval(() => {
       fetchDetails(selectedTrip, true); // Silent refresh
    }, 5000); 
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
        setLoading(true);
        setView('details'); 
        setSelectedTrip(trip);
        
        // --- FIX: Clear old data immediately ---
        setParticipants([]);
        setExpenses([]);
    }

    try {
      const pRes = await axios.get(`${API_BASE_URL}/participants/${trip._id}`, { headers: { 'x-auth-token': token } });
      const eRes = await axios.get(`${API_BASE_URL}/expenses/${trip._id}`, { headers: { 'x-auth-token': token } });
      
      setParticipants(pRes.data);
      setExpenses(eRes.data);
    } catch (err) { if (!silent) Alert.alert("Error", "Could not load trip details"); }
    
    if (!silent) setLoading(false);
  };

  // ------------------------------------------------------------------
  // ACTIONS
  // ------------------------------------------------------------------
  const handleAddTrip = async () => {
    if(!newTripName) return;
    try {
      await axios.post(`${API_BASE_URL}/trips/add`, { name: newTripName }, { headers: { 'x-auth-token': token } });
      setNewTripName('');
      fetchTrips(token);
    } catch (err) { Alert.alert("Error", "Failed to add trip"); }
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

  const handleSendInvite = async () => {
      if(!inviteEmail) return;
      try {
          await axios.post(`${API_BASE_URL}/invitations/send`, { email: inviteEmail, tripId: inviteTrip._id }, { headers: { 'x-auth-token': token } });
          Alert.alert("Success", "Invitation sent!");
          setShowInviteModal(false);
          setInviteEmail('');
      } catch (err) { Alert.alert("Error", err.response?.data?.msg || "Failed to send invite"); }
  }

  const handleAddParticipant = async () => {
    if(!newParticipantName) return;
    try {
      await axios.post(`${API_BASE_URL}/participants/add`, 
        { name: newParticipantName, tripId: selectedTrip._id }, 
        { headers: { 'x-auth-token': token } }
      );
      setNewParticipantName('');
      fetchDetails(selectedTrip, true); 
    } catch (err) { Alert.alert("Error", "Failed to add participant"); }
  };

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

  // FIX #1: Separated Save Logic from Refresh Logic
  const handleSaveExpense = async () => {
    if(!expenseForm.title || !expenseForm.amount || !expenseForm.payer || expenseForm.sharedBy.length === 0) {
        return Alert.alert("Missing Fields", "Please fill all fields and select at least one person to share.");
    }
    
    const payload = {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        tripId: selectedTrip._id
    };

    let saveSuccess = false;

    // 1. Attempt Save
    try {
      if (editingExpense) {
          await axios.put(`${API_BASE_URL}/expenses/update/${editingExpense._id}`, payload, { headers: { 'x-auth-token': token } });
      } else {
          await axios.post(`${API_BASE_URL}/expenses/add`, payload, { headers: { 'x-auth-token': token } });
      }
      saveSuccess = true;
    } catch (err) { 
        Alert.alert("Error", "Failed to save expense. Please try again."); 
        return; // Stop here if save failed
    }

    // 2. If Save Successful, Update UI and Refresh
    if (saveSuccess) {
      setShowExpenseModal(false);
      setEditingExpense(null);
      setExpenseTitle('');
      setExpenseAmount('');
      
      // Try refresh silently - errors here won't trigger an alert
      try {
        await fetchDetails(selectedTrip, true); 
      } catch (e) { console.log("Silent refresh failed"); }
    }
  };

  const openExpenseModal = (expense = null) => {
      if (expense) {
          setEditingExpense(expense);
          setExpenseForm({
              title: expense.title,
              amount: expense.amount.toString(),
              payer: expense.payer,
              category: expense.category,
              sharedBy: expense.sharedBy
          });
      } else {
          setEditingExpense(null);
          setExpenseForm({
              title: '', amount: '', payer: '', category: 'Food', 
              sharedBy: participants.map(p => p.name)
          });
      }
      setShowExpenseModal(true);
  };

  const toggleShare = (name) => {
      setExpenseForm(prev => {
          const current = prev.sharedBy;
          if (current.includes(name)) {
              return { ...prev, sharedBy: current.filter(n => n !== name) };
          } else {
              return { ...prev, sharedBy: [...current, name] };
          }
      });
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

  // ------------------------------------------------------------------
  // UI HELPERS & DATE PICKER
  // ------------------------------------------------------------------
  
  const openDatePicker = (field) => {
      setDateField(field); 
      setShowDatePicker(true); 
  };

  const handleDateChange = (event, selectedDate) => {
      setShowDatePicker(false);
      if (selectedDate) {
          const dateStr = selectedDate.toISOString().split('T')[0];
          if (dateField === 'dob') setAuthData({...authData, dob: dateStr});
          if (dateField === 'forgotDob') setForgotData({...forgotData, dob: dateStr});
          if (dateField === 'editDob') setEditProfileData({...editProfileData, dob: dateStr});
      }
  };

  // --- CALCULATION LOGIC ---
  const settlement = useMemo(() => {
    if (!participants.length || !expenses.length) return { netPayments: [], totalSpent: 0 };
    
    const pNames = participants.map(p => p.name);
    const matrix = {};
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    pNames.forEach(p => { matrix[p] = {}; pNames.forEach(q => matrix[p][q] = 0); });

    expenses.forEach(e => {
        const validSharers = e.sharedBy.filter(n => pNames.includes(n));
        if (!validSharers.length) return;
        const split = e.amount / validSharers.length;
        validSharers.forEach(pName => {
            if (pName !== e.payer && pNames.includes(e.payer)) matrix[pName][e.payer] += split;
        });
    });
    
    const netPayments = [];
    const seen = new Set();
    pNames.forEach(p => {
        pNames.forEach(q => {
            if (p === q) return;
            const net = matrix[p][q] - matrix[q][p];
            const key = [p, q].sort().join('-');
            if (net > 0.01 && !seen.has(key)) { 
                netPayments.push({ from: p, to: q, amount: net });
                seen.add(key);
            } else if (net < -0.01 && !seen.has(key)) {
                netPayments.push({ from: q, to: p, amount: -net });
                seen.add(key);
            }
        });
    });
    return { netPayments, totalSpent };
  }, [expenses, participants]);


  // ------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------

  if (!token) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollAuth} keyboardShouldPersistTaps="handled">
          <View style={styles.authBox}>
            <Text style={styles.title}>TripSplit</Text>
            <Text style={styles.subtitle}>{isLoginMode ? 'Login' : 'Create Account'}</Text>
            
            <TextInput style={styles.input} placeholder="Email" value={authData.email} onChangeText={t => setAuthData({...authData, email:t})} autoCapitalize="none" />
            
            {/* Login Mode: Only Email & Pass */}
            {isLoginMode ? (
                <PasswordInput placeholder="Password" value={authData.password} onChangeText={t => setAuthData({...authData, password:t})} />
            ) : (
                // Signup Mode: Ordered Correctly with Labels
                <>
                  <Text style={styles.label}>Full Name</Text>
                  <TextInput style={styles.input} placeholder="Full Name" value={authData.name} onChangeText={t => setAuthData({...authData, name:t})} />
                  
                  <Text style={styles.label}>Mobile</Text>
                  <TextInput style={styles.input} placeholder="Mobile" value={authData.mobile} onChangeText={t => setAuthData({...authData, mobile:t})} keyboardType="phone-pad" />
                  
                  <Text style={styles.label}>Date of Birth</Text>
                  <DateInput value={authData.dob} onChange={t => setAuthData({...authData, dob:t})} placeholder="YYYY-MM-DD" onPress={() => openDatePicker('dob')} />

                  <Text style={styles.label}>Password</Text>
                  <PasswordInput placeholder="Password" value={authData.password} onChangeText={t => setAuthData({...authData, password:t})} />
                  
                  <Text style={styles.label}>Confirm Password</Text>
                  <PasswordInput placeholder="Confirm Password" value={authData.confirmPassword} onChangeText={t => setAuthData({...authData, confirmPassword:t})} />
                </>
            )}

            <View style={{height:20}} />
            <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{isLoginMode ? 'Login' : 'Sign Up'}</Text>}
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

        {/* FORGOT PASSWORD MODAL */}
        <Modal visible={showForgotModal} animationType="slide">
           <SafeAreaView style={styles.modalContainer}>
              <Text style={styles.title}>Forgot Password</Text>
              {forgotStep === 1 && (
                  <>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput style={styles.input} placeholder="Email" value={forgotData.email} onChangeText={t => setForgotData({...forgotData, email:t})} />
                    
                    <Text style={styles.label}>Date of Birth</Text>
                    <DateInput value={forgotData.dob} onChange={t => setForgotData({...forgotData, dob:t})} placeholder="DOB (YYYY-MM-DD)" onPress={() => openDatePicker('forgotDob')} />
                    
                    <View style={{height:10}} />
                    <TouchableOpacity style={styles.button} onPress={handleForgotStep1}><Text style={styles.btnText}>Next</Text></TouchableOpacity>
                  </>
              )}
              {forgotStep === 2 && (
                  <>
                     <Text style={styles.label}>Enter OTP</Text>
                     <TextInput style={styles.input} placeholder="Enter OTP" value={forgotData.otp} onChangeText={t => setForgotData({...forgotData, otp:t})} />
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

        {/* VERIFY SIGNUP MODAL */}
        <Modal visible={showVerifyModal} animationType="slide">
           <SafeAreaView style={styles.modalContainer}>
              <Text style={styles.title}>Verify Email</Text>
              <Text style={{marginBottom:20, textAlign:'center'}}>Enter the OTP sent to {authData.email}</Text>
              <TextInput style={styles.input} placeholder="OTP" value={verifyOtp} onChangeText={setVerifyOtp} />
              <TouchableOpacity style={styles.button} onPress={handleVerifySignup}><Text style={styles.btnText}>Verify & Login</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.button, {backgroundColor:'#ccc', marginTop:10}]} onPress={() => setShowVerifyModal(false)}>
                 <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
           </SafeAreaView>
        </Modal>
        
        {/* REAL DATE PICKER */}
        {showDatePicker && (
              <DateTimePicker 
                  value={new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
              />
          )}
      </View>
    );
  }

  // --- LOGGED IN VIEW ---
  return (
    <SafeAreaView style={styles.safeArea}>
        
        {/* HEADER */}
        <View style={styles.header}>
            {view === 'details' ? (
                <TouchableOpacity onPress={() => setView('list')}><Text style={styles.backText}>← Back</Text></TouchableOpacity>
            ) : (
                <Text style={styles.headerTitle}>TripSplit</Text>
            )}
            
            {/* PROFILE BUTTON */}
            <TouchableOpacity onPress={() => setShowProfileMenu(true)}>
                 {userProfile?.profilePicture ? (
                     <Image source={{uri: userProfile.profilePicture}} style={{width:35, height:35, borderRadius:20}} />
                 ) : (
                    <View style={{width:35, height:35, borderRadius:20, backgroundColor:'#ccc', justifyContent:'center', alignItems:'center'}}>
                        <Text style={{color:'#fff', fontWeight:'bold'}}>U</Text>
                    </View>
                 )}
            </TouchableOpacity>
        </View>

        {/* PROFILE DROPDOWN MODAL */}
        <Modal visible={showProfileMenu} transparent animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowProfileMenu(false)}>
                <View style={[styles.menuBox, {top: 60, right: 10, position:'absolute'}]}>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { setShowProfileMenu(false); setShowProfileModal(true); }}>
                        <Text>Your Profile</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => { setShowProfileMenu(false); setShowChangePassModal(true); }}>
                        <Text>Change Password</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={logout}>
                        <Text style={{color:'red'}}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>

        {/* PROFILE DETAILS MODAL */}
        <Modal visible={showProfileModal} animationType="slide">
           <SafeAreaView style={styles.modalContainer}>
               <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
                   <TouchableOpacity onPress={() => setShowProfileModal(false)}><Text style={{fontSize:18, color:'#006b74'}}>← Back</Text></TouchableOpacity>
                   <Text style={styles.title}>My Profile</Text>
                   <View style={{width:40}} />
               </View>
               
               <View style={styles.card}>
                   <View style={{alignItems:'center', marginBottom:20}}>
                       {userProfile?.profilePicture ? (
                          <Image source={{uri: userProfile.profilePicture}} style={{width:100, height:100, borderRadius:50}} />
                       ) : (
                          <View style={{width:100, height:100, borderRadius:50, backgroundColor:'#ccc', justifyContent:'center', alignItems:'center'}}>
                              <Text style={{fontSize:40, color:'white'}}>U</Text>
                          </View>
                       )}
                   </View>
                   <Text style={styles.label}>Name: <Text style={{fontWeight:'normal'}}>{userProfile?.name}</Text></Text>
                   <Text style={styles.label}>Email: <Text style={{fontWeight:'normal'}}>{userProfile?.email}</Text></Text>
                   <Text style={styles.label}>Mobile: <Text style={{fontWeight:'normal'}}>{userProfile?.mobile}</Text></Text>
                   <Text style={styles.label}>DOB: <Text style={{fontWeight:'normal'}}>{userProfile?.dob ? new Date(userProfile.dob).toLocaleDateString() : ''}</Text></Text>
                   <Text style={styles.label}>Gender: <Text style={{fontWeight:'normal'}}>{userProfile?.gender}</Text></Text>
               </View>

               <TouchableOpacity style={[styles.button, {backgroundColor:'#006b74', marginTop:20}]} onPress={() => {setShowProfileModal(false); handleEditProfile();}}>
                   <Text style={styles.btnText}>Edit Profile</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.button, {backgroundColor:'#d32f2f', marginTop:10}]} onPress={handleDeleteAccount}>
                   <Text style={styles.btnText}>Delete Account</Text>
               </TouchableOpacity>
           </SafeAreaView>
        </Modal>

        {/* EDIT PROFILE MODAL */}
        <Modal visible={showEditProfileModal} animationType="slide">
            <SafeAreaView style={styles.modalContainer}>
                <Text style={styles.title}>Edit Profile</Text>
                <TextInput style={styles.input} placeholder="Name" value={editProfileData.name} onChangeText={t => setEditProfileData({...editProfileData, name:t})} />
                <TextInput style={styles.input} placeholder="Mobile" value={editProfileData.mobile} onChangeText={t => setEditProfileData({...editProfileData, mobile:t})} keyboardType="phone-pad" />
                <DateInput value={editProfileData.dob} onChange={t => setEditProfileData({...editProfileData, dob:t})} placeholder="DOB (YYYY-MM-DD)" onPress={() => openDatePicker('editDob')} />
                <View style={styles.pickerBox}>
                    <Picker selectedValue={editProfileData.gender} onValueChange={v => setEditProfileData({...editProfileData, gender:v})}>
                        <Picker.Item label="Select Gender" value="" />
                        <Picker.Item label="Male" value="Male" />
                        <Picker.Item label="Female" value="Female" />
                        <Picker.Item label="Other" value="Other" />
                    </Picker>
                </View>
                {/* Note: Image upload requires extra libraries in RN, sticking to text/data for now */}
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
                        <TextInput style={[styles.input, {flex:1, marginBottom:0}]} placeholder="New Trip Name" value={newTripName} onChangeText={setNewTripName} />
                        <TouchableOpacity style={styles.smallBtn} onPress={handleAddTrip}><Text style={styles.smallBtnText}>Create</Text></TouchableOpacity>
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
                    {/* Header showing trip name */}
                    <View style={[styles.card, {backgroundColor:'#e3f2fd', alignItems:'center', padding:10}]}>
                       <Text style={{fontSize:20, fontWeight:'bold', color:'#0277bd'}}>Current Trip: {selectedTrip.name}</Text>
                    </View>

                    {/* Participants */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Participants</Text>
                        <View style={styles.row}>
                            <TextInput style={[styles.input, {flex:1, marginBottom:0}]} placeholder="Name" value={newParticipantName} onChangeText={setNewParticipantName} />
                            <TouchableOpacity style={styles.smallBtn} onPress={handleAddParticipant}><Text style={styles.smallBtnText}>Add</Text></TouchableOpacity>
                        </View>
                        <View style={styles.chipContainer}>
                            {participants.map(p => ( 
                                <View key={p._id} style={styles.chip}>
                                    <Text style={styles.chipText}>{p.name}</Text>
                                    {/* FIX: Added Delete Button for Participant */}
                                    <TouchableOpacity onPress={() => handleDeleteParticipant(p._id)} style={{marginLeft: 8, padding: 2}}>
                                        <Text style={{color: '#d32f2f', fontWeight: 'bold'}}>✕</Text>
                                    </TouchableOpacity>
                                </View> 
                            ))}
                        </View>
                    </View>

                    {/* Add Expense Button */}
                    <TouchableOpacity style={styles.actionBtn} onPress={() => openExpenseModal()}>
                        <Text style={styles.btnText}>+ Add Expense</Text>
                    </TouchableOpacity>

                    {/* Settlement */}
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

                    {/* Expense Log */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Expense Log</Text>
                        {expenses.map(e => (
                            <View key={e._id} style={styles.expenseItem}>
                                <View style={{flex:1}}>
                                    <Text style={styles.expenseTitle}>{e.title}</Text>
                                    <Text style={styles.expenseSub}>{e.payer} paid for {e.sharedBy.join(', ')}</Text>
                                </View>
                                <View style={{alignItems:'flex-end'}}>
                                    <Text style={styles.expenseAmount}>₹{e.amount}</Text>
                                    <View style={{flexDirection:'row', gap:15, marginTop: 5}}>
                                        <TouchableOpacity 
                                            onPress={() => openExpenseModal(e)}
                                            style={[styles.outlineBtn, {borderColor:'#fbc02d'}]}
                                        >
                                            <Text style={{color:'#fbc02d', fontWeight:'bold', fontSize:12}}>Edit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            onPress={() => handleDeleteExpense(e._id)}
                                            style={[styles.outlineBtn, {borderColor:'#d32f2f'}]}
                                        >
                                            <Text style={{color:'#d32f2f', fontWeight:'bold', fontSize:12}}>Delete</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </>
            )}
        </ScrollView>

        {/* INVITE MODAL */}
        <Modal visible={showInviteModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                    <Text style={styles.modalTitle}>Invite Friend</Text>
                    <TextInput style={styles.input} placeholder="Friend's Email" value={inviteEmail} onChangeText={setInviteEmail} autoCapitalize="none" />
                    <TouchableOpacity style={[styles.button, {backgroundColor:'#673ab7'}]} onPress={handleSendInvite}><Text style={styles.btnText}>Send Invite</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.button, {backgroundColor:'#ccc', marginTop:10}]} onPress={() => setShowInviteModal(false)}><Text style={styles.btnText}>Close</Text></TouchableOpacity>
                </View>
            </View>
        </Modal>

        {/* ADD/EDIT EXPENSE MODAL */}
        <Modal visible={showExpenseModal} animationType="slide">
            <SafeAreaView style={styles.modalContainer}>
                <Text style={styles.title}>{editingExpense ? 'Edit Expense' : 'Add Expense'}</Text>
                
                <TextInput style={styles.input} placeholder="Title" value={expenseForm.title} onChangeText={t => setExpenseForm({...expenseForm, title:t})} />
                <TextInput style={styles.input} placeholder="Amount" value={expenseForm.amount} onChangeText={t => setExpenseForm({...expenseForm, amount:t})} keyboardType="numeric" />
                
                <Text style={styles.label}>Category</Text>
                <View style={styles.pickerBox}>
                    <Picker selectedValue={expenseForm.category} onValueChange={v => setExpenseForm({...expenseForm, category:v})}>
                        {['Food','Transport','Lodging','Misc'].map(c => <Picker.Item key={c} label={c} value={c} />)}
                    </Picker>
                </View>

                <Text style={styles.label}>Paid By</Text>
                <View style={styles.pickerBox}>
                    <Picker selectedValue={expenseForm.payer} onValueChange={v => setExpenseForm({...expenseForm, payer:v})}>
                        <Picker.Item label="Select Payer" value="" />
                        {participants.map(p => <Picker.Item key={p._id} label={p.name} value={p.name} />)}
                    </Picker>
                </View>

                <Text style={styles.label}>Split Between (Tap to select)</Text>
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

                <TouchableOpacity style={styles.button} onPress={handleSaveExpense}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.button, {backgroundColor:'#ccc', marginTop:10}]} onPress={() => setShowExpenseModal(false)}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
            </SafeAreaView>
        </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#e1f5fe', padding: 20 }, // Light Blue Bg
  safeArea: { flex: 1, backgroundColor: '#e1f5fe', paddingTop: 30 },
  scrollAuth: { padding: 20, justifyContent: 'center', flexGrow: 1 },
  
  authBox: { backgroundColor: '#fff', padding: 20, borderRadius: 15, elevation: 5 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#0288d1', textAlign: 'center', marginBottom: 5 }, // Sky Blue
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
  input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#b3e5fc', marginBottom: 15 },
  passContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor:'#fff', borderRadius:8, borderWidth:1, borderColor:'#b3e5fc', marginBottom:15 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#b3e5fc', marginBottom: 15, paddingHorizontal: 12 },
  button: { backgroundColor: '#0288d1', padding: 15, borderRadius: 8, alignItems: 'center' }, // Sky Blue
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkText: { marginTop: 15, textAlign: 'center', color: '#0288d1' },

  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#b3e5fc', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#01579b' },
  backText: { color: '#0288d1', fontSize: 16 },
  content: { padding: 15, marginBottom: 20 },
  
  row: { flexDirection: 'row', gap: 10 },
  smallBtn: { backgroundColor: '#0288d1', padding: 12, borderRadius: 8, justifyContent: 'center' },
  smallBtnText: { color: '#fff', fontWeight: 'bold' },
  actionBtn: { backgroundColor: '#ff9800', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 20 }, // Sunrise Orange

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
  menuItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#b3e5fc', marginBottom: 15, paddingHorizontal: 12 },
  
  // New style for outlined buttons
  outlineBtn: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 5,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center'
  }
});