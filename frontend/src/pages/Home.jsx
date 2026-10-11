import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import MapView from '../components/LazyMapView';
import { Camera, CheckCircle2, ArrowRight, MapPin, ThumbsUp, Sparkles } from 'lucide-react';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  const categories = ['All', 'Pothole', 'Garbage Overflow', 'Broken Streetlight', 'Drainage Issue', 'Other'];

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const res = await api.get('/complaints');
        setComplaints(res.data.complaints || []);
      } catch (err) {
        console.error('Failed to load complaints:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, []);

  const filteredComplaints =
    selectedCategory === 'All'
      ? complaints
      : complaints.filter((c) => c.aiCategory === selectedCategory);

  const totalResolved = complaints.filter((c) => c.status === 'Resolved').length;
  const totalInProgress = complaints.filter((c) => c.status === 'In Progress' || c.status === 'Assigned').length;

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-slate-900 to-slate-900 text-white pt-16 pb-24 px-4 sm:px-6 lg:px-8 -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>AI-Assisted Municipal Governance • Google Gemini Vision</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Report Civic Issues In Seconds. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300">
              AI Identifies, Routes & Tracks Resolution.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Snap a photo of potholes, trash overflow, dead streetlights, or clogged drains.
            Our Gemini AI identifies damage severity, GPS captures exact coordinates, prevents duplicate complaints, and assigns tasks directly to responsible municipal departments.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link
              to={isAuthenticated ? '/report' : '/login'}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/30 hover:scale-105 transition-all inline-flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>Report a Civic Problem</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              to="/map"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 backdrop-blur-md transition-all inline-flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>Explore Live Civic Map</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-10 border-t border-slate-800/80 text-left">
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
              <span className="text-2xl font-black text-white">{complaints.length}</span>
              <p className="text-xs text-slate-400 font-medium">Total Complaints</p>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
              <span className="text-2xl font-black text-emerald-400">{totalResolved}</span>
              <p className="text-xs text-slate-400 font-medium">Resolved by Depts</p>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
              <span className="text-2xl font-black text-amber-400">{totalInProgress}</span>
              <p className="text-xs text-slate-400 font-medium">Active In Progress</p>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
              <span className="text-2xl font-black text-cyan-400">4</span>
              <p className="text-xs text-slate-400 font-medium">Municipal Wards</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Workflow (Academic Focus) */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
            System Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            How The AI Civic Resolution Platform Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            From citizen photo upload to municipal resolution in 5 seamless automated steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              1
            </div>
            <h3 className="font-bold text-sm text-slate-800">Photo & GPS Capture</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Citizen captures photo of the pothole or trash. Browser extracts precise GPS latitude & longitude.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              2
            </div>
            <h3 className="font-bold text-sm text-slate-800">Gemini Vision AI</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Google Gemini analyzes image, identifies the civic category, computes severity (Low to Critical), and scores confidence.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              3
            </div>
            <h3 className="font-bold text-sm text-slate-800">Duplicate Check</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Haversine formula checks if the same issue was reported within 100m. Suggests upvoting to prevent spam.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
              4
            </div>
            <h3 className="font-bold text-sm text-slate-800">Automatic Routing</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Roads, Waste, Electrical or Drainage Department is automatically assigned based on AI classification.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              5
            </div>
            <h3 className="font-bold text-sm text-slate-800">Resolution & Points</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Admin marks repair complete. Citizen receives live notification and +50 civic reward points!
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Map Preview Section */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              Geographic Visibility
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Live Municipal Complaint Map
            </h2>
            <p className="text-xs text-slate-500">
              Real-time map markers pinpointing civic grievances across municipal boundaries
            </p>
          </div>
          <Link
            to="/map"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            <span>Open Fullscreen Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <MapView complaints={complaints} height="360px" />
      </section>

      {/* Public Complaints Feed Section */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Community Civic Grievances
            </h2>
            <p className="text-xs text-slate-500">
              Browse issues reported by fellow citizens, monitor progress, and upvote
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading civic complaints feed...</div>
        ) : filteredComplaints.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-sm text-slate-800">No Complaints in this category</h4>
            <p className="text-xs text-slate-500">No unresolved grievances currently match "{selectedCategory}".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComplaints.map((c) => (
              <div
                key={c._id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                {/* Image Header */}
                <div className="relative h-44 bg-slate-100 overflow-hidden">
                  <img
                    src={c.imageUrl}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <SeverityBadge severity={c.aiSeverity} />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-900/70 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md flex items-center justify-between">
                    <span className="font-semibold">{c.aiCategory}</span>
                    <span className="text-cyan-300 font-mono">{(c.aiConfidence * 100).toFixed(0)}% AI Conf.</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {c.description || c.aiSummary}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{c.location?.address || 'GPS Coordinates captured'}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <div className="flex items-center gap-1 text-blue-600 font-semibold">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{c.upvoteCount || c.upvotes?.length || 0} Upvotes</span>
                      </div>
                      <Link
                        to={`/complaints/${c._id}`}
                        className="text-xs font-bold text-slate-700 hover:text-blue-600 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
