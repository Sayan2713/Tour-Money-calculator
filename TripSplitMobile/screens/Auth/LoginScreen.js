import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import axios from 'axios';
import PasswordInput from '../../components/PasswordInput';

const API_BASE_URL = 'https://tripsplit-api.onrender.com';

export default function LoginScreen({
  onLoginSuccess,
  onOpenSignup,
  onOpenForgot
}) {
  const [loading, setLoading] = useState(false);
  const [authData, setAuthData] = useState({
    email: '',
    password: ''
  });

  const handleLogin = async () => {
    if (!authData.email || !authData.password) {
      return Alert.alert('Error', 'Email and password required');
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/auth/login`,
        authData
      );

      if (res.data.token) {
        onLoginSuccess(res.data.token);
      }
    } catch (err) {
      Alert.alert(
        'Login Failed',
        err.response?.data?.msg || 'Invalid credentials'
      );
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20, flexGrow: 1, justifyContent: 'center' }}>
      <Text style={{ fontSize: 26, fontWeight: 'bold', textAlign: 'center' }}>
        TripSplit
      </Text>

      <Text style={{ fontSize: 18, textAlign: 'center', marginBottom: 20 }}>
        Login
      </Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        value={authData.email}
        onChangeText={t => setAuthData({ ...authData, email: t })}
        style={{ marginBottom: 15 }}
      />

      <PasswordInput
        placeholder="Password"
        value={authData.password}
        onChangeText={t => setAuthData({ ...authData, password: t })}
      />

      <TouchableOpacity onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={{ textAlign: 'center', marginVertical: 10 }}>
            Login
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={onOpenForgot}>
        <Text style={{ textAlign: 'center', marginTop: 10 }}>
          Forgot Password?
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onOpenSignup}>
        <Text style={{ textAlign: 'center', marginTop: 10 }}>
          Create Account
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
