import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import api from '../../services/api';

export default function VerifyEmailScreen({ email, onVerified }) {
  const [otp, setOtp] = useState('');

  const verify = async () => {
    try {
      const res = await api.post('/auth/signup-verify', { email, otp });
      onVerified(res.data.token);
    } catch (err) {
      Alert.alert('Verification Failed', err.response?.data?.msg || 'Invalid OTP');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18 }}>Verify Email</Text>
      <TextInput placeholder="Enter OTP" value={otp} onChangeText={setOtp} />
      <TouchableOpacity onPress={verify}>
        <Text style={{ marginTop: 10 }}>Verify</Text>
      </TouchableOpacity>
    </View>
  );
}
