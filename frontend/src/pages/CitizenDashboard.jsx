import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import {
  ClipboardList,
  PlusCircle,
  Award,
  CheckCircle2,
  Clock,
  ThumbsUp,
  MapPin,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    let active = true;
    const loadComplaints = async () => {
      try {
        const res = await api.get('/complaints/my');
        if (active) setComplaints(res.data.complaints || []);
      } catch (err) {
        if (active) console.error('Failed to load my complaints:', err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadComplaints();
    return () => { active = false; };
  }, []);

  const filtered =
    filter === 'All'
      ? complaints
      : complaints.filter((c) => c.status === filter);

  const resolvedCount = complaints.filter((c) => c.status === 'Resolved').length;
  const inProgressCount = complaints.filter(
    (c) => c.status === 'In Progress' || c.status === 'Assigned' || c.status === 'Under Review'
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Citizen Portal • Smart Civic Participation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.name || 'Citizen'}!
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-lg">
            Track your filed municipal complaints, monitor departmental repair progress, and earn civic points.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2.5 bg-amber-400/20 rounded-xl text-amber-300">
              <Award className="w-6 h-6 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <span className="text-xs text-amber-200 uppercase font-bold block">Reward Points</span>
              <span className="text-2xl font-black text-white">{user?.rewardPoints || 0}</span>
            </div>
          </div>

          <Link
            to="/report"
            className="px-5 py-4 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-2xl text-xs shadow-lg transition-all inline-flex items-center gap-2 hover:scale-105"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Issue</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Reported</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{complaints.length}</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Under Action</span>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{inProgressCount}</h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase">Successfully Resolved</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</h3>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Complaints List Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-extrabold text-slate-900">Your Submitted Complaints History</h2>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['All', 'Submitted', 'Assigned', 'In Progress', 'Resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filter === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading your complaints...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
            <ClipboardList className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-base text-slate-800">No complaints found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You have not registered any civic complaints matching this filter yet.
            </p>
            <Link
              to="/report"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Your First Civic Issue</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <div
                key={c._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={c.imageUrl}
                    alt={c.title}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60';
                    }}
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-slate-400">
                        #{c._id.slice(-6).toUpperCase()}
                      </span>
                      <StatusBadge status={c.status} />
                      <SeverityBadge severity={c.aiSeverity} />
                    </div>
                    <h3 className="font-bold text-sm text-slate-900">{c.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {c.location?.address || 'GPS Coordinates'}
                      </span>
                      <span>•</span>
                      <span>Assigned: <strong>{c.departmentName}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="flex items-center gap-1 text-xs text-blue-600 font-bold">
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{c.upvoteCount || 0} Upvotes</span>
                  </div>

                  <Link
                    to={`/complaints/${c._id}`}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>View Progress</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
