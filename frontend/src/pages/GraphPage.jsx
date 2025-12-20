import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import api from '../api';
import PageContainer from '../components/PageContainer';
import { Link } from 'react-router-dom';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const GraphPage = () => {
  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch User & Trips on Load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get('/users');
        setUser(userRes.data);

        const tripsRes = await api.get('/trips');
        setTrips(tripsRes.data);
        
        if (tripsRes.data.length > 0) {
            setSelectedTrip(tripsRes.data[0]);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error loading data", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch Expenses when Trip Changes
  // Fetch Expenses when Trip Changes (PROTECTED + SAFE)
useEffect(() => {
  if (!selectedTrip) return;

  api.get(`/expenses/${selectedTrip._id}`)
    .then(res => {
      setExpenses(res.data);
    })
    .catch(err => {
      console.error('Graph access blocked or failed:', err);

      // Clear data if backend blocks (expired / free)
      setExpenses([]);

      // OPTIONAL: redirect user to upgrade page on 403
      if (err.response?.status === 403) {
        window.location.href = '/subscription';
      }
    });
}, [selectedTrip]);


  // --- Graph Data Calculations ---

  // 1. Bar Graph: Expenses by Category
  const categoryData = useMemo(() => {
    const categories = {};
    expenses.forEach(e => {
        categories[e.category] = (categories[e.category] || 0) + e.amount;
    });
    return {
        labels: Object.keys(categories),
        datasets: [{
            label: 'Expenses by Category (₹)',
            data: Object.values(categories),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
        }]
    };
  }, [expenses]);

  // 2. Line Graph: Expenses over Time (Advance+)
  const timelineData = useMemo(() => {
      // Group by Date (YYYY-MM-DD)
      const timeline = {};
      expenses.forEach(e => {
          const date = new Date(e.createdAt).toLocaleDateString();
          timeline[date] = (timeline[date] || 0) + e.amount;
      });
      // Sort by date
      const sortedDates = Object.keys(timeline).sort((a,b) => new Date(a) - new Date(b));
      
      return {
          labels: sortedDates,
          datasets: [{
              label: 'Daily Spending (₹)',
              data: sortedDates.map(d => timeline[d]),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              tension: 0.3
          }]
      };
  }, [expenses]);

  // 3. Individual Stats (Premium)
  const individualData = useMemo(() => {
      const payerStats = {};
      expenses.forEach(e => {
          payerStats[e.payer] = (payerStats[e.payer] || 0) + e.amount;
      });
      return {
          labels: Object.keys(payerStats),
          datasets: [{
              label: 'Spending by Person (₹)',
              data: Object.values(payerStats),
              backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(255, 206, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(153, 102, 255, 0.6)',
              ],
          }]
      };
  }, [expenses]);


  if (loading) return <PageContainer title="Analytics"><p>Loading...</p></PageContainer>;

  const plan = user?.subscriptionPlan || 'free';
  const isBasic = ['basic', 'advance', 'premium'].includes(plan);
  const isAdvance = ['advance', 'premium'].includes(plan);
  const isPremium = ['premium'].includes(plan);

  if (plan === 'free') {
      return (
          <PageContainer title="Analytics">
              <div className="text-center p-10 border-2 border-dashed border-gray-300 rounded-xl">
                  <h2 className="text-2xl font-bold text-gray-700 mb-4">🔒 Analytics Locked</h2>
                  <p className="text-gray-500 mb-6">Upgrade to a paid plan to see visual insights of your trips.</p>
                  <Link to="/subscription" className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-yellow-600 transition">
                      View Plans
                  </Link>
              </div>
          </PageContainer>
      );
  }

  return (
    <PageContainer title="Trip Analytics">
      {/* Trip Selector */}
      <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">Select Trip:</label>
          <div className="flex gap-2 overflow-x-auto pb-2">
              {trips.map(trip => (
                  <button 
                    key={trip._id}
                    onClick={() => setSelectedTrip(trip)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${selectedTrip?._id === trip._id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                      {trip.name}
                  </button>
              ))}
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 1. BASIC: Category Bar Chart */}
          {isBasic && (
              <div className="bg-white p-6 rounded-lg shadow-md border">
                  <h3 className="text-lg font-bold mb-4 text-gray-700">Expenses by Category</h3>
                  <Bar data={categoryData} />
              </div>
          )}

          {/* 2. ADVANCE: Timeline Line Chart */}
          {isAdvance ? (
              <div className="bg-white p-6 rounded-lg shadow-md border">
                  <h3 className="text-lg font-bold mb-4 text-gray-700">Spending Timeline</h3>
                  <Line data={timelineData} />
              </div>
          ) : (
              <div className="bg-gray-50 p-6 rounded-lg shadow-inner border border-dashed flex flex-col items-center justify-center text-center opacity-70">
                  <span className="text-4xl mb-2">📈</span>
                  <h3 className="font-bold text-gray-500">Timeline Graph</h3>
                  <p className="text-sm text-gray-400 mb-4">Available in Advance Plan</p>
                  <Link to="/subscription" className="text-blue-500 hover:underline text-sm">Upgrade</Link>
              </div>
          )}

          {/* 3. PREMIUM: Individual Stats */}
          {isPremium ? (
              <div className="bg-white p-6 rounded-lg shadow-md border lg:col-span-2">
                  <h3 className="text-lg font-bold mb-4 text-gray-700">Individual Spending Breakdown</h3>
                  <div className="h-64 w-full flex justify-center">
                    <Pie data={individualData} />
                  </div>
              </div>
          ) : (
              <div className="bg-gray-50 p-6 rounded-lg shadow-inner border border-dashed flex flex-col items-center justify-center text-center opacity-70 lg:col-span-2">
                  <span className="text-4xl mb-2">👑</span>
                  <h3 className="font-bold text-gray-500">Individual Stats</h3>
                  <p className="text-sm text-gray-400 mb-4">Available in Premium Plan</p>
                  <Link to="/subscription" className="text-blue-500 hover:underline text-sm">Upgrade</Link>
              </div>
          )}

      </div>
    </PageContainer>
  );
};

export default GraphPage;