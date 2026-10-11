import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import { useNotifications } from '../context/useNotifications';
import MapView from '../components/LazyMapView';
import DuplicateAlertModal from '../components/DuplicateAlertModal';
import {
  Camera,
  Upload,
  MapPin,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Navigation,
} from 'lucide-react';

const fetchCityFromCoords = async (lat, lng) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`, {
      signal: controller.signal,
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.address) {
        return data.address.city || data.address.town || data.address.village || data.address.county || data.address.state || `Selected Pinpoint (${lat}, ${lng})`;
      }
    }
  } catch {
    // The pin remains usable when optional address lookup is unavailable.
  } finally {
    clearTimeout(timeoutId);
  }
  return `Selected Pinpoint (${lat}, ${lng})`;
};

export default function ReportComplaint() {
  const { refreshProfile } = useAuth();
  const { fetchNotifications } = useNotifications();
  const navigate = useNavigate();

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState({
    lat: null,
    lng: null,
    address: '',
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const locationRequestIdRef = useRef(0);

  // Duplicate detection state
  const [duplicateData, setDuplicateData] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const handleGetGPS = useCallback(() => {
    const requestId = ++locationRequestIdRef.current;
    if (!navigator.geolocation) {
      setLocationError('GPS is unavailable here. Click the map to choose a location.');
      setGpsLoading(false);
      return;
    }

    setGpsLoading(true);
    setLocationError('');
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (requestId !== locationRequestIdRef.current) return;
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        setLocation((current) => ({ ...current, lat, lng, address: 'Looking up address…' }));
        fetchCityFromCoords(lat, lng).then((address) => {
          if (requestId === locationRequestIdRef.current) {
            setLocation((current) => ({ ...current, address }));
          }
        }).finally(() => {
          if (requestId === locationRequestIdRef.current) setGpsLoading(false);
        });
      },
      () => {
        if (requestId !== locationRequestIdRef.current) return;
        setGpsLoading(false);
        setLocationError('Could not detect your location. Click the map to place a pin before submitting.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleLocationSelect = useCallback((newCoords) => {
    const requestId = ++locationRequestIdRef.current;
    setGpsLoading(false);
    setLocationError('');
    setError('');
    setLocation((prev) => ({
      ...prev,
      lat: newCoords.lat,
      lng: newCoords.lng,
      address: 'Looking up address…',
    }));
    fetchCityFromCoords(newCoords.lat, newCoords.lng).then((address) => {
      if (requestId === locationRequestIdRef.current) {
        setLocation((prev) => ({ ...prev, address }));
      }
    });
  }, []);

  const handleAddressChange = (event) => {
    locationRequestIdRef.current += 1;
    setLocation((current) => ({ ...current, address: event.target.value }));
  };

  const executeSubmission = async (force = false) => {
    if (!imageFile) {
      setError('Please upload a clear photograph of the civic issue.');
      return;
    }
    if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
      setError('Detect your GPS location or click the map to place a pin before submitting.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('description', description);
      formData.append('latitude', location.lat);
      formData.append('longitude', location.lng);
      formData.append('address', location.address);
      if (force) {
        formData.append('forceCreate', 'true');
      }

      const res = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.isDuplicate && !force) {
        // Duplicate detected!
        setDuplicateData(res.data);
        setShowDuplicateModal(true);
        setSubmitting(false);
      } else {
        // Success!
        await refreshProfile();
        await fetchNotifications();
        navigate(`/complaints/${res.data.complaint._id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit complaint.');
      setSubmitting(false);
    }
  };

  const handleUpvoteExisting = async () => {
    if (!duplicateData || !duplicateData.existingComplaint) return;
    try {
      setSubmitting(true);
      await api.post(`/complaints/${duplicateData.existingComplaint._id}/upvote`);
      await refreshProfile();
      await fetchNotifications();
      setShowDuplicateModal(false);
      navigate(`/complaints/${duplicateData.existingComplaint._id}`);
    } catch (err) {
      setError(err.message || 'Failed to upvote existing complaint.');
      setShowDuplicateModal(false);
      setSubmitting(false);
    }
  };

  const handleForceSubmit = async () => {
    setShowDuplicateModal(false);
    await executeSubmission(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
          Module 2: Civic Complaint Management
        </span>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Report a Municipal Issue</h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Upload photo evidence. Google Gemini AI will inspect the category & severity, GPS will pin the location, and our duplicate detection engine will safeguard municipal resources.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Col: Photo & Description */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-600" />
              <span>1. Upload Issue Photograph</span>
            </h3>

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 group bg-slate-50">
                <img
                  src={imagePreview}
                  alt="Civic Issue Preview"
                  className="w-full h-56 object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute bottom-3 right-3 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg backdrop-blur-sm transition-all"
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50 hover:bg-blue-50/30">
                <Upload className="w-10 h-10 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-700">Click to upload photo</span>
                <span className="text-[11px] text-slate-400 mt-1">PNG, JPG or WEBP up to 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Additional Notes or Landmarks (Optional)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Near Indiranagar metro pillar #42, deep pothole causing vehicle traffic..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Right Col: GPS Coordinates & Interactive Map Picker */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>2. Geolocation Pinpoint</span>
              </h3>
              <button
                type="button"
                onClick={handleGetGPS}
                disabled={gpsLoading}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span>{gpsLoading ? 'Detecting...' : 'Detect GPS'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500">Latitude</span>
                <input
                  type="text"
                  readOnly
                  value={location.lat ?? 'Not set'}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-700"
                />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500">Longitude</span>
                <input
                  type="text"
                  readOnly
                  value={location.lng ?? 'Not set'}
                  className="w-full mt-1 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-700"
                />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500">Locality / Landmark Details</span>
              <input
                type="text"
                value={location.address}
                onChange={handleAddressChange}
                placeholder="Choose a map pin or detect GPS"
                className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
              />
            </div>

            {locationError && <p role="alert" className="text-xs text-amber-700">{locationError}</p>}
            {!locationError && location.lat === null && (
              <p className="text-xs text-slate-500">No location is selected yet. Detect GPS or click the map to place a pin.</p>
            )}

            {/* Map Picker Component */}
            <div className="pt-2">
              <MapView
                selectedLocation={location.lat === null || location.lng === null ? null : { lat: location.lat, lng: location.lng }}
                isPicker={true}
                onLocationSelect={handleLocationSelect}
                height="220px"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submission CTA Strip */}
      <div className="p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-bold">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Earn +20 Civic Reward Points Upon Verification</span>
          </div>
          <p className="text-xs text-slate-300">
            Submission initiates Gemini Vision image classification and automated department dispatch.
          </p>
        </div>

        <button
          type="button"
          onClick={() => executeSubmission(false)}
          disabled={submitting || !imageFile}
          className="w-full sm:w-auto px-8 py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-2xl text-xs shadow-lg shadow-blue-500/30 hover:scale-105 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing with Gemini AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Submit & Analyze Complaint</span>
            </>
          )}
        </button>
      </div>

      {/* Duplicate Detection Alert Modal */}
      <DuplicateAlertModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        duplicateData={duplicateData}
        onUpvoteExisting={handleUpvoteExisting}
        onForceSubmit={handleForceSubmit}
        submitting={submitting}
      />
    </div>
  );
}
