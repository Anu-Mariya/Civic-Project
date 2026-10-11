import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LogIn, Lock, Mail, Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedInUser = await login(email.trim(), password);
      if (loggedInUser.role === 'admin') {
        navigate('/admin');
      } else {
        const from = location.state?.from?.pathname || '/my-complaints';
        navigate(from);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCitizen = () => {
    setEmail('rahul.sharma@example.com');
    setPassword('Citizen@123');
  };

  const setDemoAdmin = () => {
    setEmail('admin@civic.gov');
    setPassword('Admin@123');
  };

  return (
    <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md">
          <LogIn className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Citizen Sign In</h2>
        <p className="text-xs text-slate-500">Access your complaints, notifications, and civic reward points</p>
      </div>

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
          {error}
        </div>
      )}

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={setDemoCitizen}
            className="flex-1 py-1.5 px-2 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Citizen Demo
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. rahul.sharma@example.com"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Sign In to Citizen Portal'}
        </button>
      </form>

      <div className="text-center text-xs text-slate-500 border-t border-slate-100 pt-4 space-y-1">
        <p>
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-blue-600 hover:underline">
            Register as New Citizen (+10 Pts)
          </Link>
        </p>
        <p>
          Municipal Official?{' '}
          <Link to="/admin/login" className="font-semibold text-emerald-600 hover:underline">
            Go to Admin Login
          </Link>
        </p>
      </div>
    </div>
  );
}
