import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const AcceptInvitePage = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  let tokenFromUrl = searchParams.get('token');
  const { token: authToken } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [msg, setMsg] = useState('');

  // If no token in query, also try to get it from hash (for HashRouter link)
  useEffect(() => {
    if (!tokenFromUrl) {
      // hash might be like "#/accept-invite?token=xxxx"
      const hash = location.hash || window.location.hash || '';
      if (hash.includes('?')) {
        const maybeQuery = hash.split('?')[1] || '';
        const params = new URLSearchParams(maybeQuery);
        tokenFromUrl = params.get('token');
      }
    }

    // Also try any saved postLoginRedirect
    if (!tokenFromUrl) {
      const saved = localStorage.getItem('postLoginRedirect') || '';
      if (saved && saved.includes('?')) {
        const params = new URLSearchParams(saved.split('?')[1] || '');
        tokenFromUrl = params.get('token');
      }
    }
    // We don't set state here because we will rely on tokenFromUrl variable for checks below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the link is broken (no token anywhere), go home
  if (!tokenFromUrl) return <Navigate to="/" />;

  // Save invite link before redirecting to login so we can come back
  const handleLoginRedirect = () => {
    localStorage.setItem('postLoginRedirect', window.location.pathname + window.location.search + window.location.hash);
    navigate('/auth'); // adjust if your login route differs
  };

  // If user is NOT logged in, show login prompt
  if (!authToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <h2 className="text-2xl font-bold text-blue-600 mb-4">Trip Invitation</h2>
          <p className="text-gray-700 mb-6">You have been invited to a trip! Please log in or sign up to accept.</p>
          <button
            onClick={handleLoginRedirect}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // After login: if we were redirected from saved redirect, ensure token is present in URL
  useEffect(() => {
    const saved = localStorage.getItem('postLoginRedirect');
    if (saved) {
      try {
        const savedParams = new URLSearchParams(saved.split('?')[1] || '');
        const savedToken = savedParams.get('token');
        const currentToken = new URLSearchParams(window.location.search).get('token') || (window.location.hash.includes('?') ? new URLSearchParams(window.location.hash.split('?')[1]).get('token') : null);
        if (savedToken && !currentToken) {
          localStorage.removeItem('postLoginRedirect');
          navigate(saved);
          return;
        } else {
          localStorage.removeItem('postLoginRedirect');
        }
      } catch (e) {
        localStorage.removeItem('postLoginRedirect');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const handleJoin = async () => {
    setStatus('loading');
    setMsg('');
    try {
      // Try the accept endpoint paths commonly used
      const pathsToTry = ['/invitations/accept', '/invitation/accept', '/accept', '/invitation/accept', '/invitation/accept'];
      let response = null;
      let lastError = null;

      for (const p of pathsToTry) {
        try {
          response = await api.post(p, { token: tokenFromUrl }, {
            headers: { Authorization: `Bearer ${authToken}` }
          });
          if (response && response.data) break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!response) {
        throw lastError || new Error('Failed to reach accept endpoint');
      }

      setStatus('success');
      setTimeout(() => {
        if (response.data?.tripId) navigate(`/trip/${response.data.tripId}`);
        else navigate('/');
      }, 1200);
    } catch (err) {
      setStatus('error');
      setMsg(err.response?.data?.msg || err.message || 'Failed to join trip.');
    }
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
            <p>Redirecting...</p>
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
