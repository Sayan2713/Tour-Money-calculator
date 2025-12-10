import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

// ##################################################################
// #  HELPER COMPONENT: ExpenseRow (inline editing + split UI)
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
  onSplitValueChange,
  onCheckboxChange
}) => {
  const isEditing = editingExpenseId === expense._id;

  const renderSplitInputs = () => {
    if (editedExpense.splitType === 'EQUAL') {
      return (
        <div className="grid grid-cols-2 gap-1 max-h-24 overflow-y-auto">
          {participants.map(p => (
            <label key={p._id} className="flex items-center space-x-1 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={editedExpense.sharedBy?.includes(p.name)}
                onChange={() => onCheckboxChange(p.name)}
                className="rounded text-blue-600"
              />
              <span>{p.name}</span>
            </label>
          ))}
        </div>
      );
    } else {
      return (
        <div className="max-h-32 overflow-y-auto space-y-1">
          {participants.map(p => {
            const val = editedExpense.splitDetails?.[p.name]?.value || '';
            const item = editedExpense.splitDetails?.[p.name]?.item || '';
            return (
              <div key={p._id} className="flex items-center space-x-1">
                <span className="text-xs w-16 truncate">{p.name}</span>
                <input
                  type="number"
                  placeholder={editedExpense.splitType === 'PERCENT' ? '%' : '₹'}
                  className="w-16 p-1 border rounded text-xs"
                  value={val}
                  onChange={(e) => onSplitValueChange(p.name, 'value', e.target.value)}
                />
                {editedExpense.splitType === 'EXACT' && (
                  <input
                    type="text"
                    placeholder="Item"
                    className="w-20 p-1 border rounded text-xs"
                    value={item}
                    onChange={(e) => onSplitValueChange(p.name, 'item', e.target.value)}
                  />
                )}
              </div>
            );
          })}
        </div>
      );
    }
  };

  if (isEditing) {
    return (
      <tr className="bg-yellow-50 border-b">
        <td className="px-4 py-3 align-top">
          <input
            type="text"
            value={editedExpense.title || ''}
            onChange={(e) => onEditChange('title', e.target.value)}
            className="w-full p-1 border rounded mb-1 text-sm"
            placeholder="Title"
          />
          <select
            value={editedExpense.category}
            onChange={(e) => onEditChange('category', e.target.value)}
            className="w-full p-1 border rounded text-xs mb-1"
          >
            <option>Food</option>
            <option>Transport</option>
            <option>Lodging</option>
            <option>Misc</option>
            <option>Other</option>
          </select>

          {editedExpense.category === 'Other' && (
            <input
              type="text"
              value={editedExpense.otherCategory || ''}
              onChange={(e) => onEditChange('otherCategory', e.target.value)}
              className="w-full p-1 border rounded mb-1 text-xs"
              placeholder="Please specify other category"
            />
          )}

          <select
            value={editedExpense.splitType}
            onChange={(e) => onEditChange('splitType', e.target.value)}
            className="w-full p-1 border rounded text-xs bg-gray-50"
          >
            <option value="EQUAL">Equal</option>
            <option value="PERCENT">%</option>
            <option value="EXACT">₹</option>
          </select>
        </td>
        <td className="px-4 py-3 align-top">
          <input
            type="number"
            value={editedExpense.amount || ''}
            onChange={(e) => onEditChange('amount', e.target.value)}
            className="w-full p-1 border rounded text-right text-sm"
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
          {renderSplitInputs()}
        </td>
        <td className="px-4 py-3 align-top text-center space-y-2">
          <button onClick={onSave} className="block w-full text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded">Save</button>
          <button onClick={onCancel} className="block w-full text-xs bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded">Cancel</button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50 border-b">
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {expense.title}
        <div className="text-xs text-blue-500">{expense.category}</div>
        <span className="text-[10px] bg-gray-200 px-1 rounded text-gray-600">
          {expense.splitType === 'PERCENT' ? 'By %' : expense.splitType === 'EXACT' ? 'By ₹' : 'Equal'}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-700 font-medium text-right">₹{Number(expense.amount || 0).toFixed(2)}</td>
      <td className="px-4 py-3 text-sm text-gray-700">{expense.payer}</td>
      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
        <div className="truncate" title={(expense.sharedBy || []).join(', ')}>{(expense.sharedBy || []).join(', ')}</div>
        {(expense.splitType === 'PERCENT' || expense.splitType === 'EXACT') && (
          <div className="text-xs text-gray-500 mt-1">
            {(expense.splitDetails || []).map(d => (
              <div key={d.name}>{d.name}: {expense.splitType === 'PERCENT' ? `${d.value}%` : `₹${d.amount}`} {d.item ? `(${d.item})` : ''}</div>
            ))}
          </div>
        )}
      </td>
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
    otherCategory: '',
    payer: '',
    splitType: 'EQUAL',
    sharedBy: [],
    splitDetails: {}
  });

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('idle');
  const [inviteMsg, setInviteMsg] = useState('');

  const [loadingTrips, setLoadingTrips] = useState(true);
  const [error, setError] = useState(null);

  // Legacy alert (keeps previous UX)
  const showAlert = (message, type = 'success') => {
    setError({ message, type });
    setTimeout(() => setError(null), 3000);
  };

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchTrips();
    // ensure newExpense has required keys if component mounts with older state
    setNewExpense(prev => ({ splitType: 'EQUAL', splitDetails: {}, sharedBy: prev.sharedBy || participants.map(p => p.name), otherCategory: prev.otherCategory || '', ...prev }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Polling when trip selected ---
  useEffect(() => {
    if (!selectedTrip) return;

    const intervalId = setInterval(() => {
      api.get(`/participants/${selectedTrip._id}`).then(res => setParticipants(res.data)).catch(() => {});
      api.get(`/expenses/${selectedTrip._id}`).then(res => setExpenses(res.data)).catch(() => {});
    }, 5000);

    return () => clearInterval(intervalId);
  }, [selectedTrip]);

  // --- When trip changes fetch participants & expenses ---
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

  // When participants update and not editing, set default sharedBy for newExpense
  useEffect(() => {
    if (!editingExpenseId) {
      setNewExpense(prev => ({ ...prev, sharedBy: participants.map(p => p.name) }));
    }
  }, [participants, editingExpenseId]);

  // --- API helpers ---
  const fetchTrips = () => {
    setLoadingTrips(true);
    api.get('/trips/')
      .then(response => {
        setTrips(response.data || []);
        const lastId = localStorage.getItem('lastSelectedTripId');
        const foundTrip = (response.data || []).find(t => t._id === lastId);
        if (foundTrip) setSelectedTrip(foundTrip);
        else if ((response.data || []).length > 0) setSelectedTrip(response.data[0]);
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
      .then(response => setParticipants(response.data || []))
      .catch(() => showAlert('Error fetching participants.', 'warning'));
  };

  const fetchExpenses = (tripId) => {
    api.get(`/expenses/${tripId}`)
      .then(response => setExpenses(response.data || []))
      .catch(() => showAlert('Error fetching expenses.', 'warning'));
  };

  // --- Trips CRUD ---
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

  // --- Invitation ---
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

  // --- Participants ---
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

  // --- New Expense form: split UI handlers ---
  const handleSplitValueChange = (name, field, value) => {
    setNewExpense(prev => ({
      ...prev,
      splitDetails: { ...prev.splitDetails, [name]: { ...prev.splitDetails?.[name], [field]: value } }
    }));
  };

  const handleSubmitExpense = (e) => {
    e.preventDefault();
    const totalAmt = parseFloat(newExpense.amount);
    if (!newExpense.title || isNaN(totalAmt) || totalAmt <= 0) return showAlert('Invalid details', 'warning');

    const categoryToSend = newExpense.category === 'Other' ? (newExpense.otherCategory?.trim() || 'Other') : newExpense.category;

    let payload = {
      title: newExpense.title,
      amount: totalAmt,
      category: categoryToSend,
      payer: newExpense.payer,
      tripId: selectedTrip._id,
      splitType: newExpense.splitType
    };

    if (newExpense.splitType === 'EQUAL') {
      payload.sharedBy = newExpense.sharedBy || [];
      if (payload.sharedBy.length === 0) return showAlert('Select at least one person', 'warning');
    } else {
      let details = [];
      let runningTotal = 0;
      participants.forEach(p => {
        const input = newExpense.splitDetails?.[p.name];
        const val = parseFloat(input?.value || 0);
        if (val > 0) {
          let calculatedAmount = newExpense.splitType === 'PERCENT' ? (val / 100) * totalAmt : val;
          runningTotal += (newExpense.splitType === 'PERCENT' ? val : calculatedAmount);
          details.push({ name: p.name, value: val, amount: calculatedAmount, item: input?.item || '' });
        }
      });
      if (details.length === 0) return showAlert('Enter split details', 'warning');
      if (newExpense.splitType === 'PERCENT' && Math.abs(runningTotal - 100) > 0.1) return showAlert(`Total % is ${runningTotal}, must be 100%`, 'warning');
      if (newExpense.splitType === 'EXACT' && Math.abs(runningTotal - totalAmt) > 0.1) return showAlert(`Total split amount ₹${runningTotal} does not match expense ₹${totalAmt}`, 'warning');
      payload.splitDetails = details;
    }

    api.post('/expenses/add', payload).then(() => {
      setNewExpense({ title: '', amount: '', category: 'Food', otherCategory: '', payer: '', splitType: 'EQUAL', sharedBy: participants.map(p => p.name), splitDetails: {} });
      fetchExpenses(selectedTrip._id);
      showAlert('Saved!', 'success');
    }).catch(err => showAlert(err.response?.data?.Error || 'Error', 'error'));
  };

  // --- Inline editing handlers ---
  const handleEditExpense = (exp) => {
    setEditingExpenseId(exp._id);
    let detailsMap = {};
    if (exp.splitDetails && Array.isArray(exp.splitDetails)) exp.splitDetails.forEach(d => detailsMap[d.name] = { value: d.value, item: d.item });
    if (exp.splitDetails && !Array.isArray(exp.splitDetails) && typeof exp.splitDetails === 'object') {
      Object.keys(exp.splitDetails).forEach(k => {
        const d = exp.splitDetails[k];
        detailsMap[k] = { value: d.value || d.amount || '', item: d.item || '' };
      });
    }
    setEditedExpense({
      ...exp,
      splitType: exp.splitType || 'EQUAL',
      splitDetails: detailsMap,
      otherCategory: exp.category && !['Food', 'Transport', 'Lodging', 'Misc'].includes(exp.category) ? exp.category : ''
    });
  };

  const handleEditChange = (field, value) => setEditedExpense(prev => ({ ...prev, [field]: value }));

  const handleCheckboxChange = (name) => {
    setEditedExpense(prev => ({
      ...prev,
      sharedBy: prev.sharedBy.includes(name) ? prev.sharedBy.filter(n => n !== name) : [...prev.sharedBy, name]
    }));
  };

  const handleEditSplitValueChange = (name, field, value) => {
    setEditedExpense(prev => ({
      ...prev,
      splitDetails: {
        ...prev.splitDetails,
        [name]: { ...prev.splitDetails?.[name], [field]: value }
      }
    }));
  };

  const handleSaveEdit = () => {
    const totalAmt = parseFloat(editedExpense.amount);
    if (isNaN(totalAmt) || totalAmt <= 0) return showAlert('Invalid Amount', 'warning');

    const categoryToSend = editedExpense.category === 'Other' ? (editedExpense.otherCategory?.trim() || 'Other') : editedExpense.category;

    let payload = { ...editedExpense, amount: totalAmt, tripId: selectedTrip._id, category: categoryToSend };

    if (editedExpense.splitType !== 'EQUAL') {
      let details = [];
      participants.forEach(p => {
        const input = editedExpense.splitDetails?.[p.name];
        const val = parseFloat(input?.value || 0);
        if (val > 0) details.push({ name: p.name, value: val, amount: editedExpense.splitType === 'PERCENT' ? (val / 100) * totalAmt : val, item: input?.item || '' });
      });
      payload.splitDetails = details;
    }

    api.put(`/expenses/update/${editingExpenseId}`, payload)
      .then(() => { setEditingExpenseId(null); fetchExpenses(selectedTrip._id); showAlert('Updated!'); })
      .catch(err => showAlert('Update failed', 'error'));
  };

  const handleDeleteExpense = (id) => {
    if (!window.confirm('Delete expense?')) return;
    api.delete(`/expenses/delete/${id}`)
      .then(() => { fetchExpenses(selectedTrip._id); showAlert('Expense deleted.', 'success'); })
      .catch(err => showAlert(err.response?.data?.Error || 'Error', 'error'));
  };

  // --- Settlement calculation (fix: include historical names referenced by expenses) ---
  const settlement = useMemo(() => {
    if (!expenses.length) return { netPayments: [], totalSpent: 0, balances: [] };

    const currentNames = participants.map(p => p.name);
    const namesFromExpenses = new Set();

    expenses.forEach(e => {
      if (e.payer) namesFromExpenses.add(e.payer);
      (e.sharedBy || []).forEach(n => namesFromExpenses.add(n));
      if (e.splitDetails && Array.isArray(e.splitDetails)) {
        e.splitDetails.forEach(d => { if (d && d.name) namesFromExpenses.add(d.name); });
      } else if (e.splitDetails && typeof e.splitDetails === 'object') {
        Object.keys(e.splitDetails).forEach(k => namesFromExpenses.add(k));
      }
    });

    const allNamesSet = new Set([...currentNames, ...Array.from(namesFromExpenses)]);
    const allNames = Array.from(allNamesSet);
    if (!allNames.length) return { netPayments: [], totalSpent: 0, balances: [] };

    const matrix = {};
    const totalSpent = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    allNames.forEach(p => { matrix[p] = {}; allNames.forEach(q => matrix[p][q] = 0); });

    expenses.forEach(e => {
      if (e.splitType === 'EQUAL' || !e.splitType) {
        const valid = (e.sharedBy || []).filter(n => allNamesSet.has(n));
        if (!valid.length) return;
        const split = (parseFloat(e.amount) || 0) / valid.length;
        valid.forEach(pn => { if (pn !== e.payer && allNamesSet.has(e.payer)) matrix[pn][e.payer] += split; });
      } else {
        if (e.splitDetails) {
          if (Array.isArray(e.splitDetails)) {
            e.splitDetails.forEach(d => {
              if (d.name !== e.payer && allNamesSet.has(d.name) && allNamesSet.has(e.payer)) matrix[d.name][e.payer] += (parseFloat(d.amount) || 0);
            });
          } else {
            Object.keys(e.splitDetails).forEach(nameKey => {
              const d = e.splitDetails[nameKey];
              const amt = parseFloat(d?.amount || d?.value || 0);
              if (nameKey !== e.payer && allNamesSet.has(nameKey) && allNamesSet.has(e.payer)) matrix[nameKey][e.payer] += amt;
            });
          }
        }
      }
    });

    const netPayments = [];
    const checked = new Set();
    allNames.forEach(p => {
      allNames.forEach(q => {
        if (p === q || checked.has(`${p}-${q}`) || checked.has(`${q}-${p}`)) return;
        const net = matrix[p][q] - matrix[q][p];
        if (net > 0.01) netPayments.push({ from: p, to: q, amount: net });
        else if (net < -0.01) netPayments.push({ from: q, to: p, amount: -net });
        checked.add(`${p}-${q}`);
      });
    });

    const balances = allNames.map(pName => {
      const paid = expenses.filter(e => e.payer === pName).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      let share = 0;
      expenses.forEach(e => {
        if (e.splitType === 'EQUAL' || !e.splitType) {
          const validSharers = (e.sharedBy || []).filter(n => allNamesSet.has(n));
          if (validSharers.includes(pName)) share += (parseFloat(e.amount) || 0) / validSharers.length;
        } else {
          if (Array.isArray(e.splitDetails)) {
            const d = e.splitDetails.find(x => x.name === pName);
            if (d) share += (parseFloat(d.amount) || 0);
          } else if (e.splitDetails && e.splitDetails[pName]) {
            const d = e.splitDetails[pName];
            share += (parseFloat(d.amount || d.value) || 0);
          }
        }
      });
      return { name: pName, paid, share, net: paid - share };
    });

    return { netPayments, totalSpent, balances };
  }, [expenses, participants]);

  // --- Render helpers ---
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
  };

  // --- JSX ---
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
        {/* Column 1: Trips & Participants */}
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
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTrip(t._id) }} className="text-xs bg-red-500 text-white px-2 py-1 rounded">Del</button>
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

        {/* Column 2: Add Expense (upgraded UI) */}
        <div className="lg:col-span-1 space-y-6">
          <section className={`bg-white rounded-lg shadow p-6 ${!selectedTrip ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">3. Add Expense</h2>
            <form onSubmit={handleSubmitExpense} className="space-y-3">
              <input placeholder="Title" className="w-full p-2 border rounded" value={newExpense.title} onChange={e => setNewExpense({ ...newExpense, title: e.target.value })} />
              <input type="number" placeholder="Amount (₹)" className="w-full p-2 border rounded" value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })} />

              <div className="flex gap-2">
                <select className="flex-1 p-2 border rounded" value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value, otherCategory: '' })}>
                  <option>Food</option>
                  <option>Transport</option>
                  <option>Lodging</option>
                  <option>Misc</option>
                  <option>Other</option>
                </select>
                <select className="flex-1 p-2 border rounded" value={newExpense.payer} onChange={e => setNewExpense({ ...newExpense, payer: e.target.value })}>
                  <option value="">-- Payer --</option>
                  {participants.map(p => <option key={p._id} value={p.name}>{p.name}</option>)}
                </select>
              </div>

              {newExpense.category === 'Other' && (
                <input
                  type="text"
                  placeholder="Please specify other category"
                  className="w-full p-2 border rounded"
                  value={newExpense.otherCategory || ''}
                  onChange={e => setNewExpense(prev => ({ ...prev, otherCategory: e.target.value }))}
                />
              )}

              <div className="mt-2">
                <label className="text-sm font-bold">Split Type:</label>
                <select className="w-full p-2 border rounded mt-1 bg-gray-50" value={newExpense.splitType} onChange={e => setNewExpense({ ...newExpense, splitType: e.target.value })}>
                  <option value="EQUAL">Split Equally</option>
                  <option value="PERCENT">Split by Percentage (%)</option>
                  <option value="EXACT">Split by Amount (₹)</option>
                </select>
              </div>

              {/* NEW: "Split Between" label */}
              <div className="mt-2 text-sm font-medium">Split Between:</div>

              {participants.length > 0 && (
                <div className="border p-2 rounded max-h-48 overflow-y-auto mt-2 bg-gray-50">
                  {participants.map(p => (
                    <div key={p._id} className="flex items-center justify-between mb-2">
                      <span className="text-sm w-20 truncate">{p.name}</span>

                      {newExpense.splitType === 'EQUAL' && (
                        <input type="checkbox" checked={newExpense.sharedBy?.includes(p.name)} onChange={() => { const cur = newExpense.sharedBy || []; setNewExpense({ ...newExpense, sharedBy: cur.includes(p.name) ? cur.filter(n => n !== p.name) : [...cur, p.name] }) }} />
                      )}

                      {newExpense.splitType === 'PERCENT' && (
                        <div className="flex items-center gap-1">
                          <input type="number" placeholder="%" className="w-16 p-1 border rounded text-xs" value={newExpense.splitDetails?.[p.name]?.value || ''} onChange={e => handleSplitValueChange(p.name, 'value', e.target.value)} />
                          <span className="text-xs">%</span>
                        </div>
                      )}

                      {newExpense.splitType === 'EXACT' && (
                        <div className="flex gap-1 flex-1 justify-end">
                          <input type="number" placeholder="₹" className="w-16 p-1 border rounded text-xs" value={newExpense.splitDetails?.[p.name]?.value || ''} onChange={e => handleSplitValueChange(p.name, 'value', e.target.value)} />
                          <input type="text" placeholder="Item" className="w-20 p-1 border rounded text-xs" value={newExpense.splitDetails?.[p.name]?.item || ''} onChange={e => handleSplitValueChange(p.name, 'item', e.target.value)} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 rounded">Add Expense</button>
            </form>
          </section>
        </div>

        {/* Column 3: Settlement (upgraded UI) */}
        <div className="lg:col-span-1 space-y-6">
          <section className={`bg-white rounded-lg shadow p-6 sticky top-20 ${!selectedTrip ? 'opacity-50' : ''}`}>
            <h2 className="text-xl font-bold mb-4 border-b pb-2">4. Settlement</h2>
            <div className="grid grid-cols-2 gap-4 mb-4 text-center">
              <div className="bg-blue-50 p-2 rounded"><div className="text-gray-600 text-xs">Total</div><div className="text-xl font-bold text-blue-800">₹{settlement.totalSpent.toFixed(2)}</div></div>
              <div className="bg-purple-50 p-2 rounded"><div className="text-gray-600 text-xs">Per Person</div><div className="text-xl font-bold text-purple-800">₹{(settlement.totalSpent / Math.max(1, settlement.balances.length)).toFixed(2)}</div></div>
            </div>
            <div className="space-y-2 mb-6">
              {!settlement.netPayments.length && <div className="text-green-600 font-medium text-center">All Settled! 🎉</div>}
              {settlement.netPayments.map((p, i) => (
                <div key={i} className="flex justify-between bg-red-50 p-2 rounded text-sm">
                  <span>{p.from} <span className="text-red-500 font-bold">→</span> {p.to}</span>
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
                      <td className={`p-2 text-right font-bold ${b.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{b.net.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {/* Bottom: Expense Log (inline editing restored) */}
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
                    onEdit={(exp) => handleEditExpense(exp)}
                    onDelete={handleDeleteExpense}
                    onSave={() => handleSaveEdit()}
                    onCancel={() => setEditingExpenseId(null)}
                    onEditChange={(f, v) => setEditedExpense(prev => ({ ...prev, [f]: v }))}
                    onCheckboxChange={(name) => {
                      setEditedExpense(prev => ({
                        ...prev,
                        sharedBy: prev.sharedBy.includes(name) ? prev.sharedBy.filter(n => n !== name) : [...prev.sharedBy, name]
                      }));
                    }}
                    onSplitValueChange={(name, field, value) => {
                      setEditedExpense(prev => ({
                        ...prev,
                        splitDetails: {
                          ...prev.splitDetails,
                          [name]: { ...prev.splitDetails?.[name], [field]: value }
                        }
                      }));
                    }}
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

