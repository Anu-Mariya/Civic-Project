import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import {
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  Search,
  ExternalLink,
  Edit3,
  MapPin,
  X,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Status Update Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');

  // Delete Complaint State
  const [complaintToDelete, setComplaintToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState({ type: '', text: '' });

  const fetchAdminData = useCallback(async () => {
    try {
      const [statsRes, complaintsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/complaints'),
      ]);

      setStats(statsRes.data.stats);
      setComplaints(complaintsRes.data.complaints || []);
    } catch (err) {
      console.error('Failed to load admin data:', err.message);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadAdminData = async () => {
      try {
        const [statsRes, complaintsRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/complaints'),
        ]);
        if (!active) return;
        setStats(statsRes.data.stats);
        setComplaints(complaintsRes.data.complaints || []);
      } catch (err) {
        if (active) console.error('Failed to load admin data:', err.message);
      }
    };
    loadAdminData();
    return () => { active = false; };
  }, []);

  const handleOpenStatusModal = (complaint) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setRemarks('');
    setUpdateSuccess('');
  };

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setUpdating(true);
    try {
      await api.put(`/admin/complaints/${selectedComplaint._id}/status`, {
        status: newStatus,
        remarks: remarks || `Administrative status change to ${newStatus}.`,
      });

      setUpdateSuccess(`Status successfully updated to "${newStatus}"!`);
      setTimeout(() => {
        setSelectedComplaint(null);
        fetchAdminData();
      }, 1200);
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (complaint) => {
    setFeedbackMessage({ type: '', text: '' });
    setComplaintToDelete(complaint);
  };

  const handleCancelDelete = () => {
    setComplaintToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!complaintToDelete) return;
    const idToDelete = complaintToDelete._id;
    setDeleting(true);
    try {
      const res = await api.delete(`/admin/complaints/${idToDelete}`);
      // Remove complaint immediately from local state
      setComplaints((prev) => prev.filter((c) => c._id !== idToDelete));
      setComplaintToDelete(null);
      setFeedbackMessage({
        type: 'success',
        text: res.data?.message || 'Complaint deleted successfully.',
      });
      fetchAdminData();
    } catch (err) {
      setFeedbackMessage({
        type: 'error',
        text: err.message || 'Failed to delete complaint.',
      });
      setComplaintToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  // Filter complaints list
  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || c.aiCategory === categoryFilter;
    const matchesSearch =
      searchQuery === '' ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.aiCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.citizen?.name && c.citizen.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-emerald-800/40">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Civic Grievance Triage & Resolution Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Real-time oversight of AI-classified civic complaints, geographic distribution, departmental assignments, and citizen participation.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Link
            to="/admin/citizens"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Citizens Directory</span>
          </Link>
          <Link
            to="/admin/departments"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all inline-flex items-center gap-1.5"
          >
            <Building2 className="w-4 h-4" />
            <span>Departments SLA</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Tickets</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats?.totalComplaints || 0}</div>
          <span className="text-[11px] text-slate-400">All registered issues</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-amber-600 uppercase">Pending Review</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {(stats?.statusCounts?.Submitted || 0) + (stats?.statusCounts?.['Under Review'] || 0)}
          </div>
          <span className="text-[11px] text-slate-400">Requires triage</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-blue-600 uppercase">In Progress</span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {(stats?.statusCounts?.Assigned || 0) + (stats?.statusCounts?.['In Progress'] || 0)}
          </div>
          <span className="text-[11px] text-slate-400">Department assigned</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-emerald-600 uppercase">Resolved</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {stats?.statusCounts?.Resolved || 0}
          </div>
          <span className="text-[11px] text-slate-400">Work completed</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <span className="text-xs font-bold text-purple-600 uppercase">Active Citizens</span>
          <div className="text-2xl font-black text-purple-600 mt-1">{stats?.totalCitizens || 0}</div>
          <span className="text-[11px] text-slate-400">Registered participants</span>
        </div>
      </div>

      {/* Category Breakdown Badges */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Complaints by AI Category
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl flex items-center justify-between">
            <span className="font-bold text-red-900">🛣️ Potholes</span>
            <span className="text-base font-black text-red-700">{stats?.categoryCounts?.Pothole || 0}</span>
          </div>
          <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl flex items-center justify-between">
            <span className="font-bold text-orange-900">🗑️ Garbage</span>
            <span className="text-base font-black text-orange-700">{stats?.categoryCounts?.['Garbage Overflow'] || 0}</span>
          </div>
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
            <span className="font-bold text-amber-900">💡 Streetlights</span>
            <span className="text-base font-black text-amber-700">{stats?.categoryCounts?.['Broken Streetlight'] || 0}</span>
          </div>
          <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl flex items-center justify-between">
            <span className="font-bold text-cyan-900">🌊 Drainage</span>
            <span className="text-base font-black text-cyan-700">{stats?.categoryCounts?.['Drainage Issue'] || 0}</span>
          </div>
        </div>
      </div>

      {/* Feedback Alert Banner */}
      {feedbackMessage.text && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2 border shadow-xs animate-fade-in ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage({ type: '', text: '' })}
            className="hover:opacity-75"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Triage & Management Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
        {/* Table Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Complaints Management Table</h2>
            <p className="text-xs text-slate-500">Filter, inspect evidence photos, update resolution status and remarks</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket or citizen..."
                className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="All">All Categories</option>
              <option value="Pothole">Pothole</option>
              <option value="Garbage Overflow">Garbage Overflow</option>
              <option value="Broken Streetlight">Broken Streetlight</option>
              <option value="Drainage Issue">Drainage Issue</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Category & Severity</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Assigned Dept</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Upvotes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    No complaints matching current filters.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      <div className="flex items-center gap-2">
                        <img
                          src={c.imageUrl}
                          alt="thumbnail"
                          className="w-9 h-9 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=100&auto=format&fit=crop&q=60';
                          }}
                        />
                        <div>
                          <span>#{c._id.slice(-6).toUpperCase()}</span>
                          <span className="block text-[10px] text-slate-400 font-sans font-normal truncate max-w-[140px]">
                            {c.title}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span className="font-bold text-slate-800 block">{c.aiCategory}</span>
                        <SeverityBadge severity={c.aiSeverity} />
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-[180px]">
                      <div className="truncate flex items-center gap-1" title={c.location?.address}>
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{c.location?.address || 'GPS Coordinates'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {c.departmentName}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={c.status} />
                    </td>

                    <td className="py-3.5 px-4 font-bold text-blue-600">
                      ▲ {c.upvoteCount || c.upvotes?.length || 0}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(c)}
                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Update</span>
                      </button>

                      <Link
                        to={`/complaints/${c._id}`}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>View</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDeleteClick(c)}
                        className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Delete Complaint"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Status Update Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  Update Resolution Status #{selectedComplaint._id.slice(-6).toUpperCase()}
                </h3>
                <p className="text-[11px] text-slate-300">
                  Current Status: <strong className="text-emerald-400">{selectedComplaint.status}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {updateSuccess ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">{updateSuccess}</h4>
                <p className="text-xs text-slate-500">Citizen notification has been dispatched.</p>
              </div>
            ) : (
              <form onSubmit={handleUpdateStatusSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Transition To Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Submitted">Submitted (Under initial triage)</option>
                    <option value="Under Review">Under Review (Inspecting site validity)</option>
                    <option value="Assigned">Assigned (Dispatched to Department)</option>
                    <option value="In Progress">In Progress (Work crew deployed on site)</option>
                    <option value="Resolved">Resolved (Repair completed & citizen rewarded +50 Pts)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Administrative Remarks / Departmental Notes
                  </label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="e.g. Roads department deployed pothole repair truck. Asphalt patch laid and compacted."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    These remarks will appear on the citizen's complaint timeline and in-app notification.
                  </span>
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedComplaint(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updating}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
                  >
                    {updating ? 'Updating...' : 'Commit Status Change'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Admin Delete Confirmation Modal */}
      {complaintToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-200 overflow-hidden">
            {/* Header */}
            <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rose-900">
                <div className="p-2 bg-rose-100 rounded-xl text-rose-700">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-rose-950">Delete Complaint</h3>
                  <p className="text-xs text-rose-700">Ticket #{complaintToDelete._id?.slice(-6).toUpperCase()}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={deleting}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-900 text-xs rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">
                  Are you sure you want to delete this complaint? This action cannot be undone.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                <div className="font-bold text-slate-800">{complaintToDelete.title}</div>
                <div className="text-slate-500 flex items-center justify-between">
                  <span>Category: {complaintToDelete.aiCategory}</span>
                  <span>Status: {complaintToDelete.status}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCancelDelete}
                disabled={deleting}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Complaint</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
