import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api'; // Using your api instance
import '../AuthStyles.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=Init, 2=OTP, 3=Reset
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [form, setForm] = useState({
    email: '', dob: '', otp: '', newPassword: '', confirmPassword: ''
  });

  const handleChange = (e) => setForm({...form, [e.target.name]: e.target.value});

  // --- STEP 1: Send OTP ---
  const handleStep1 = async () => {
    setLoading(true); setMsg({});
    try {
        await api.post('/auth/forgot-init', { email: form.email, dob: form.dob });
        setStep(2);
        setMsg({ type: 'success', text: 'OTP sent to your email!' });
    } catch (err) {
        setMsg({ type: 'error', text: err.response?.data?.msg || 'Failed to find user' });
    }
    setLoading(false);
  };

  // --- STEP 2: Verify OTP ---
  const handleStep2 = async () => {
    setLoading(true); setMsg({});
    try {
        await api.post('/auth/forgot-verify', { email: form.email, otp: form.otp });
        setStep(3);
        setMsg({ type: 'success', text: 'OTP Verified. Set new password.' });
    } catch (err) {
        setMsg({ type: 'error', text: err.response?.data?.msg || 'Invalid OTP' });
    }
    setLoading(false);
  };

  // --- STEP 3: Reset Password ---
  const handleStep3 = async () => {
    if(form.newPassword !== form.confirmPassword) {
        setMsg({ type:'error', text: "Passwords don't match"}); return;
    }
    setLoading(true); setMsg({});
    try {
        await api.post('/auth/forgot-reset', { email: form.email, otp: form.otp, newPassword: form.newPassword });
        setMsg({ type: 'success', text: 'Password Reset! Redirecting...' });
        setTimeout(() => navigate('/auth'), 2000);
    } catch (err) {
        setMsg({ type: 'error', text: err.response?.data?.msg || 'Failed to reset' });
    }
    setLoading(false);
  };

  // --- Helpers ---
  const EyeIcon = () => (
    <svg onClick={() => setShowPass(!showPass)} className="eye-btn" viewBox="0 0 24 24">
      {showPass ? <path fill="#03364a" d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12zm10 4a4 4 0 100-8 4 4 0 000 8z"/> : <path fill="#03364a" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z"/>}
    </svg>
  );

  return (
    <div className="auth-container">
      <div className="glass-card" style={{ height: '450px' }}>
        <div className="inner-slider" style={{ height: '300%', top: step === 1 ? '0%' : step === 2 ? '-100%' : '-200%' }}>
            
            {/* STEP 1 */}
            <div style={{ height: '33.33%', padding: '40px 35px', textAlign:'center' }}>
                <h2 className="auth-h2">Forgot Password</h2>
                {msg.text && <div className={`error-msg ${msg.type === 'success' ? 'bg-green-100 text-green-700':''}`}>{msg.text}</div>}
                
                <div className="input-group"><input className="auth-input" name="email" placeholder="Email Address" onChange={handleChange} /></div>
                <div className="input-group"><input className="auth-input" name="dob" type="date" onChange={handleChange} /></div>
                
                <button className="auth-btn" onClick={handleStep1} disabled={loading}>{loading ? 'Checking...' : 'Next'}</button>
                <p className="link-text" onClick={() => navigate('/auth')} style={{cursor:'pointer', textDecoration:'underline'}}>Back to Login</p>
            </div>

            {/* STEP 2 */}
            <div style={{ height: '33.33%', padding: '40px 35px', textAlign:'center' }}>
                <h2 className="auth-h2">Verify OTP</h2>
                {msg.text && <div className={`error-msg ${msg.type === 'success' ? 'bg-green-100 text-green-700':''}`}>{msg.text}</div>}

                <div className="input-group"><input className="auth-input" name="otp" placeholder="Enter 6-digit OTP" onChange={handleChange} /></div>
                
                <button className="auth-btn" onClick={handleStep2} disabled={loading}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
                <p className="link-text" onClick={() => setStep(1)} style={{cursor:'pointer', textDecoration:'underline'}}>← Go Back</p>
            </div>

            {/* STEP 3 */}
            <div style={{ height: '33.33%', padding: '40px 35px', textAlign:'center' }}>
                <h2 className="auth-h2">Reset Password</h2>
                {msg.text && <div className={`error-msg ${msg.type === 'success' ? 'bg-green-100 text-green-700':''}`}>{msg.text}</div>}

                <div className="input-group">
                    <input className="auth-input" name="newPassword" type={showPass?"text":"password"} placeholder="New Password" onChange={handleChange} />
                    <EyeIcon />
                </div>
                <div className="input-group">
                    <input className="auth-input" name="confirmPassword" type={showPass?"text":"password"} placeholder="Confirm Password" onChange={handleChange} />
                    <EyeIcon />
                </div>

                <button className="auth-btn" onClick={handleStep3} disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</button>
            </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;