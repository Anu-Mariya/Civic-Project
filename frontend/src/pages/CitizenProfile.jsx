import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import { Award, CheckCircle, Save, Sparkles } from 'lucide-react';

export default function CitizenProfile() {
  const { refreshProfile } = useAuth();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    rewardPoints: 0,
  });
  const [stats, setStats] = useState({
    totalComplaints: 0,
    resolvedComplaints: 0,
    upvotesGiven: 0,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        const u = res.data.user;
        setProfileData({
          name: u.name || '',
          email: u.email || '',
          phone: u.phone || '',
          address: u.address || '',
          rewardPoints: u.rewardPoints || 0,
        });
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error('Failed to load profile:', err.message);
      }
    };

    loadProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await api.put('/auth/profile', {
        name: profileData.name,
        phone: profileData.phone,
        address: profileData.address,
      });
      await refreshProfile();
      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Gamification Rank calculation
  let civicRank = 'Civic Cadet';
  if (profileData.rewardPoints >= 100) civicRank = 'Civic Champion';
  else if (profileData.rewardPoints >= 50) civicRank = 'Neighborhood Guardian';
  else if (profileData.rewardPoints >= 20) civicRank = 'Active Citizen';

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Profile Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-md">
            {profileData.name ? profileData.name[0].toUpperCase() : 'C'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">{profileData.name}</h1>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
                {civicRank}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{profileData.email}</p>
          </div>
        </div>

        {/* Reward Points Card */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 sm:p-5 rounded-2xl shadow-md flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl">
            <Award className="w-8 h-8 fill-white text-white" />
          </div>
          <div>
            <span className="text-xs text-amber-100 font-bold uppercase block">Civic Reward Balance</span>
            <span className="text-3xl font-black tracking-tight">{profileData.rewardPoints} Pts</span>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Rewards System Explanation (Academic Rubric) */}
      <div className="bg-amber-50/60 rounded-3xl border border-amber-200/80 p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-900">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <h3 className="font-bold text-sm">Civic Participation Reward Matrix</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="bg-white p-3.5 rounded-xl border border-amber-200">
            <strong className="text-slate-800 block font-bold">+20 Points</strong>
            <span className="text-slate-500">For submitting a newly identified, verified civic complaint.</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-amber-200">
            <strong className="text-slate-800 block font-bold">+5 Points</strong>
            <span className="text-slate-500">For supporting/upvoting an existing complaint to reduce duplicates.</span>
          </div>
          <div className="bg-white p-3.5 rounded-xl border border-amber-200">
            <strong className="text-slate-800 block font-bold">+50 Bonus Points</strong>
            <span className="text-slate-500">Awarded automatically when a reported issue is marked Resolved by Admin!</span>
          </div>
        </div>
      </div>

      {/* Profile Form & Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left: Stats */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Participation Analytics</h3>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Complaints Filed:</span>
              <strong className="text-slate-800 font-bold">{stats.totalComplaints}</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Resolved Complaints:</span>
              <strong className="text-emerald-600 font-bold">{stats.resolvedComplaints}</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Upvotes Cast:</span>
              <strong className="text-blue-600 font-bold">{stats.upvotesGiven}</strong>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Role Status:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase text-[10px]">
                Verified Citizen
              </span>
            </div>
          </div>
        </div>

        {/* Right: Update Form */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
          <form onSubmit={handleUpdate} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={profileData.email}
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Email address cannot be changed</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address / Ward</label>
              <input
                type="text"
                value={profileData.address}
                onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                placeholder="Indiranagar 100ft Road, Bangalore"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
