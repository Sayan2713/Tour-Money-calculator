import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import api from '../../services/api';

export default function TripDetailsScreen({ trip, onBack }) {
  const [participants, setParticipants] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [newParticipant, setNewParticipant] = useState('');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [payer, setPayer] = useState('');
  const [sharedBy, setSharedBy] = useState([]);

  // ---------------- LOAD DATA ----------------
  const loadData = async () => {
    try {
      const pRes = await api.get(`/participants/${trip._id}`);
      const eRes = await api.get(`/expenses/${trip._id}`);

      setParticipants(pRes.data || []);
      setExpenses(eRes.data || []);
    } catch {
      Alert.alert('Error', 'Failed to load trip data');
    }
  };

  useEffect(() => {
    loadData();

    // IMPORTANT: reset state on trip change
    return () => {
      setParticipants([]);
      setExpenses([]);
      setSharedBy([]);
    };
  }, [trip._id]);

  // ---------------- PARTICIPANTS ----------------
  const addParticipant = async () => {
    if (!newParticipant.trim()) return;
    await api.post('/participants/add', {
      name: newParticipant,
      tripId: trip._id
    });
    setNewParticipant('');
    loadData();
  };

  const deleteParticipant = (id) => {
    Alert.alert('Remove participant?', '', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          await api.delete(`/participants/delete/${id}`);
          loadData();
        }
      }
    ]);
  };

  // ---------------- EXPENSES ----------------
  const toggleShare = (name) => {
    setSharedBy(prev =>
      prev.includes(name)
        ? prev.filter(n => n !== name)
        : [...prev, name]
    );
  };

  const addExpense = async () => {
    if (!expenseTitle || !expenseAmount || !payer || sharedBy.length === 0) {
      return Alert.alert('Fill all fields');
    }

    await api.post('/expenses/add', {
      title: expenseTitle,
      amount: Number(expenseAmount),
      payer,
      sharedBy,
      tripId: trip._id
    });

    setExpenseTitle('');
    setExpenseAmount('');
    setPayer('');
    setSharedBy([]);

    loadData();
  };

  // ---------------- SETTLEMENT (FIXED) ----------------
  const settlement = useMemo(() => {
    if (!participants.length || !expenses.length)
      return { total: 0, payments: [] };

    const names = participants.map(p => p.name);
    const matrix = {};
    names.forEach(a => {
      matrix[a] = {};
      names.forEach(b => (matrix[a][b] = 0));
    });

    expenses.forEach(e => {
      const valid = e.sharedBy.filter(n => names.includes(n));
      if (!valid.length || !names.includes(e.payer)) return;

      const split = e.amount / valid.length;
      valid.forEach(p => {
        if (p !== e.payer) matrix[p][e.payer] += split;
      });
    });

    const payments = [];
    const seen = new Set();

    names.forEach(a => {
      names.forEach(b => {
        if (a === b) return;
        const key = [a, b].sort().join('-');
        if (seen.has(key)) return;

        const net = matrix[a][b] - matrix[b][a];
        if (net > 0.01) payments.push({ from: a, to: b, amount: net });
        if (net < -0.01) payments.push({ from: b, to: a, amount: -net });

        seen.add(key);
      });
    });

    return {
      total: expenses.reduce((s, e) => s + e.amount, 0),
      payments
    };
  }, [participants, expenses]);

  // ---------------- UI ----------------
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <TouchableOpacity onPress={onBack}>
        <Text style={{ color: 'blue' }}>← Back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 22, marginVertical: 10 }}>
        {trip.name}
      </Text>

      {/* PARTICIPANTS */}
      <Text style={{ fontSize: 18 }}>Participants</Text>
      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        <TextInput
          placeholder="Name"
          value={newParticipant}
          onChangeText={setNewParticipant}
          style={{ borderWidth: 1, flex: 1, padding: 8 }}
        />
        <TouchableOpacity onPress={addParticipant}>
          <Text>Add</Text>
        </TouchableOpacity>
      </View>

      {participants.map(p => (
        <View
          key={p._id}
          style={{ flexDirection: 'row', justifyContent: 'space-between' }}
        >
          <Text>{p.name}</Text>
          <TouchableOpacity onPress={() => deleteParticipant(p._id)}>
            <Text style={{ color: 'red' }}>X</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* EXPENSE */}
      <Text style={{ fontSize: 18, marginTop: 20 }}>Add Expense</Text>

      <TextInput
        placeholder="Title"
        value={expenseTitle}
        onChangeText={setExpenseTitle}
        style={{ borderWidth: 1, padding: 8, marginBottom: 5 }}
      />
      <TextInput
        placeholder="Amount"
        keyboardType="numeric"
        value={expenseAmount}
        onChangeText={setExpenseAmount}
        style={{ borderWidth: 1, padding: 8, marginBottom: 5 }}
      />
      <TextInput
        placeholder="Paid by"
        value={payer}
        onChangeText={setPayer}
        style={{ borderWidth: 1, padding: 8, marginBottom: 5 }}
      />

      <Text>Split Between</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {participants.map(p => (
          <TouchableOpacity
            key={p._id}
            onPress={() => toggleShare(p.name)}
            style={{
              padding: 6,
              margin: 4,
              borderWidth: 1,
              backgroundColor: sharedBy.includes(p.name)
                ? '#90caf9'
                : '#eee'
            }}
          >
            <Text>{p.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={addExpense}>
        <Text>Add Expense</Text>
      </TouchableOpacity>

      {/* SETTLEMENT */}
      <Text style={{ fontSize: 18, marginTop: 20 }}>
        Settlement
      </Text>
      <Text>Total: ₹{settlement.total.toFixed(2)}</Text>

      {settlement.payments.length === 0 ? (
        <Text>All settled 🎉</Text>
      ) : (
        settlement.payments.map((p, i) => (
          <Text key={i}>
            {p.from} → {p.to}: ₹{p.amount.toFixed(2)}
          </Text>
        ))
      )}

      {/* EXPENSE LOG */}
      <Text style={{ fontSize: 18, marginTop: 20 }}>
        Expense Log
      </Text>
      {expenses.map(e => (
        <Text key={e._id}>
          {e.title} — ₹{e.amount} ({e.payer})
        </Text>
      ))}
    </ScrollView>
  );
}
