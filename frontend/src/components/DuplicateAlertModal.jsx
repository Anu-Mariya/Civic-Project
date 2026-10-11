import React from 'react';
import { AlertTriangle, ThumbsUp, PlusCircle, X, MapPin, Copy } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { getImageUrl } from '../services/api';

export default function DuplicateAlertModal({
  isOpen,
  onClose,
  duplicateData,
  onUpvoteExisting,
  onForceSubmit,
  submitting = false,
}) {
  if (!isOpen || !duplicateData) return null;

  const { existingComplaint, distanceMeters, aiAnalysis, duplicateType, message } = duplicateData;
  const isImageDuplicate = duplicateType === 'image' || (!distanceMeters && Boolean(existingComplaint));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-500/10 px-6 py-4 border-b border-amber-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-amber-900">
            <div className="p-2 bg-amber-100 rounded-lg">
              {isImageDuplicate ? (
                <Copy className="w-5 h-5 text-amber-700" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-700" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-amber-950">
                {isImageDuplicate ? 'Duplicate Image Detected' : 'Duplicate Complaint Detected'}
              </h3>
              <p className="text-xs text-amber-800">
                {isImageDuplicate
                  ? 'SHA-256 hash match found with an existing complaint'
                  : 'Civic proximity algorithm identified an existing active report'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 rounded-xl p-3.5 border border-amber-100 text-xs text-amber-900 flex items-start gap-2.5">
            {isImageDuplicate ? (
              <Copy className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            ) : (
              <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed font-medium">
              {isImageDuplicate
                ? (message ||
                  'An existing complaint with the same image was found. Would you like to support the existing complaint or create a new complaint?')
                : `A similar ${aiAnalysis?.category || existingComplaint?.aiCategory} is already registered ${distanceMeters} meters away from your GPS coordinates!`}
            </span>
          </div>

          {/* Existing Complaint Preview Card */}
          {existingComplaint && (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Existing Ticket #{existingComplaint._id?.slice(-6)}
                </span>
                <StatusBadge status={existingComplaint.status} />
              </div>

              {existingComplaint.imageUrl && (
                <div className="relative rounded-lg overflow-hidden border border-slate-200 h-36 bg-slate-100">
                  <img
                    src={getImageUrl(existingComplaint.imageUrl)}
                    alt="Existing complaint preview"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1.5 left-2 bg-slate-900/70 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-xs">
                    Existing Image in System
                  </span>
                </div>
              )}

              <h4 className="font-bold text-slate-800 text-sm">{existingComplaint.title}</h4>
              {existingComplaint.description && (
                <p className="text-xs text-slate-600 line-clamp-2">{existingComplaint.description}</p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs text-slate-500">
                <span>
                  Department: <strong className="text-slate-700">{existingComplaint.departmentName || 'Municipal Dept'}</strong>
                </span>
                <span className="font-bold text-blue-600">
                  ▲ {existingComplaint.supporterCount || existingComplaint.upvoteCount || existingComplaint.upvotes?.length || 0} Supporters
                </span>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-500 leading-relaxed">
            By supporting this existing complaint, you add your voice to the issue and help authorities prioritize it without creating duplicate tickets.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5 sm:justify-end">
          <button
            type="button"
            onClick={onForceSubmit}
            disabled={submitting}
            className="order-2 sm:order-1 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{isImageDuplicate ? 'Create New Complaint' : 'Submit as Separate Ticket'}</span>
          </button>

          <button
            type="button"
            onClick={onUpvoteExisting}
            disabled={submitting}
            className="order-1 sm:order-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow transition-all inline-flex items-center justify-center gap-2"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{isImageDuplicate ? 'Support Existing Complaint' : 'Support & Upvote (+5 Points)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
