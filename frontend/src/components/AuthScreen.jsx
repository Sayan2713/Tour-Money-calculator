import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../api';
import '../AuthStyles.css';

const AuthScreen = () => {
  const { login } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true); 
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState('');

  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    name: '', mobile: '', dob: ''
  });

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const res = await axios.post(`${API_BASE_URL}/auth/google`, {
          accessToken: tokenResponse.access_token
        });
        login(res.data.token);
      } catch (err) {
        setError('Google Login Failed. Try again.');
        setLoading(false);
      }
    },
    onError: () => setError('Google Login Failed')
  });

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if(formData.password !== formData.confirmPassword) { setError("Passwords do not match"); setLoading(false); return; }
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/signup`, formData);
      console.log("Signup Response data : ",response.data);
      setIsVerifying(true); setError('');
    } catch (err) { setError(err.response?.data?.msg || 'Signup failed'); }
    setLoading(false);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
       const response = await axios.post(`${API_BASE_URL}/auth/signup-verify`, { email: formData.email, otp: otp });
       console.log("Verification Response data : ",response.data);
       login(response.data.token);
    } catch (err) { setError(err.response?.data?.msg || 'Verification failed'); }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, { email: formData.email, password: formData.password });
      console.log("Response data : ",response.data);
      login(response.data.token);
    } catch (err) { setError(err.response?.data?.msg || 'Login failed'); }
    setLoading(false);
  };

  // --- 1. Eye Icon ---
  const EyeIcon = () => (
    <button type="button" onClick={() => setShowPass(!showPass)} className="eye-btn" tabIndex="-1">
      {showPass ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#03364a">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#03364a">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
    </button>
  );

  // --- 2. NEW: Google Icon (Inline SVG) ---
  const GoogleIcon = () => (
    <svg viewBox="0 0 48 48" width="20px" height="20px">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );

  return (
    <div className="auth-container">
      <div className="glass-card" style={{ height: '620px' }}>
        <div className="inner-slider" style={{ height: '200%', top: isLoginMode ? '0%' : '-100%' }}>

          {/* === LOGIN PANEL === */}
          <div style={{ height: '50%', padding: '40px 35px', display:'flex', flexDirection:'column', justifyContent:'center', textAlign:'center' }}>
            <h2 className="auth-h2">Welcome Back</h2>
            {error && <div className="error-msg">{error}</div>}

            <form onSubmit={handleLogin}>
                <div className="input-group"><input className="auth-input" name="email" type="text" placeholder="Email Address" onChange={handleChange} required /></div>
                <div className="input-group">
                    <input className="auth-input" name="password" type={showPass ? "text" : "password"} placeholder="Password" onChange={handleChange} required />
                    <EyeIcon />
                </div>
                <div style={{textAlign:'right', fontSize:'13px', marginTop:'5px'}}>
                    <Link to="/forgot-password" style={{color:'#064a5a', textDecoration:'underline'}}>Forgot Password?</Link>
                </div>
                <button type="submit" className="auth-btn" disabled={loading}>{loading ? 'Processing...' : 'Login'}</button>
            </form>

            {/* --- UPDATED GOOGLE BUTTON --- */}
            <button type="button" onClick={() => handleGoogleLogin()} className="auth-btn google-btn">
                <GoogleIcon />
                Sign in with Google
            </button>

            <p className="link-text">No account? <span className="link-span" onClick={() => {setIsLoginMode(false); setError(''); setIsVerifying(false);}}>Signup</span></p>
          </div>

          {/* === SIGNUP PANEL === */}
          <div style={{ height: '50%', padding: '40px 35px', overflowY:'auto', textAlign:'center' }}>
            {isVerifying ? (
               <>
                 <h2 className="auth-h2">Verify Email</h2>
                 <p className="text-sm text-gray-600 mb-4">We sent a code to <strong>{formData.email}</strong></p>
                 {error && <div className="error-msg">{error}</div>}
                 <form onSubmit={handleVerify}>
                    <div className="input-group"><input className="auth-input" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-Digit OTP" required /></div>
                    <button type="submit" className="auth-btn" disabled={loading}>{loading ? 'Verifying...' : 'Verify & Login'}</button>
                 </form>
                 <p className="link-text" onClick={() => setIsVerifying(false)} style={{cursor:'pointer', textDecoration:'underline'}}>← Back</p>
               </>
            ) : (
               <>
                 <h2 className="auth-h2">Create Account</h2>
                 {error && <div className="error-msg">{error}</div>}
                 <form onSubmit={handleSignup}>
                    <div className="input-group"><input className="auth-input" name="name" type="text" placeholder="Full Name" onChange={handleChange} required /></div>
                    <div className="input-group"><input className="auth-input" name="email" type="email" placeholder="Email ID" onChange={handleChange} required /></div>
                    <div className="input-group"><input className="auth-input" name="mobile" type="tel" placeholder="Phone Number" onChange={handleChange} required /></div>
                    <div className="input-group"><input className="auth-input" name="dob" type="date" onChange={handleChange} required /></div>
                    <div className="input-group"><input className="auth-input" name="password" type={showPass ? "text" : "password"} placeholder="Password" onChange={handleChange} required /><EyeIcon /></div>
                    <div className="input-group"><input className="auth-input" name="confirmPassword" type={showPass ? "text" : "password"} placeholder="Confirm Password" onChange={handleChange} required /><EyeIcon /></div>
                    <button type="submit" className="auth-btn" disabled={loading}>{loading ? 'Processing...' : 'Register'}</button>
                 </form>
                 
                 {/* --- UPDATED GOOGLE BUTTON --- */}
                 <button type="button" onClick={() => handleGoogleLogin()} className="auth-btn google-btn">
                    <GoogleIcon />
                    Sign up with Google
                 </button>

                 <p className="link-text">Already registered? <span className="link-span" onClick={() => {setIsLoginMode(true); setError('');}}>Login</span></p>
               </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthScreen;