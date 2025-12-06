import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

// ##################################################################
// #  HELPER COMPONENT: ExpenseRow 
// ##################################################################
const ExpenseRow = ({ 
  expense, 
  editingExpenseId, 
  editedExpense, 
  participants, 
  onEdit, 
  onSave, 
  onCancel, 
  onDelete, 
  onEditChange, 
  onCheckboxChange 
}) => {
  const isEditing = editingExpenseId === expense._id;

  const renderCheckboxes = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 border rounded bg-gray-50 max-h-24 overflow-y-auto">
        {participants.map(p => (
            <label key={p._id} className="flex items-center space-x-1 text-xs cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={editedExpense.sharedBy?.includes(p.name)} 
                  onChange={() => onCheckboxChange(p.name)}
                  className="rounded border-gray-300 text-blue-600" 
                />
                <span>{p.name}</span>
            </label>
        ))}
    </div>
  );

  if (isEditing) {
      return (
          <tr className="bg-yellow-50">
              <td className="px-4 py-3 align-top">
                <input 
                  type="text" 
                  value={editedExpense.title || ''} 
                  onChange={(e) => onEditChange('title', e.target.value)} 
                  className="w-full p-1 border rounded mb-1" 
                  placeholder="Title"
                />
                <select 
                  value={editedExpense.category} 
                  onChange={(e) => onEditChange('category', e.target.value)}
                  className="w-full p-1 border rounded text-xs"
                >
                  <option>Food</option><option>Transport</option><option>Lodging</option><option>Misc</option><option>Other</option>
                </select>
              </td>
              <td className="px-4 py-3 align-top">
                <input 
                  type="number" 
                  value={editedExpense.amount || ''} 
                  onChange={(e) => onEditChange('amount', e.target.value)} 
                  className="w-full p-1 border rounded text-right" 
                />
              </td>
              <td className="px-4 py-3 align-top">
                  <select 
                    value={editedExpense.payer} 
                    onChange={(e) => onEditChange('payer', e.target.value)}
                    className="w-full p-1 border rounded text-sm"
                  >
                    <option value="">-- Payer --</option>
                    {participants.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
                  </select>
              </td>
              <td className="px-4 py-3 align-top min-w-[200px]">
                  {renderCheckboxes()}
              </td>
              <td className="px-4 py-3 align-top text-center space-y-2">
                  <button onClick={onSave} className="block w-full text-xs bg-green-500 hover:bg-green-600 text-white p-1 rounded">Save</button>
                  <button onClick={onCancel} className="block w-full text-xs bg-gray-500 hover:bg-gray-600 text-white p-1 rounded">Cancel</button>
              </td>
          </tr>
      );
  }
  // Non-editing View
  return (
      <tr key={expense._id} className="hover:bg-gray-50">
          <td className="px-4 py-3 text-sm font-medium text-gray-900">
              {expense.title}
              <div className="text-xs text-blue-500">{expense.category}</div>
          </td>
          {/* CHANGED: $ to ₹ */}
          <td className="px-4 py-3 text-sm text-gray-700 font-medium text-right">₹{expense.amount.toFixed(2)}</td>
          <td className="px-4 py-3 text-sm text-gray-700">{expense.payer}</td>
          <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={expense.sharedBy.join(', ')}>{expense.sharedBy.join(', ')}</td>
          <td className="px-4 py-3 text-center space-x-2">
              <button onClick={() => onEdit(expense)} className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded">Edit</button>
              <button onClick={() => onDelete(expense._id)} className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">Delete</button>
          </td>
      </tr>
  );
};

// ##################################################################
// #  MAIN COMPONENT: HomePage
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
    title: '', amount: '', category: 'Food', payer: '', sharedBy: []
  });

  // Invite State
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('idle');
  const [inviteMsg, setInviteMsg] = useState('');

  const [loadingTrips, setLoadingTrips] = useState(true);
  const [error, setError] = useState(null);

  // --- Utility: Alert Helper ---
  const showAlert = (message, type = 'success') => {
    setError({ message, type });
    setTimeout(() => setError(null), 3000);
  };

  // --- 1. INITIAL LOAD ---
  useEffect(() => {
    fetchTrips();
  }, []);

  // --- 2. AUTO-REFRESH (POLLING) ---
  useEffect(() => {
    if (!selectedTrip) return;

    const intervalId = setInterval(() => {
      api.get(`/participants/${selectedTrip._id}`).then(res => setParticipants(res.data)).catch(() => {});
      api.get(`/expenses/${selectedTrip._id}`).then(res => setExpenses(res.data)).catch(() => {});
    }, 5000); 

    return () => clearInterval(intervalId); 
  }, [selectedTrip]);

  // --- 3. FETCH DATA ON TRIP CHANGE ---
  useEffect(() => {
    if (selectedTrip) {
      localStorage.setItem('lastSelectedTripId', selectedTrip._id);
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
        
        const lastId = localStorage.getItem('lastSelectedTripId');
        const foundTrip = response.data.find(t => t._id === lastId);

        if (foundTrip) {
          setSelectedTrip(foundTrip);
        } else if (response.data.length > 0) {
          setSelectedTrip(response.data[0]);
        }
        setLoadingTrips(false);
      })
      .catch(error => {
        showAlert('Error fetching trips.', 'error');
        setLoadingTrips(false);
        if (error.response?.status === 401) logout();
      });
  };

  const fetchParticipants = (tripId) => {
    api.get(`/participants/${tripId}`)
      .then(response => setParticipants(response.data))
      .catch(() => showAlert('Error fetching participants.', 'warning'));
  };

  const fetchExpenses = (tripId) => {
    api.get(`/expenses/${tripId}`)
      .then(response => setExpenses(response.data))
      .catch(() => showAlert('Error fetching expenses.', 'warning'));
  };

  // --- CRUD Handlers ---
  const handleAddTrip = (e) => {
    e.preventDefault();
    if (!newTripName) return;
    api.post('/trips/add', { name: newTripName })
      .then(() => {
        setNewTripName('');
        fetchTrips(); 
        showAlert('Trip created!', 'success');
      })
      .catch(err => showAlert(err.response?.data?.Error || 'Error adding trip', 'error'));
  };

  const handleDeleteTrip = (tripId) => {
    if (!window.confirm('Delete this trip?')) return;
    api.delete(`/trips/delete/${tripId}`)
        .then(() => {
            showAlert('Trip deleted!', 'success');
            localStorage.removeItem('lastSelectedTripId');
            setSelectedTrip(null);
            fetchTrips(); 
        })
        .catch(err => showAlert(err.response?.data?.Error || 'Error deleting trip', 'error'));
  };

  // ... Invitation Handlers ...
  const openInviteModal = (e, trip) => {
    e.stopPropagation();
    setSelectedTrip(trip);
    setShowInviteModal(true);
    setInviteStatus('idle');
    setInviteEmail('');
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setInviteStatus('loading');
    try {
      await api.post('/invitations/send', { email: inviteEmail, tripId: selectedTrip._id });
      setInviteStatus('success');
      setInviteMsg('Invitation sent!');
      setTimeout(() => setShowInviteModal(false), 2000);
    } catch (err) {
      setInviteStatus('error');
      setInviteMsg(err.response?.data?.msg || 'Failed.');
    }
  };

  // ... Participant/Expense Handlers ...
  const handleAddParticipant = (e) => {
    e.preventDefault();
    if (!newParticipantName) return;
    api.post('/participants/add', { name: newParticipantName, tripId: selectedTrip._id })
      .then(() => {
        setNewParticipantName('');
        fetchParticipants(selectedTrip._id);
        showAlert('Participant added!', 'success');
      })
      .catch(err => showAlert(err.response?.data?.Error || 'Error', 'error'));
  };

  const handleDeleteParticipant = (id) => {
    if (!window.confirm('Delete participant?')) return;
    api.delete(`/participants/delete/${id}`)
      .then(() => {
        fetchParticipants(selectedTrip._id);
        fetchExpenses(selectedTrip._id);
        showAlert('Deleted.', 'success');
      })
      .catch(err => showAlert(err.response?.data?.Error || 'Error', 'error'));
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    const amt = parseFloat(newExpense.amount);
    if (!newExpense.title || isNaN(amt) || amt <= 0) {
        return showAlert('Invalid expense details.', 'warning');
    }
    api.post('/expenses/add', { ...newExpense, amount: amt, tripId: selectedTrip._id })
      .then(() => {
        setNewExpense(prev => ({ ...prev, title: '', amount: '', payer: '' })); 
        fetchExpenses(selectedTrip._id);
        showAlert('Expense added!', 'success');
      })
      .catch(err => showAlert(err.response?.data?.Error || 'Error', 'error'));
  };

  // ... Edit Handlers ...
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
    if (isNaN(amount) || amount <= 0 || !editedExpense.title) return showAlert('Invalid data.', 'warning');

    api.put(`/expenses/update/${editingExpenseId}`, { ...editedExpense, amount, tripId: selectedTrip._id })
    .then(() => {
      showAlert('Expense updated!', 'success');
      setEditingExpenseId(null);
      fetchExpenses(selectedTrip._id);
    })
    .catch(err => showAlert(err.response?.data?.Error || 'Error', 'error'));
  };

  const handleDeleteExpense = (id) => {
    if (!window.confirm('Delete expense?')) return;
    api.delete(`/expenses/delete/${id}`)
      .then(() => {
        fetchExpenses(selectedTrip._id);
        showAlert('Expense deleted.', 'success');
      })
      .catch(err => showAlert(err.response?.data?.Error || 'Error', 'error'));
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
    if (!participants.length || !expenses.length) return { netPayments: [], totalSpent: 0, balances: [] };
    
    const participantNames = participants.map(p => p.name);
    const matrix = {};
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    participantNames.forEach(p => { matrix[p] = {}; participantNames.forEach(q => matrix[p][q] = 0); });

    expenses.forEach(e => {
        const validSharers = e.sharedBy.filter(n => participantNames.includes(n));
        if (!validSharers.length) return;
        const split = e.amount / validSharers.length;
        validSharers.forEach(pName => {
            if (pName !== e.payer && participantNames.includes(e.payer)) matrix[pName][e.payer] += split;
        });
    });
    
    const netPayments = [];
    const checked = new Set();
    participantNames.forEach(p => {
        participantNames.forEach(q => {
            if (p === q || checked.has(`${p}-${q}`) || checked.has(`${q}-${p}`)) return;
            const net = matrix[p][q] - matrix[q][p];
            if (net > 0.01) netPayments.push({ from: p, to: q, amount: net });
            else if (net < -0.01) netPayments.push({ from: q, to: p, amount: -net });
            checked.add(`${p}-${q}`);
        });
    });

    const balances = participantNames.map(pName => {
        const paid = expenses.filter(e => e.payer === pName).reduce((sum, e) => sum + e.amount, 0);
        let share = 0;
        expenses.forEach(e => {
            const validSharers = e.sharedBy.filter(n => participantNames.includes(n));
            if (validSharers.includes(pName)) share += e.amount / validSharers.length;
        });
        return { name: pName, paid, share, net: paid - share };
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


  // --- RENDER ---
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 relative">
      {renderAlert()}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowInviteModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
            <h3 className="text-2xl font-bold mb-4">Invite Friend</h3>
            <form onSubmit={handleSendInvite}>
              <input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="friend@email.com" className="w-full p-3 border rounded mb-4" />
              {inviteStatus === 'error' && <p className="text-red-500 mb-2">{inviteMsg}</p>}
              {inviteStatus === 'success' && <p className="text-green-500 mb-2">{inviteMsg}</p>}
              <button type="submit" disabled={inviteStatus === 'loading'} className="w-full bg-blue-600 text-white font-bold py-3 rounded disabled:opacity-50">
                {inviteStatus === 'loading' ? 'Sending...' : 'Send Invite'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Col 1: Trip & Participants */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">1. Trips</h2>
            <form onSubmit={handleAddTrip} className="flex gap-2 mb-4">
              <input value={newTripName} onChange={e => setNewTripName(e.target.value)} placeholder="Trip Name" className="flex-1 p-2 border rounded" />
              <button type="submit" className="bg-blue-500 text-white px-4 rounded">Create</button>
            </form>
            <div className="max-h-48 overflow-y-auto space-y-2">
                {trips.length === 0 && <p className="text-gray-500 text-sm">No trips found.</p>}
                {trips.map(t => (
                    <div key={t._id} onClick={() => setSelectedTrip(t)} 
                         className={`p-3 rounded cursor-pointer flex justify-between items-center ${selectedTrip?._id === t._id ? 'bg-blue-100 border-blue-500 border' : 'bg-gray-50'}`}>
                        <span className="font-medium">{t.name}</span>
                        <div className="flex gap-1">
                            <button onClick={(e) => openInviteModal(e, t)} className="text-xs bg-indigo-500 text-white px-2 py-1 rounded">Invite</button>
                            <button onClick={(e) => {e.stopPropagation(); handleDeleteTrip(t._id)}} className="text-xs bg-red-500 text-white px-2 py-1 rounded">Del</button>
                        </div>
                    </div>
                ))}
            </div>
          </section>

          <section className={`bg-white rounded-lg shadow p-6 ${!selectedTrip ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">2. Participants</h2>
            <form onSubmit={handleAddParticipant} className="flex gap-2 mb-4">
               <input value={newParticipantName} onChange={e => setNewParticipantName(e.target.value)} placeholder="Name" className="flex-1 p-2 border rounded" />
               <button type="submit" className="bg-green-500 text-white px-4 rounded">Add</button>
            </form>
            <div className="max-h-48 overflow-y-auto space-y-2">
                {participants.map(p => (
                    <div key={p._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{p.name}</span>
                        <button onClick={() => handleDeleteParticipant(p._id)} className="text-xs bg-red-500 text-white px-2 py-1 rounded">Del</button>
                    </div>
                ))}
            </div>
          </section>
        </div>

        {/* Col 2: Expense Entry */}
        <div className="lg:col-span-1 space-y-6">
           <section className={`bg-white rounded-lg shadow p-6 ${!selectedTrip ? 'opacity-50 pointer-events-none' : ''}`}>
              <h2 className="text-xl font-bold mb-4 border-b pb-2">3. Add Expense</h2>
              <form onSubmit={handleAddExpense} className="space-y-3">
                  <input placeholder="Title" value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} className="w-full p-2 border rounded" />
                  {/* CHANGED: $ to ₹ */}
                  <input type="number" placeholder="Amount (₹)" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="w-full p-2 border rounded" />
                  <div className="flex gap-2">
                      <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="flex-1 p-2 border rounded bg-white">
                          <option>Food</option><option>Transport</option><option>Lodging</option><option>Misc</option>
                      </select>
                      <select value={newExpense.payer} onChange={e => setNewExpense({...newExpense, payer: e.target.value})} className="flex-1 p-2 border rounded bg-white">
                          <option value="">-- Payer --</option>
                          {participants.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
                      </select>
                  </div>
                  <div className="text-sm font-medium">Split Between:</div>
                  {renderParticipantCheckboxes(newExpense.sharedBy, (name) => setNewExpense(prev => ({
                      ...prev,
                      sharedBy: prev.sharedBy.includes(name)
                          ? prev.sharedBy.filter(n => n !== name)
                          : [...prev.sharedBy, name]
                  })))}
                  <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 rounded">Add Expense</button>
              </form>
           </section>
        </div>

        {/* Col 3: Summary */}
        <div className="lg:col-span-1 space-y-6">
            <section className={`bg-white rounded-lg shadow p-6 sticky top-20 ${!selectedTrip ? 'opacity-50' : ''}`}>
                <h2 className="text-xl font-bold mb-4 border-b pb-2">4. Settlement</h2>
                <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                    {/* CHANGED: $ to ₹ */}
                    <div className="bg-blue-50 p-2 rounded"><div className="text-gray-600 text-xs">Total</div><div className="text-xl font-bold text-blue-800">₹{settlement.totalSpent.toFixed(2)}</div></div>
                    {/* CHANGED: $ to ₹ */}
                    <div className="bg-purple-50 p-2 rounded"><div className="text-gray-600 text-xs">Per Person</div><div className="text-xl font-bold text-purple-800">₹{participants.length ? (settlement.totalSpent/participants.length).toFixed(2) : 0}</div></div>
                </div>
                <div className="space-y-2 mb-6">
                    {!settlement.netPayments.length && <div className="text-green-600 font-medium text-center">All Settled! 🎉</div>}
                    {settlement.netPayments.map((p, i) => (
                        <div key={i} className="flex justify-between bg-red-50 p-2 rounded text-sm">
                            <span>{p.from} <span className="text-red-500 font-bold">→</span> {p.to}</span>
                            {/* CHANGED: $ to ₹ */}
                            <span className="font-bold text-red-800">₹{p.amount.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100"><tr><th className="p-2 text-left">Name</th><th className="p-2 text-right">Net</th></tr></thead>
                        <tbody>
                            {settlement.balances.map(b => (
                                <tr key={b.name} className="border-t">
                                    <td className="p-2">{b.name}</td>
                                    {/* CHANGED: $ to ₹ */}
                                    <td className={`p-2 text-right font-bold ${b.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{b.net.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
      </div>

      {/* Bottom: Logs */}
      <div className="mt-6">
          <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">5. Expense Log</h2>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                          <tr>
                              <th className="p-2 text-left">Title</th><th className="p-2 text-right">Amount</th>
                              <th className="p-2 text-left">Payer</th><th className="p-2 text-left">Shared</th><th className="p-2 text-center">Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {!expenses.length && <tr><td colSpan="5" className="p-4 text-center text-gray-500">No expenses.</td></tr>}
                          {expenses.map(e => (
                              <ExpenseRow 
                                key={e._id} 
                                expense={e} 
                                editingExpenseId={editingExpenseId}
                                editedExpense={editedExpense}
                                participants={participants}
                                onEdit={handleEditExpense}
                                onDelete={handleDeleteExpense}
                                onSave={handleSaveExpense}
                                onCancel={() => setEditingExpenseId(null)}
                                onEditChange={handleEditChange}
                                onCheckboxChange={handleEditCheckboxChange}
                              />
                          ))}
                      </tbody>
                  </table>
              </div>
          </section>
      </div>
    </div>
  );
}