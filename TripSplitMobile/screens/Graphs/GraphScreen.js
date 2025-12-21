import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const screenWidth = Dimensions.get('window').width;

const GraphScreen = ({ navigation }) => {
  const { user } = useAuth();

  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const plan = user?.subscriptionPlan || 'free';
  const isBasic = ['basic', 'advance', 'premium'].includes(plan);
  const isAdvance = ['advance', 'premium'].includes(plan);
  const isPremium = plan === 'premium';

  /* ---------------------------------- */
  /* Load trips                          */
  /* ---------------------------------- */
  useEffect(() => {
    const loadTrips = async () => {
      try {
        const res = await api.get('/trips');
        setTrips(res.data || []);
        if (res.data?.length) setSelectedTrip(res.data[0]);
      } catch (err) {
        console.log('Trip load error', err);
      } finally {
        setLoading(false);
      }
    };
    loadTrips();
  }, []);

  /* ---------------------------------- */
  /* Load expenses per trip              */
  /* ---------------------------------- */
  useEffect(() => {
    if (!selectedTrip) return;

    api.get(`/expenses/${selectedTrip._id}`)
      .then(res => setExpenses(res.data || []))
      .catch(err => {
        console.log('Graph blocked or failed', err);
        setExpenses([]);

        if (err.response?.status === 403) {
          navigation.navigate('Subscription');
        }
      });
  }, [selectedTrip]);

  /* ---------------------------------- */
  /* Calculations                        */
  /* ---------------------------------- */

  // Category Bar
  const categoryData = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });

    return {
      labels: Object.keys(map),
      datasets: [{ data: Object.values(map) }],
    };
  }, [expenses]);

  // Timeline Line
  const timelineData = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const d = new Date(e.createdAt).toLocaleDateString();
      map[d] = (map[d] || 0) + e.amount;
    });

    const labels = Object.keys(map).sort((a, b) => new Date(a) - new Date(b));
    return {
      labels,
      datasets: [{ data: labels.map(l => map[l]) }],
    };
  }, [expenses]);

  // Individual Pie
  const individualData = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      map[e.payer] = (map[e.payer] || 0) + e.amount;
    });

    return Object.keys(map).map((k, i) => ({
      name: k,
      amount: map[k],
      color: COLORS[i % COLORS.length],
      legendFontColor: '#333',
      legendFontSize: 12,
    }));
  }, [expenses]);

  /* ---------------------------------- */
  /* UI STATES                           */
  /* ---------------------------------- */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (plan === 'free') {
    return (
      <View style={styles.locked}>
        <Text style={styles.lockTitle}>🔒 Analytics Locked</Text>
        <Text style={styles.lockText}>Upgrade to view graphs</Text>
        <TouchableOpacity style={styles.upgradeBtn} onPress={() => navigation.navigate('Subscription')}>
          <Text style={styles.upgradeText}>Upgrade</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Trip Analytics</Text>

      {/* Trip Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tripRow}>
        {trips.map(t => (
          <TouchableOpacity
            key={t._id}
            onPress={() => setSelectedTrip(t)}
            style={[
              styles.tripBtn,
              selectedTrip?._id === t._id && styles.tripBtnActive,
            ]}
          >
            <Text style={selectedTrip?._id === t._id ? styles.tripTextActive : styles.tripText}>
              {t.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* BASIC */}
      {isBasic && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Expenses by Category</Text>
          <BarChart
            data={categoryData}
            width={screenWidth - 32}
            height={220}
            fromZero
            chartConfig={chartConfig}
          />
        </View>
      )}

      {/* ADVANCE */}
      {isAdvance ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending Timeline</Text>
          <LineChart
            data={timelineData}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
          />
        </View>
      ) : (
        <LockedBox label="Timeline Graph" plan="Advance" />
      )}

      {/* PREMIUM */}
      {isPremium ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Individual Spending</Text>
          <PieChart
            data={individualData}
            width={screenWidth - 32}
            height={220}
            accessor="amount"
            chartConfig={chartConfig}
            backgroundColor="transparent"
            paddingLeft="10"
          />
        </View>
      ) : (
        <LockedBox label="Individual Stats" plan="Premium" />
      )}
    </ScrollView>
  );
};

/* ---------------------------------- */
/* Small components                    */
/* ---------------------------------- */

const LockedBox = ({ label, plan }) => (
  <View style={styles.lockCard}>
    <Text style={styles.lockEmoji}>👑</Text>
    <Text style={styles.lockLabel}>{label}</Text>
    <Text style={styles.lockSub}>Available in {plan}</Text>
  </View>
);

/* ---------------------------------- */
/* Constants                           */
/* ---------------------------------- */

const COLORS = ['#f44336', '#2196f3', '#ffc107', '#4caf50', '#9c27b0'];

const chartConfig = {
  backgroundGradientFrom: '#fff',
  backgroundGradientTo: '#fff',
  color: () => '#0288d1',
  labelColor: () => '#555',
};

/* ---------------------------------- */
/* Styles                              */
/* ---------------------------------- */

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },

  tripRow: { marginBottom: 16 },
  tripBtn: { padding: 10, borderRadius: 20, backgroundColor: '#e0e0e0', marginRight: 8 },
  tripBtnActive: { backgroundColor: '#0288d1' },
  tripText: { color: '#333' },
  tripTextActive: { color: '#fff', fontWeight: 'bold' },

  card: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },

  lockCard: {
    backgroundColor: '#eee',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  lockEmoji: { fontSize: 32 },
  lockLabel: { fontWeight: 'bold', marginTop: 8 },
  lockSub: { color: '#777', fontSize: 12 },

  locked: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  lockTitle: { fontSize: 22, fontWeight: 'bold' },
  lockText: { color: '#666', marginVertical: 10 },
  upgradeBtn: { backgroundColor: '#ffb300', padding: 12, borderRadius: 8 },
  upgradeText: { fontWeight: 'bold', color: '#fff' },
});

export default GraphScreen;
