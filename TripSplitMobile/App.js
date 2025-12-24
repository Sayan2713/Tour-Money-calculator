import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Linking, Image, SafeAreaView, Dimensions, Platform, StatusBar, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { WEB_URL, API_BASE_URL } from './src/config';

// Import Screens
import AuthScreen from './src/screens/AuthScreen';
import TripListScreen from './src/screens/TripListScreen';
import TripDetailsScreen from './src/screens/TripDetailsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import StaticPage from './src/screens/StaticPage';

// Import Components
import Sidebar from './src/components/Sidebar';
import ChangePasswordModal from './src/components/ChangePasswordModal';

const { width } = Dimensions.get('window');

export default function App() {
  const [token, setToken] = useState(null);
  const [view, setView] = useState('auth'); 
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  // Menu States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChangePassModal, setShowChangePassModal] = useState(false);

  // Persistence
  useEffect(() => {
    const loadSession = async () => {
        const t = await AsyncStorage.getItem('userToken');
        if (t) { setToken(t); fetchUserProfile(t); setView('list'); }
    };
    loadSession();
  }, []);

  // Hardware Back Button Logic
  useEffect(() => {
    const backAction = () => {
      if (sidebarOpen) {
        setSidebarOpen(false);
        return true;
      }
      if (showChangePassModal) {
        setShowChangePassModal(false);
        return true;
      }
      if (view !== 'list' && view !== 'auth') {
        setView('list');
        setSelectedTrip(null);
        return true;
      }
      return false; // Default (Exit App)
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [view, sidebarOpen, showChangePassModal]);

  const fetchUserProfile = async (t) => {
      try {
          const res = await axios.get(`${API_BASE_URL}/users`, { headers: { 'x-auth-token': t } });
          setUserProfile(res.data);
      } catch (err) { console.log("Profile error", err); }
  };

  const logout = async () => {
      setToken(null);
      await AsyncStorage.removeItem('userToken');
      setView('auth');
      setSidebarOpen(false);
  };

  const navigate = (screen) => {
      if (screen === 'graphs' || screen === 'upgrade') {
          const path = screen === 'graphs' ? 'graphs' : 'subscription';
          Alert.alert(
              "Open Website", 
              `View ${screen} on web?`, 
              [
                  { text: "Cancel", style: "cancel" },
                  { text: "Open", onPress: () => Linking.openURL(`${WEB_URL}/${path}`) }
              ]
          );
      } else {
          setSidebarOpen(false);
          setView(screen);
      }
  };

  if (!token) return <AuthScreen onLogin={(t) => { setToken(t); fetchUserProfile(t); setView('list'); }} />;

  return (
    <SafeAreaView style={styles.safeArea}>
        {/* ✅ FIX: Status Bar Visibility */}
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />

        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => setSidebarOpen(true)}>
                {userProfile?.profilePicture ? (
                    <Image source={{uri: userProfile.profilePicture}} style={{width:35, height:35, borderRadius:20}} />
                ) : (
                    <View style={{width:35, height:35, borderRadius:20, backgroundColor:'#ccc', justifyContent:'center', alignItems:'center'}}>
                        {/* ✅ FIX: Profile Initial */}
                        <Text style={{color:'#fff', fontWeight:'bold', fontSize: 18}}>
                            {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
            <Text style={styles.headerTitle}>TripSplit</Text>
            <View style={{width:35}}>
                {view !== 'list' && (
                    <TouchableOpacity onPress={() => setView('list')}>
                        <Ionicons name="home" size={24} color="#0288d1" />
                    </TouchableOpacity>
                )}
            </View>
        </View>

        <Sidebar 
            visible={sidebarOpen} 
            onClose={() => setSidebarOpen(false)} 
            userProfile={userProfile} 
            onNavigate={navigate} 
            onLogout={logout}
            onChangePassword={() => { 
                setSidebarOpen(false); 
                setShowChangePassModal(true); 
            }} 
        />

        <ChangePasswordModal 
            visible={showChangePassModal} 
            onClose={() => setShowChangePassModal(false)} 
            token={token} 
        />

        {/* Screens */}
        {view === 'list' && <TripListScreen token={token} onSelectTrip={(t) => { setSelectedTrip(t); setView('details'); }} />}
        {view === 'details' && selectedTrip && <TripDetailsScreen token={token} trip={selectedTrip} onOpenGraphs={() => navigate('graphs')} />}
        {view === 'profile' && <ProfileScreen token={token} userProfile={userProfile} onUpdate={() => fetchUserProfile(token)} onLogout={logout} />} 
        {['about','contact','howto','terms','copyright'].includes(view) && <StaticPage type={view} />}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#f5f5f5', 
        // ✅ FIX: This forces the app content to start BELOW the status bar on Android
        // On iOS, SafeAreaView handles this automatically.
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems:'center', 
        padding: 15, 
        backgroundColor: '#fff', 
        elevation: 3,
        // Optional: Add a small border for visual separation
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#0288d1' },
});