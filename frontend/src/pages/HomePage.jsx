import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

// ##################################################################
// #  MAIN TRIPSPLIT APP COMPONENT (HomePage)
// ##################################################################
export default function HomePage() {
  const { logout } = useAuth();

  // --- State Variables ---
  const [trips, setTrips] = useState([]);
  const [newTripName, setNewTripName] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  
  const [participants, setParticipants] = useState([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  
  const [expenses, setExpenses] = useState([]);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editedExpense, setEditedExpense] = useState({});
  
  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    category: 'Food',
    payer: '',
    sharedBy: []
  });

  // --- NEW: Invitation State ---
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('idle'); // idle, loading, success, error
  const [inviteMsg, setInviteMsg] = useState('');

  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [error, setError] = useState(null);

  // --- Utility: Alert Helper ---
  const showAlert = (message, type = 'success') => {
    setError({ message, type });
    setTimeout(() => setError(null), 3000);
  };

  // --- Data Fetching Effects ---
  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    if (selectedTrip) {
      fetchParticipants(selectedTrip._id);
      fetchExpenses(selectedTrip._id);
    } else {
      setParticipants([]);
      setExpenses([]);
    }
  }, [selectedTrip]);

  useEffect(() => {
    if (!editingExpenseId) {
      setNewExpense(prev => ({
        ...prev,
        sharedBy: participants.map(p => p.name) 
      }));
    }
  }, [participants, editingExpenseId]);


  // --- API Functions ---
  const fetchTrips = () => {
    setLoadingTrips(true);
    api.get('/trips/')
      .then(response => {
        setTrips(response.data);
        setLoadingTrips(false);
        if (!selectedTrip && response.data.length > 0) {
            setSelectedTrip(response.data[0]);
        }
      })
      .catch(error => {
        showAlert('Error fetching trips.', 'error');
        setLoadingTrips(false);
        if (error.response?.status === 401) logout();
      });
  };

  const fetchParticipants = (tripId) => {
    setLoadingParticipants(true);
    api.get(`/participants/${tripId}`)
      .then(response => {
        setParticipants(response.data);
        setLoadingParticipants(false);
      })
      .catch(error => {
        showAlert('Error fetching participants.', 'warning');
        setLoadingParticipants(false);
      });
  };

  const fetchExpenses = (tripId) => {
    setLoadingExpenses(true);
    api.get(`/expenses/${tripId}`)
      .then(response => {
        setExpenses(response.data);
        setLoadingExpenses(false);
      })
      .catch(error => {
        showAlert('Error fetching expenses.', 'warning');
        setLoadingExpenses(false);
      });
  };

  const handleAddTrip = (e) => {
    e.preventDefault();
    if (!newTripName) return;
    api.post('/trips/add', { name: newTripName })
      .then(res => {
        setNewTripName('');
        fetchTrips(); 
        showAlert('Trip added successfully!', 'success');
      })
      .catch(error => {
        const msg = error.response?.data?.Error || 'Could not add trip.';
        showAlert(msg, 'error');
      });
  };

  const handleDeleteTrip = (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip and all its data?')) return;
    api.delete(`/trips/delete/${tripId}`)
        .then(() => {
            showAlert('Trip deleted!', 'success');
            setSelectedTrip(null);
            fetchTrips(); 
        })
        .catch(error => showAlert(error.response?.data?.Error || 'Could not delete trip.', 'error'));
  };

  // --- NEW: Invitation Functions ---
  const openInviteModal = (e, trip) => {
    e.stopPropagation(); // Stop the click from selecting the trip background
    setSelectedTrip(trip); // Ensure we are inviting to the right trip
    setShowInviteModal(true);
    setInviteStatus('idle');
    setInviteEmail('');
    setInviteMsg('');
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !selectedTrip) return;

    setInviteStatus('loading');
    setInviteMsg('');

    try {
      await api.post('/invitations/send', {
        email: inviteEmail,
        tripId: selectedTrip._id
      });
      
      setInviteStatus('success');
      setInviteMsg('Invitation sent successfully!');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowInviteModal(false);
      }, 2000);

    } catch (err) {
      setInviteStatus('error');
      setInviteMsg(err.response?.data?.msg || 'Failed to send invitation.');
    }
  };

  // --- Standard Delete/Add/Edit Functions ---
  const handleDeleteParticipant = (participantId) => {
    if (!window.confirm('Delete this participant? This may affect existing expenses.')) return;
    api.delete(`/participants/delete/${participantId}`)
        .then(() => {
            showAlert('Participant deleted!', 'success');
            fetchParticipants(selectedTrip._id);
            fetchExpenses(selectedTrip._id);
        })
        .catch(error => showAlert(error.response?.data?.Error || 'Could not delete participant.', 'error'));
  };

  const handleDeleteExpense = (expenseId) => {
    if (!window.confirm('Delete this expense?')) return;
    api.delete(`/expenses/delete/${expenseId}`)
        .then(() => {
            showAlert('Expense deleted!', 'success');
            fetchExpenses(selectedTrip._id);
        })
        .catch(error => showAlert(error.response?.data?.Error || 'Could not delete expense.', 'error'));
  };

  const handleAddParticipant = (e) => {
    e.preventDefault();
    if (!newParticipantName || !selectedTrip) return;
    api.post('/participants/add', {
      name: newParticipantName,
      tripId: selectedTrip._id 
    })
      .then(res => {
        setNewParticipantName('');
        fetchParticipants(selectedTrip._id);
        showAlert('Participant added!', 'success');
      })
      .catch(error => showAlert(error.response?.data?.Error || 'Could not add participant.', 'error'));
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!selectedTrip || !newExpense.title || !newExpense.amount || !newExpense.payer || newExpense.sharedBy.length === 0) {
        showAlert('Please fill all expense details.', 'warning');
        return;
    }
    const amount = parseFloat(newExpense.amount);
    if (isNaN(amount) || amount <= 0) {
        showAlert('Amount must be a positive number.', 'warning');
        return;
    }

    api.post('/expenses/add', {
        ...newExpense,
        amount: amount,
        tripId: selectedTrip._id
    })
      .then(res => {
        setNewExpense(prev => ({ 
            title: '', amount: '', category: 'Food', payer: '', 
            sharedBy: participants.map(p => p.name) 
        }));
        fetchExpenses(selectedTrip._id);
        showAlert('Expense added!', 'success');
      })
      .catch(error => showAlert(error.response?.data?.Error || 'Could not add expense.', 'error'));
  };

  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense._id);
    setEditedExpense({
      ...expense,
      amount: expense.amount.toString(), 
      sharedBy: Array.isArray(expense.sharedBy) ? expense.sharedBy : [expense.sharedBy]
    });
  };

  const handleSaveExpense = () => {
    const amount = parseFloat(editedExpense.amount);
    if (isNaN(amount) || amount <= 0 || !editedExpense.title || !editedExpense.payer || editedExpense.sharedBy.length === 0) {
      showAlert('Invalid data in edited expense.', 'warning');
      return;
    }

    api.put(`/expenses/update/${editingExpenseId}`, {
      ...editedExpense,
      amount: amount,
      tripId: selectedTrip._id
    })
    .then(() => {
      showAlert('Expense updated!', 'success');
      setEditingExpenseId(null);
      setEditedExpense({});
      fetchExpenses(selectedTrip._id);
    })
    .catch(error => showAlert(error.response?.data?.Error || 'Could not update expense.', 'error'));
  };

  const handleEditChange = (field, value) => {
    setEditedExpense(prev => ({ ...prev, [field]: value }));
  };

  const handleEditCheckboxChange = (name) => {
    setEditedExpense(prev => ({
        ...prev,
        sharedBy: prev.sharedBy.includes(name)
            ? prev.sharedBy.filter(n => n !== name)
            : [...prev.sharedBy, name]
    }));
  };
  
  // --- Calculation Logic ---
  const settlement = useMemo(() => {
    if (participants.length === 0 || expenses.length === 0) {
        return { netPayments: [], totalSpent: 0, totalShare: 0, balances: [] }; 
    }
    const participantNames = participants.map(p => p.name);
    const matrix = {};
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    participantNames.forEach(p => {
      matrix[p] = {};
      participantNames.forEach(q => { matrix[p][q] = 0; });
    });

    expenses.forEach(e => {
        const validSharers = e.sharedBy.filter(name => participantNames.includes(name));
        if (validSharers.length === 0 || e.amount <= 0) return;
        
        const split = e.amount / validSharers.length;
        
        validSharers.forEach(pName => {
            if (pName !== e.payer && participantNames.includes(e.payer)) {
                matrix[pName][e.payer] += split;
            }
        });
    });
    
    const netPayments = [];
    const checked = new Set();
    participantNames.forEach(p => {
        participantNames.forEach(q => {
            if (p === q || checked.has(`${p}-${q}`) || checked.has(`${q}-${p}`)) return;
            const pOwesQ = matrix[p][q];
            const qOwesP = matrix[q][p];
            const netAmount = pOwesQ - qOwesP;
            if (netAmount > 0.01) { 
                netPayments.push({ from: p, to: q, amount: netAmount });
            } else if (netAmount < -0.01) { 
                netPayments.push({ from: q, to: p, amount: -netAmount });
            }
            checked.add(`${p}-${q}`);
        });
    });

    const balances = participantNames.map(pName => {
        const paid = expenses.filter(e => e.payer === pName).reduce((sum, e) => sum + e.amount, 0);
        let share = 0;
        expenses.forEach(e => {
            const validSharers = e.sharedBy.filter(name => participantNames.includes(name));
            if (validSharers.includes(pName) && validSharers.length > 0) {
                share += e.amount / validSharers.length;
            }
        });
        const net = paid - share;
        return { name: pName, paid, share, net: net };
    });

    return { netPayments, totalSpent, balances };
  }, [expenses, participants]);

  // --- Render Helpers ---
  const renderAlert = () => {
    if (!error) return null;
    const isSuccess = error.type === 'success';
    return (
      <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg text-white font-semibold ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`}>
        {error.message}
      </div>
    );
  };
  
  const renderParticipantCheckboxes = (sharedByArray, handleChangeFunc) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 border rounded-lg bg-gray-50 max-h-32 overflow-y-auto">
            {participants.length === 0 && <span className="text-gray-500 italic">Add participants first.</span>}
            {participants.map(p => (
                <label key={p._id} className="flex items-center space-x-2 text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={sharedByArray.includes(p.name)} onChange={() => handleChangeFunc(p.name)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span>{p.name}</span>
                </label>
            ))}
        </div>
    );
  }

  const renderSelect = (value, onChangeFunc, options, placeholder) => (
    <select value={value} onChange={onChangeFunc}
      className="p-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full">
      <option value="">{placeholder}</option>
      {options.map(opt => ( <option key={opt} value={opt}>{opt}</option> ))}
    </select>
  );

  const ExpenseRow = ({ expense }) => {
    const isEditing = editingExpenseId === expense._id;
    if (isEditing) {
        return (
            <tr className="bg-yellow-50">
                <td className="px-4 py-3"><input type="text" value={editedExpense.title || ''} onChange={(e) => handleEditChange('title', e.target.value)} className="w-full p-1 border rounded" /></td>
                <td className="px-4 py-3"><input type="number" value={editedExpense.amount || ''} onChange={(e) => handleEditChange('amount', e.target.value)} className="w-full p-1 border rounded text-right" /></td>
                <td className="px-4 py-3">
                    {renderSelect(editedExpense.payer, (e) => handleEditChange('payer', e.target.value), participants.map(p => p.name), '-- Payer --')}
                </td>
                <td className="px-4 py-3 max-w-sm">
                    {renderParticipantCheckboxes(editedExpense.sharedBy, handleEditCheckboxChange)}
                </td>
                <td className="px-4 py-3 flex space-x-2 justify-center">
                    <button onClick={handleSaveExpense} className="text-xs bg-green-500 hover:bg-green-600 text-white p-2 rounded">Save</button>
                    <button onClick={() => setEditingExpenseId(null)} className="text-xs bg-gray-500 hover:bg-gray-600 text-white p-2 rounded">Cancel</button>
                </td>
            </tr>
        );
    }
    return (
        <tr key={expense._id}>
            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {expense.title}
                <div className="text-xs text-blue-500">{expense.category}</div>
            </td>
            <td className="px-4 py-3 text-sm text-gray-700 font-medium text-right">${expense.amount.toFixed(2)}</td>
            <td className="px-4 py-3 text-sm text-gray-700">{expense.payer}</td>
            <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={expense.sharedBy.join(', ')}>{expense.sharedBy.join(', ')}</td>
            <td className="px-4 py-3 flex space-x-2 justify-center">
                <button onClick={() => handleEditExpense(expense)} className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded">Edit</button>
                <button onClick={() => handleDeleteExpense(expense._id)} className="text-xs bg-red-500 hover:bg-red-600 text-white p-2 rounded">Delete</button>
            </td>
        </tr>
    );
  };

  // --- Main Render ---
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 relative">
      {renderAlert()}

      {/* --- NEW: Invitation Modal --- */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button 
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Invite Friend</h3>
            <p className="text-sm text-gray-600 mb-4">
              Send an invitation link to a friend to join <strong>{selectedTrip?.name}</strong>.
            </p>
            
            <form onSubmit={handleSendInvite}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Friend's Email</label>
              <input 
                type="email" 
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
              />
              
              {inviteStatus === 'error' && <p className="text-red-500 text-sm mb-4">{inviteMsg}</p>}
              {inviteStatus === 'success' && <p className="text-green-500 text-sm mb-4">{inviteMsg}</p>}

              <button 
                type="submit" 
                disabled={inviteStatus === 'loading' || inviteStatus === 'success'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg disabled:opacity-50"
              >
                {inviteStatus === 'loading' ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* --- Col 1 (Desktop) --- */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* 1. Trip Setup */}
          <section id="section-1-trip" className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">1. Trip Setup</h2>
            <form onSubmit={handleAddTrip} className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newTripName}
                onChange={(e) => setNewTripName(e.target.value)}
                placeholder="New trip name"
                className="flex-grow w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 shadow-sm">
                Create
              </button>
            </form>
            <h3 className="text-xl font-semibold mb-2 text-gray-700">Select Trip:</h3>
            {loadingTrips ? <p className="text-gray-500">Loading...</p> : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {trips.length === 0 && <p className="text-gray-500 italic">No trips found.</p>}
                {trips.map(trip => (
                  <li
                    key={trip._id}
                    onClick={() => setSelectedTrip(trip)}
                    className={`p-3 rounded-lg flex justify-between items-center cursor-pointer transition ${selectedTrip?._id === trip._id ? 'bg-blue-200 border-blue-500 border-2' : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <span className="font-medium text-lg text-gray-700">{trip.name}</span>
                    <div className="flex space-x-2">
                      {/* --- NEW: Invite Button --- */}
                      <button
                        onClick={(e) => openInviteModal(e, trip)}
                        className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded"
                        title="Invite Friend"
                      >
                        Invite
                      </button>
                      {/* Note: You might want to conditionally show the Delete button only if user is owner */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteTrip(trip._id); }}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          
          {/* 2. Participants */}
          <section id="section-2-participants" className={`bg-white rounded-lg shadow-md p-6 ${!selectedTrip ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">2. Participants</h2>
            <h3 className="text-xl font-semibold mb-3">Trip: <span className="text-blue-600">{selectedTrip?.name || '---'}</span></h3>
            <form onSubmit={handleAddParticipant} className="flex space-x-2 mb-4">
              <input
                type="text"
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                placeholder="Participant's name"
                className="flex-grow w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 shadow-sm">
                Add
              </button>
            </form>
            <h4 className="text-lg font-semibold mb-2">List:</h4>
            {loadingParticipants ? <p className="text-gray-500">Loading...</p> : (
              <ul className="space-y-2 max-h-48 overflow-y-auto">
                {participants.length === 0 && <p className="text-gray-500 italic">No participants added yet.</p>}
                {participants.map(p => (
                  <li key={p._id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <span className="font-medium text-gray-700">{p.name}</span>
                    <button onClick={() => handleDeleteParticipant(p._id)} className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* --- Col 2 (Desktop) --- */}
        <div className="lg:col-span-1 space-y-6">
          {/* 3. Expense Entry */}
          <section id="section-3-expense-entry" className={`bg-white rounded-lg shadow-md p-6 ${!selectedTrip ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">3. Expense Entry</h2>
            <h3 className="text-xl font-semibold mb-3">Trip: <span className="text-blue-600">{selectedTrip?.name || '---'}</span></h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <input type="text" placeholder="Expense Title" value={newExpense.title}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, title: e.target.value }))}
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" placeholder="Amount ($)" value={newExpense.amount}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <select value={newExpense.category} onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                  className="p-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Food</option>
                  <option>Transport</option>
                  <option>Lodging</option>
                  <option>Misc</option>
                  <option>Other</option>
                </select>
                <select value={newExpense.payer} onChange={(e) => setNewExpense(prev => ({ ...prev, payer: e.target.value }))}
                  className="p-3 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Paid By --</option>
                  {participants.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Split Evenly Among:</label>
              {renderParticipantCheckboxes(newExpense.sharedBy, (name) => setNewExpense(prev => ({
                  ...prev,
                  sharedBy: prev.sharedBy.includes(name)
                      ? prev.sharedBy.filter(n => n !== name)
                      : [...prev.sharedBy, name]
              })))}
              <button type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200 shadow-sm">
                Add Expense & Calculate
              </button>
            </form>
          </section>
        </div>

        {/* --- Col 3 (Desktop) --- */}
        <div className="lg:col-span-1 space-y-6">
          <section id="section-4-summary" className={`bg-white rounded-lg shadow-md p-6 sticky top-20 ${!selectedTrip ? 'opacity-50' : ''}`}> 
            <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">4. Settlement Summary</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <p className="text-lg font-medium text-gray-600">Total Spent</p>
                <p className="text-3xl font-bold text-blue-800">${settlement.totalSpent.toFixed(2)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <p className="text-lg font-medium text-gray-600">Avg. Share</p>
                <p className="text-3xl font-bold text-purple-800">
                  ${participants.length > 0 ? (settlement.totalSpent / participants.length).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
            <h3 className="text-xl font-bold mb-3 text-red-600">Who Pays Whom:</h3>
            <ul className="space-y-3">
              {settlement.netPayments.length === 0 ? (
                <li className="p-3 bg-green-100 text-green-700 rounded-lg font-medium">
                  🎉 Everything is settled!
                </li>
              ) : (
                settlement.netPayments.map((p, i) => (
                  <li key={i} className="p-3 bg-red-100 rounded-lg flex items-center justify-between space-x-3">
                    <span className="font-medium text-gray-800">{p.from}</span>
                    <span className="text-red-600 font-bold text-lg">PAYS</span>
                    <span className="font-medium text-gray-800">{p.to}</span>
                    <span className="font-bold text-red-800 text-lg">${p.amount.toFixed(2)}</span>
                  </li>
                ))
              )}
            </ul>
            <h3 className="text-xl font-bold mt-6 mb-3 text-gray-700">Individual Balances:</h3>
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Share</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {settlement.balances.map(b => (
                    <tr key={b.name}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{b.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">${b.paid.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-right">${b.share.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-sm font-bold text-right ${b.net > 0 ? 'text-green-600' : (b.net < 0 ? 'text-red-600' : 'text-gray-500')}`}>
                        ${b.net.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        
      </div>

      {/* --- Bottom Row (Full Width) --- */}
      <div className="mt-6">
        <section id="section-5-expense-log" className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">5. Expense Log</h2>
          {loadingExpenses ? <p className="text-gray-500">Loading...</p> : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shared By</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.length === 0 && (
                    <tr><td colSpan="5" className="px-4 py-4 text-center text-gray-500 italic">No expenses recorded.</td></tr>
                  )}
                  {expenses.map(e => ( <ExpenseRow key={e._id} expense={e} /> ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

    </div>
  );
}