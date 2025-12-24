import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const DateInput = ({ value, onChange, placeholder, onPress }) => (
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

export const PasswordInput = ({ placeholder, value, onChangeText }) => {
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

const styles = StyleSheet.create({
    input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#b3e5fc', marginBottom: 15, color: '#000' },
    passContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor:'#fff', borderRadius:8, borderWidth:1, borderColor:'#b3e5fc', marginBottom:15 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#b3e5fc', marginBottom: 15, paddingHorizontal: 12 },
});