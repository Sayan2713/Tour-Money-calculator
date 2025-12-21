import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import api from '../../services/api';
import PasswordInput from '../../components/PasswordInput';

export default function ForgotPasswordScreen({ onDone }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    email: '',
    dob: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });

  const next = async () => {
    try {
      if (step === 1) {
        await api.post('/auth/forgot-init', data);
        setStep(2);
      } else if (step === 2) {
        await api.post('/auth/forgot-verify', data);
        setStep(3);
      } else {
        if (data.newPassword !== data.confirmPassword) {
          return Alert.alert('Error', 'Passwords do not match');
        }
        await api.post('/auth/forgot-reset', data);
        Alert.alert('Success', 'Password reset');
        onDone();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.msg || 'Failed');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {step === 1 && (
        <>
          <TextInput placeholder="Email" onChangeText={t => setData({ ...data, email: t })} />
          <TextInput placeholder="DOB (YYYY-MM-DD)" onChangeText={t => setData({ ...data, dob: t })} />
        </>
      )}

      {step === 2 && (
        <TextInput placeholder="OTP" onChangeText={t => setData({ ...data, otp: t })} />
      )}

      {step === 3 && (
        <>
          <PasswordInput placeholder="New Password" value={data.newPassword} onChangeText={t => setData({ ...data, newPassword: t })} />
          <PasswordInput placeholder="Confirm Password" value={data.confirmPassword} onChangeText={t => setData({ ...data, confirmPassword: t })} />
        </>
      )}

      <TouchableOpacity onPress={next}>
        <Text style={{ marginTop: 10 }}>Next</Text>
      </TouchableOpacity>
    </View>
  );
}
