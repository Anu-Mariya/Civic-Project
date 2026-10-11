import React, { useState, useEffect } from 'react';
import api from '../services/api';
import MapView from '../components/LazyMapView';
import { MapPin, Filter, AlertTriangle } from 'lucide-react';

export default function CivicMap() {
  const [complaints, setComplaints] = useState([]);
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    api.get('/complaints', {
      params: { category, status },
      signal: controller.signal,
    })
      .then((res) => {
        if (active) setComplaints(res.data.complaints || []);
      })
      .catch((err) => {
        if (!active || controller.signal.aborted) return;
        setComplaints([]);
        setError(err.message || 'Could not load complaint locations.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [category, status]);

  const validPinCount = complaints.filter((complaint) => {
    const { latitude, longitude } = complaint.location || {};
    return latitude !== null && latitude !== undefined && String(latitude).trim() !== '' &&
      longitude !== null && longitude !== undefined && String(longitude).trim() !== '' &&
      Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) &&
      Number(latitude) >= -90 && Number(latitude) <= 90 &&
      Number(longitude) >= -180 && Number(longitude) <= 180;
  }).length;

  const updateCategory = (event) => {
    setLoading(true);
    setError('');
    setCategory(event.target.value);
  };

  const updateStatus = (event) => {
    setLoading(true);
    setError('');
    setStatus(event.target.value);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Geographic Complaint Map</h1>
              <p className="text-xs text-slate-500">Live spatial distribution of municipal civic issues</p>
            </div>
          </div>
        </div>

        {/* Filter Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filters:</span>
          </div>

          <select
            value={category}
            onChange={updateCategory}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden"
          >
            <option value="All">All Categories</option>
            <option value="Pothole">Pothole</option>
            <option value="Garbage Overflow">Garbage Overflow</option>
            <option value="Broken Streetlight">Broken Streetlight</option>
            <option value="Drainage Issue">Drainage Issue</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={status}
            onChange={updateStatus}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden"
          >
            <option value="All">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <span className="text-xs font-mono px-2.5 py-1.5 bg-blue-50 text-blue-700 rounded-xl font-bold">
            {loading ? 'Loading pins…' : `${validPinCount} Pins Found`}
          </span>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && validPinCount === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-600">
          No complaints with usable coordinates match these filters.
        </div>
      )}

      {/* Map Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-2">
        <MapView complaints={complaints} height="560px" />
      </div>

      {/* Map Legend */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-around gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 shadow-xs" />
          <span className="text-slate-700 font-medium">Potholes & Road Cracks</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-orange-500 shadow-xs" />
          <span className="text-slate-700 font-medium">Garbage Overflow</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs" />
          <span className="text-slate-700 font-medium">Broken Streetlights</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-cyan-500 shadow-xs" />
          <span className="text-slate-700 font-medium">Drainage & Culverts</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-violet-500 shadow-xs" />
          <span className="text-slate-700 font-medium">Other</span>
        </div>
      </div>
    </div>
  );
}
