import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google'; // <--- NEW IMPORT
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css'; 

// REPLACE THIS STRING WITH YOUR ACTUAL GOOGLE CLIENT ID
const GOOGLE_CLIENT_ID = "586809076512-5n2ccogkcsff5p48b7rleib1upfphqv8.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}> {/* <--- WRAPPER */}
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);