import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import api from '../../services/api';
import PasswordInput from '../../components/PasswordInput';

export default function SignupScreen({ onSignupSuccess }) {
  const [data, setData] = useState({
    name: '',
    email: '',
    mobile: '',
    dob: '',
    password: '',
    confirmPassword: '',
  });

  const submit = async () => {
    if (data.password !== data.confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match');
    }

    try {
      await api.post('/auth/signup', data);
      Alert.alert('Verify Email', 'OTP sent to your email');
      onSignupSuccess(data.email);
    } catch (err) {
      Alert.alert('Signup Failed', err.response?.data?.msg || 'Error');
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ fontSize: 22, textAlign: 'center' }}>Create Account</Text>

      <TextInput placeholder="Full Name" onChangeText={t => setData({ ...data, name: t })} />
      <TextInput placeholder="Email" autoCapitalize="none" onChangeText={t => setData({ ...data, email: t })} />
      <TextInput placeholder="Mobile" keyboardType="phone-pad" onChangeText={t => setData({ ...data, mobile: t })} />
      <TextInput placeholder="DOB (YYYY-MM-DD)" onChangeText={t => setData({ ...data, dob: t })} />

      <PasswordInput placeholder="Password" value={data.password} onChangeText={t => setData({ ...data, password: t })} />
      <PasswordInput placeholder="Confirm Password" value={data.confirmPassword} onChangeText={t => setData({ ...data, confirmPassword: t })} />

      <TouchableOpacity onPress={submit}>
        <Text style={{ textAlign: 'center', marginTop: 10 }}>Sign Up</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
