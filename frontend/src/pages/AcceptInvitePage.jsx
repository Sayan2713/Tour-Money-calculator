import React, { useState } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { token: authToken } = useAuth();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [msg, setMsg] = useState('');

  // If the link is broken (no token), go home
  if (!token) return <Navigate to="/" />;

  // If user is NOT logged in, show a message
  if (!authToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-2xl font-bold text-blue-600 mb-4">Trip Invitation</h2>
          <p className="text-gray-700 mb-6">You have been invited to a trip! Please log in or sign up to accept.</p>
          <button 
            onClick={() => navigate('/auth')}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleJoin = () => {
    setStatus('loading');
    api.post('/invitations/accept', { token })
      .then(res => {
        setStatus('success');
        // After 2 seconds, go to the dashboard
        setTimeout(() => navigate('/'), 2000);
      })
      .catch(err => {
        setStatus('error');
        setMsg(err.response?.data?.msg || 'Failed to join trip.');
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Join Trip</h2>
        
        {status === 'idle' && (
          <>
            <p className="text-gray-600 mb-6">You've been invited to collaborate on a trip.</p>
            <button 
              onClick={handleJoin}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded transition"
            >
              Accept Invitation
            </button>
          </>
        )}

        {status === 'loading' && <p className="text-blue-500">Processing...</p>}
        
        {status === 'success' && (
          <div className="text-green-600">
            <p className="font-bold text-xl mb-2">Success! 🎉</p>
            <p>Redirecting to your dashboard...</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-red-600">
             <p className="font-bold">Error</p>
             <p>{msg}</p>
             <button onClick={() => navigate('/')} className="mt-4 text-sm text-gray-500 underline">Go Home</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptInvitePage;