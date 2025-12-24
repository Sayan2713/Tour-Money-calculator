import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Modal, SafeAreaView, StyleSheet } from 'react-native';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { API_BASE_URL } from '../config';

export default function TripDetailsScreen({ token, trip, onOpenGraphs }) {
    const [participants, setParticipants] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [newParticipantName, setNewParticipantName] = useState('');
    const [isAddingPart, setIsAddingPart] = useState(false);
    
    // Expense Modal
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [isSavingExp, setIsSavingExp] = useState(false);
    const [expenseForm, setExpenseForm] = useState({ 
        title: '', amount: '', payer: '', category: 'Food', 
        splitType: 'EQUAL', sharedBy: [], splitDetails: {} 
    });

    useEffect(() => {
        fetchDetails(true);
        const interval = setInterval(() => { fetchDetails(true); }, 5000); 
        return () => clearInterval(interval);
    }, []);

    const fetchDetails = async (silent = false) => {
        try {
            const pRes = await axios.get(`${API_BASE_URL}/participants/${trip._id}`, { headers: { 'x-auth-token': token } });
            const eRes = await axios.get(`${API_BASE_URL}/expenses/${trip._id}`, { headers: { 'x-auth-token': token } });
            setParticipants(pRes.data);
            setExpenses(eRes.data);
        } catch (err) { if(!silent) console.log(err); }
    };

    const handleAddParticipant = async () => {
        if(!newParticipantName) return;
        setIsAddingPart(true);
        try {
            await axios.post(`${API_BASE_URL}/participants/add`, { name: newParticipantName, tripId: trip._id }, { headers: { 'x-auth-token': token } });
            setNewParticipantName('');
            await fetchDetails(); 
        } catch (err) { Alert.alert("Error", "Failed to add participant"); }
        setIsAddingPart(false);
    };

    const handleDeleteParticipant = (id) => {
        Alert.alert("Delete", "Remove participant?", [
            { text: "Cancel" },
            { text: "Delete", onPress: async () => {
                try { await axios.delete(`${API_BASE_URL}/participants/delete/${id}`, { headers: { 'x-auth-token': token } }); fetchDetails(); } 
                catch (err) { Alert.alert("Error", "Failed to delete"); }
            }}
        ]);
    };

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

    const handleSaveExpense = async () => {
        const totalAmt = parseFloat(expenseForm.amount);
        if(!expenseForm.title || isNaN(totalAmt) || !expenseForm.payer) return Alert.alert("Error", "Invalid inputs");
        
        let payload = {
            title: expenseForm.title, amount: totalAmt, category: expenseForm.category, payer: expenseForm.payer,
            tripId: trip._id, splitType: expenseForm.splitType || 'EQUAL'
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
            payload.splitDetails = details;
        }

        setIsSavingExp(true);
        try {
            if (editingExpense) await axios.put(`${API_BASE_URL}/expenses/update/${editingExpense._id}`, payload, { headers: { 'x-auth-token': token } });
            else await axios.post(`${API_BASE_URL}/expenses/add`, payload, { headers: { 'x-auth-token': token } });
            setShowExpenseModal(false);
            fetchDetails();
        } catch (err) { Alert.alert("Error", "Failed to save expense."); }
        setIsSavingExp(false);
    };

    const handleDeleteExpense = async (id) => {
        Alert.alert("Delete", "Delete expense?", [
            { text: "Cancel" },
            { text: "Delete", style:'destructive', onPress: async () => {
                try { await axios.delete(`${API_BASE_URL}/expenses/delete/${id}`, { headers: { 'x-auth-token': token } }); fetchDetails(); } 
                catch (err) { Alert.alert("Error", "Could not delete"); }
            }}
        ]);
    };

    const toggleShare = (name) => {
        setExpenseForm(prev => {
            const current = prev.sharedBy;
            if (current.includes(name)) return { ...prev, sharedBy: current.filter(n => n !== name) };
            else return { ...prev, sharedBy: [...current, name] };
        });
    };

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
                if (validSharers.length) {
                    const split = e.amount / validSharers.length;
                    validSharers.forEach(pName => { if (pName !== e.payer && pNames.includes(e.payer)) matrix[pName][e.payer] += split; });
                }
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

    return (
        <ScrollView contentContainerStyle={styles.content}>
            <View style={[styles.card, {backgroundColor:'#e3f2fd', flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:10}]}>
                <Text style={{fontSize:20, fontWeight:'bold', color:'#0277bd'}}>{trip.name}</Text>
                <TouchableOpacity onPress={onOpenGraphs} style={{backgroundColor:'#fff', padding:5, borderRadius:5}}>
                    <Text style={{color:'#0277bd', fontSize:12}}>Graphs 📊</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Participants</Text>
                <View style={styles.row}>
                    <TextInput style={[styles.input, {flex:1, marginBottom:0}]} placeholder="Name" value={newParticipantName} onChangeText={setNewParticipantName} placeholderTextColor="#888" />
                    <TouchableOpacity style={[styles.smallBtn, isAddingPart && {opacity:0.6}]} onPress={handleAddParticipant} disabled={isAddingPart}>
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

            {/* EXPENSE MODAL */}
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
                                {['Food','Transport','Lodging','Misc','Other'].map(c => <Picker.Item key={c} label={c} value={c} color="#000" />)}
                            </Picker>
                        </View>

                        <Text style={styles.label}>Paid By</Text>
                        <View style={styles.pickerBox}>
                            <Picker selectedValue={expenseForm.payer} onValueChange={v => setExpenseForm({...expenseForm, payer:v})}>
                                <Picker.Item label="Select Payer" value="" />
                                {participants.map(p => <Picker.Item key={p._id} label={p.name} value={p.name} color="#000" />)}
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
                                        <TouchableOpacity key={p._id} onPress={() => {
                                            const newShared = isSelected ? expenseForm.sharedBy.filter(n => n!==p.name) : [...expenseForm.sharedBy, p.name];
                                            setExpenseForm({...expenseForm, sharedBy: newShared});
                                        }} style={[styles.splitChip, isSelected ? {backgroundColor:'#0288d1'} : {backgroundColor:'#eee'}]}>
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

                        <TouchableOpacity style={[styles.button, isSavingExp && {opacity:0.6}]} onPress={handleSaveExpense} disabled={isSavingExp}>
                            {isSavingExp ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save</Text>}
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, {backgroundColor:'#ccc', marginTop:10}]} onPress={() => setShowExpenseModal(false)}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
                        <View style={{height:50}} />
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: { padding: 15, marginBottom: 20 },
    card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 20, elevation: 2 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#01579b' },
    label: { marginBottom: 5, fontWeight: 'bold', color: '#555' },
    input: { backgroundColor: '#fff', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#b3e5fc', marginBottom: 15, color: '#000' },
    row: { flexDirection: 'row', gap: 10 },
    smallBtn: { backgroundColor: '#0288d1', padding: 12, borderRadius: 8, justifyContent: 'center' },
    smallBtnText: { color: '#fff', fontWeight: 'bold' },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 10 },
    chip: { backgroundColor: '#e1f5fe', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, flexDirection:'row', alignItems:'center' },
    chipText: { color: '#0277bd' },
    actionBtn: { backgroundColor: '#ff9800', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 20 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    statBox: { backgroundColor: '#e1f5fe', padding: 10, borderRadius: 8, alignItems: 'center', width: '48%' },
    statNum: { fontSize: 18, fontWeight: 'bold', color: '#01579b' },
    payRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
    expenseItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#eee' },
    expenseTitle: { fontWeight: 'bold', fontSize: 16, color:'#333' },
    expenseSub: { color: '#777', fontSize: 12 },
    expenseAmount: { fontWeight: 'bold', color: '#0288d1', fontSize: 16 },
    outlineBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    modalContainer: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#e1f5fe' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color:'#0288d1' },
    pickerBox: { borderWidth: 1, borderColor: '#b3e5fc', borderRadius: 8, marginBottom: 15, backgroundColor: '#fff' },
    splitChip: { padding: 10, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
    button: { backgroundColor: '#0288d1', padding: 15, borderRadius: 8, alignItems: 'center' },
});