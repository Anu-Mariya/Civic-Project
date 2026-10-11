import React from 'react';

const statusStyles = {
  Submitted: 'bg-blue-100 text-blue-800 border-blue-200',
  'Under Review': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Assigned: 'bg-amber-100 text-amber-800 border-amber-200',
  'In Progress': 'bg-orange-100 text-orange-800 border-orange-200',
  Resolved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export default function StatusBadge({ status, className = '' }) {
  const currentStyle = statusStyles[status] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {status}
    </span>
  );
}
