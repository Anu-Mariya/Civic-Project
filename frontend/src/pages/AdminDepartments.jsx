import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Building2,
  Clock,
  Mail,
  User,
  ArrowLeft,
} from 'lucide-react';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadDepartments = async () => {
      try {
        const res = await api.get('/admin/departments');
        if (active) setDepartments(res.data.departments || []);
      } catch (err) {
        if (active) console.error('Failed to load departments:', err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadDepartments();
    return () => { active = false; };
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Top back */}
      <div>
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Admin Console</span>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Municipal Departments & SLA Matrix</h1>
              <p className="text-xs text-slate-500">
                Departmental routing rules, service level agreements, and operational contacts
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-xs text-slate-400">Loading departments...</div>
        ) : (
          departments.map((dept) => (
            <div
              key={dept._id}
              className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {dept.code}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900">{dept.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-bold border border-emerald-200 flex-shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{dept.slaHours}h SLA</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">{dept.description}</p>

                {/* Covered Categories */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Assigned Civic Categories
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {dept.categoriesCovered &&
                      dept.categoriesCovered.map((cat) => (
                        <span
                          key={cat}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-200"
                        >
                          {cat}
                        </span>
                      ))}
                  </div>
                </div>
              </div>

              {/* Contact Footer */}
              <div className="pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Head: <strong>{dept.headOfDepartment || 'Designated Engineer'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-slate-500">{dept.contactEmail || 'dept@civic.gov'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
