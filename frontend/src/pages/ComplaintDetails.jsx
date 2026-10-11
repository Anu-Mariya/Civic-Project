import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import { useNotifications } from '../context/useNotifications';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import MapView from '../components/LazyMapView';
import {
  MapPin,
  ThumbsUp,
  Clock,
  Building2,
  CheckCircle2,
  Calendar,
  User,
  ExternalLink,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

const statusSteps = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];

export default function ComplaintDetails() {
  const { id } = useParams();
  const { user, isAuthenticated, refreshProfile } = useAuth();
  const { fetchNotifications } = useNotifications();

  const [complaint, setComplaint] = useState(null);
  const [loadedComplaintId, setLoadedComplaintId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upvoting, setUpvoting] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  const fetchComplaint = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await api.get(`/complaints/${id}`);
      const data = res.data.complaint;
      setComplaint(data);
      setLoadedComplaintId(id);

      if (user && data.upvotes) {
        const userIdStr = user.id || user._id;
        setHasUpvoted(data.upvotes.some((uid) => uid === userIdStr || uid._id === userIdStr));
      }
    } catch (err) {
      setError(err.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    let active = true;
    const loadComplaint = async () => {
      try {
        const res = await api.get(`/complaints/${id}`);
        if (!active) return;
        const data = res.data.complaint;
        setComplaint(data);
        setLoadedComplaintId(id);
        if (user && data.upvotes) {
          const userIdStr = user.id || user._id;
          setHasUpvoted(data.upvotes.some((uid) => uid === userIdStr || uid._id === userIdStr));
        }
      } catch (err) {
        if (active) setError(err.message || 'Failed to load complaint details.');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadComplaint();
    return () => { active = false; };
  }, [id, user]);

  const handleUpvote = async () => {
    if (!isAuthenticated) return;
    try {
      setUpvoting(true);
      await api.post(`/complaints/${id}/upvote`);
      setHasUpvoted(true);
      await fetchComplaint();
      await refreshProfile();
      await fetchNotifications();
    } catch (err) {
      alert(err.message || 'Could not register upvote.');
    } finally {
      setUpvoting(false);
    }
  };

  if (loading || loadedComplaintId !== id) {
    return (
      <div className="py-20 text-center text-xs text-slate-500">
        Loading civic complaint ticket #{id?.slice(-6)}...
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="font-bold text-base text-slate-800">Complaint Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'This ticket may have been removed.'}</p>
        <Link to="/" className="inline-block text-xs font-bold text-blue-600 hover:underline">
          Return to Public Feed
        </Link>
      </div>
    );
  }

  const currentStepIndex = statusSteps.indexOf(complaint.status);
  const googleMapsUrl = `https://www.google.com/maps?q=${complaint.location.latitude},${complaint.location.longitude}`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top back button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Feed</span>
        </Link>
      </div>

      {/* Main Ticket Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-400">
                  TICKET #{complaint._id.slice(-6).toUpperCase()}
                </span>
                <StatusBadge status={complaint.status} />
                <SeverityBadge severity={complaint.aiSeverity} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {complaint.title}
              </h1>
            </div>

            {/* Upvote Button Component */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleUpvote}
                disabled={upvoting || hasUpvoted || !isAuthenticated}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2 ${
                  hasUpvoted
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 cursor-default'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${hasUpvoted ? 'fill-blue-600' : ''}`} />
                <span>
                  {hasUpvoted
                    ? `Supported (${complaint.upvoteCount || 0})`
                    : `Support Issue (${complaint.upvoteCount || 0})`}
                </span>
              </button>
            </div>
          </div>

          {/* Status Progress Stepper */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Resolution Progress
            </span>
            <div className="grid grid-cols-5 gap-2">
              {statusSteps.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={step} className="flex flex-col items-center text-center">
                    <div
                      className={`w-full h-2 rounded-full mb-2 transition-all ${
                        isPassed
                          ? isCurrent
                            ? 'bg-blue-600 shadow-xs ring-2 ring-blue-200'
                            : 'bg-emerald-500'
                          : 'bg-slate-200'
                      }`}
                    />
                    <span
                      className={`text-[10px] sm:text-xs font-bold ${
                        isCurrent
                          ? 'text-blue-600'
                          : isPassed
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2-Column Split: Evidence Photo & AI Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            {/* Left: Image Card */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 relative group">
              <img
                src={complaint.imageUrl}
                alt={complaint.title}
                className="w-full h-72 object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60';
                }}
              />
              <div className="p-3 bg-white/95 backdrop-blur-xs border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {new Date(complaint.createdAt).toLocaleDateString()} at{' '}
                  {new Date(complaint.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-[11px] font-mono text-slate-400">Photo Proof</span>
              </div>
            </div>

            {/* Right: Google Gemini AI Inspection Summary */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                    <span>Gemini Vision AI Verified</span>
                  </div>
                  <span className="text-xs font-mono text-cyan-300">
                    Confidence: {(complaint.aiConfidence * 100).toFixed(0)}%
                  </span>
                </div>

                <div>
                  <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">Identified Category</h4>
                  <p className="text-xl font-black text-white mt-0.5">{complaint.aiCategory}</p>
                </div>

                <div>
                  <h4 className="text-xs text-slate-400 font-bold uppercase tracking-wider">AI Assessment Summary</h4>
                  <p className="text-xs text-slate-200 leading-relaxed mt-1 bg-white/5 p-3 rounded-xl border border-white/10">
                    "{complaint.aiSummary || 'Civic infrastructure anomaly detected via vision model.'}"
                  </p>
                </div>
              </div>

              {/* Department Routing Tag */}
              <div className="p-3 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-200 block">Assigned Municipal Authority</span>
                  <span className="text-xs font-extrabold text-white">{complaint.departmentName}</span>
                </div>
                <Building2 className="w-5 h-5 text-blue-300" />
              </div>
            </div>
          </div>

          {/* Description & Citizen Info */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Citizen Description</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {complaint.description || 'No additional remarks provided by reporting citizen.'}
            </p>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 text-xs text-slate-500">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Reported by: <strong>{complaint.citizen?.name || 'Community Citizen'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Geolocation Section & Google Maps Integration */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span>Geographic Location & Municipal Grid</span>
            </h3>
            <p className="text-xs text-slate-500">
              GPS Coordinates: {complaint.location.latitude}, {complaint.location.longitude} ({complaint.location.address})
            </p>
          </div>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            <span>Open in Google Maps</span>
          </a>
        </div>

        <MapView
          center={[complaint.location.latitude, complaint.location.longitude]}
          complaints={[complaint]}
          height="320px"
        />
      </div>

      {/* Resolution Timeline & Remarks History */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-4">
        <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <span>Status Audit Trail & Department Log</span>
        </h3>

        <div className="space-y-4 divide-y divide-slate-100">
          {complaint.statusHistory && complaint.statusHistory.length > 0 ? (
            complaint.statusHistory.map((history, idx) => (
              <div key={idx} className="pt-4 first:pt-0 flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={history.status} />
                    <span className="text-[11px] text-slate-400">
                      {new Date(history.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {history.remarks || `Status transitioned to ${history.status}.`}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-400">No status audit entries available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
