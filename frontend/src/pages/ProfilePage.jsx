import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/PageContainer';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: '',
    dob: '',
    mobile: '',
    profilePicture: ''
  });

  // --- Load Data ---
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    api.get('/users')
      .then(res => {
        const d = res.data;
        // Format DOB for input type="date" (YYYY-MM-DD)
        let formattedDob = '';
        if (d.dob) {
            formattedDob = new Date(d.dob).toISOString().split('T')[0];
        }
        
        setFormData({
            name: d.name || '',
            email: d.email || '',
            gender: d.gender || '',
            dob: formattedDob,
            mobile: d.mobile || '',
            profilePicture: d.profilePicture || '',
            createdAt: d.createdAt // Keep this separate, not editable
        });
        setLoading(false);
      })
      .catch(err => setLoading(false));
  };

  // --- Handlers ---
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle Image File Selection -> Convert to Base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        // Limit size (e.g., 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setMsg({ type: 'error', text: 'Image too large (Max 2MB)' });
            return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, profilePicture: reader.result }));
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    
    api.put('/users/update', formData)
        .then(res => {
            setMsg({ type: 'success', text: 'Profile updated successfully!' });
            // Optional: Force reload page to update Navbar image if changed
            
        })
        .catch(err => setMsg({ type: 'error', text: 'Failed to update profile.' }));
  };

  const handleDeleteAccount = () => {
      if (window.confirm("ARE YOU SURE? This will delete your account and cannot be undone.")) {
          api.delete('/users/delete')
            .then(() => {
                alert("Account deleted.");
                logout();
            })
            .catch(err => alert("Failed to delete account."));
      }
  }

  if (loading) return <PageContainer title="My Profile"><p>Loading...</p></PageContainer>;

  return (
    <PageContainer title="My Profile">
      <div className="max-w-3xl mx-auto">
        {msg.text && (
            <div className={`p-3 rounded mb-4 ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {msg.text}
            </div>
        )}

        <form onSubmit={handleSave} className="bg-white rounded-lg border p-6">
            
            {/* --- Header: Image & Email --- */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 border-b pb-6">
                <div className="relative">
                    <img 
                        src={formData.profilePicture || "https://via.placeholder.com/150?text=No+Img"} 
                        alt="Profile" 
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow"
                    />
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                </div>
                <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-bold text-gray-800">{formData.name || "User"}</h2>
                    <p className="text-gray-500">{formData.email}</p>
                    <p className="text-xs text-gray-400 mt-1">Joined: {new Date(formData.createdAt).toLocaleDateString()}</p>
                </div>
            </div>

            {/* --- Form Fields --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                    <input name="mobile" value={formData.mobile} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" placeholder="+91..." />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Email (Cannot change)</label>
                     <input disabled value={formData.email} className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed" />
                </div>
            </div>

            {/* --- Actions --- */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
                <button type="button" onClick={handleDeleteAccount} className="text-red-600 hover:text-red-800 text-sm font-semibold">
                    Delete Account
                </button>

                <div className="flex gap-3">
                    <button type="button" onClick={() => navigate('/password')} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
                        Change Password
                    </button>
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold shadow">
                        Save Changes
                    </button>
                </div>
            </div>
        </form>
      </div>
    </PageContainer>
  );
};

export default ProfilePage;