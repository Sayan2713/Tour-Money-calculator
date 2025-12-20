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

  const [subscription, setSubscription] = useState({
    plan: 'free',
    expiresAt: null,
    daysLeft: null
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    gender: '',
    dob: '',
    mobile: '',
    profilePicture: '',
    createdAt: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    api.get('/users')
      .then(res => {
        const d = res.data;

        let formattedDob = '';
        if (d.dob) formattedDob = new Date(d.dob).toISOString().split('T')[0];

        let daysLeft = null;
        if (d.subscriptionExpiresAt) {
          daysLeft = Math.ceil(
            (new Date(d.subscriptionExpiresAt) - new Date()) /
            (1000 * 60 * 60 * 24)
          );
        }

        setSubscription({
          plan: d.subscriptionPlan || 'free',
          expiresAt: d.subscriptionExpiresAt,
          daysLeft
        });

        setFormData({
          name: d.name || '',
          email: d.email || '',
          gender: d.gender || '',
          dob: formattedDob,
          mobile: d.mobile || '',
          profilePicture: d.profilePicture || '',
          createdAt: d.createdAt
        });

        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'Image too large (Max 2MB)' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profilePicture: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    api.put('/users/update', formData)
      .then(() => setMsg({ type: 'success', text: 'Profile updated successfully!' }))
      .catch(() => setMsg({ type: 'error', text: 'Failed to update profile.' }));
  };

  const handleDeleteAccount = () => {
    if (window.confirm("ARE YOU SURE? This will delete your account permanently.")) {
      api.delete('/users/delete')
        .then(() => {
          alert("Account deleted.");
          logout();
        })
        .catch(() => alert("Failed to delete account."));
    }
  };

  if (loading) {
    return <PageContainer title="My Profile"><p>Loading...</p></PageContainer>;
  }

  const isExpired =
    subscription.expiresAt &&
    new Date() > new Date(subscription.expiresAt);

  const showRenew =
    (isExpired || (subscription.daysLeft !== null && subscription.daysLeft <= 5));

  const planBadge = {
    free: 'bg-gray-100 text-gray-700',
    basic: 'bg-blue-100 text-blue-700',
    advance: 'bg-purple-100 text-purple-700',
    premium: 'bg-yellow-100 text-yellow-800'
  };

  const planIcon = {
    basic: '🤗',
    advance: '🚀',
    premium: '👑',
    free: '🆓'
  };

  return (
    <PageContainer title="My Profile">
      <div className="max-w-3xl mx-auto">

        {/* HEADER WITH SUBSCRIPTION ON RIGHT */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8 border-b pb-6 bg-white p-6 rounded-lg">

          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={formData.profilePicture || "https://via.placeholder.com/150"}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border-4 shadow"
              />
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer">
                <input type="file" hidden accept="image/*" onChange={handleImageChange} />
                ✎
              </label>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {formData.name || 'User'}
              </h2>
              <p className="text-gray-500">{formData.email}</p>
              <p className="text-xs text-gray-400 mt-1">
                Joined: {new Date(formData.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="text-center lg:text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${planBadge[subscription.plan]}`}>
              {planIcon[subscription.plan]} {subscription.plan.toUpperCase()} PLAN
            </span>

            {subscription.expiresAt && !isExpired && (
              <p className="text-sm text-gray-600 mt-1">
                Expires on {new Date(subscription.expiresAt).toLocaleDateString()}
              </p>
            )}

            {subscription.daysLeft !== null && !isExpired && (
              <p className={`text-sm font-medium ${subscription.daysLeft <= 5 ? 'text-red-600' : 'text-orange-600'}`}>
                {subscription.daysLeft} day(s) left
              </p>
            )}

            {isExpired && (
              <p className="text-sm font-bold text-red-600 mt-1">
                ❌ Subscription Expired
              </p>
            )}

            {showRenew && (
              <button
                onClick={() => navigate('/subscription')}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold"
              >
                Renew Now
              </button>
            )}
          </div>
        </div>

        {msg.text && (
          <div className={`p-3 rounded mb-4 ${msg.type === 'success'
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'}`}>
            {msg.text}
          </div>
        )}

        {/* PROFILE FORM */}
        <form onSubmit={handleSave} className="bg-white rounded-lg border p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="p-2 border rounded" />
            <input name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Mobile" className="p-2 border rounded" />
            <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="p-2 border rounded" />
            <select name="gender" value={formData.gender} onChange={handleChange} className="p-2 border rounded">
              <option value="">Select Gender</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
            <input disabled value={formData.email} className="p-2 border rounded bg-gray-100" />
          </div>

          <div className="flex justify-between items-center pt-6 border-t">
            <button type="button" onClick={handleDeleteAccount} className="text-red-600 font-semibold">
              Delete Account
            </button>

            <div className="flex gap-3">
              <button type="button" onClick={() => navigate('/password')} className="px-4 py-2 border rounded">
                Change Password
              </button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded font-bold">
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
