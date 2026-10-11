import React from 'react';

const severityStyles = {
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  High: 'bg-orange-50 text-orange-700 border-orange-300',
  Critical: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse',
};

export default function SeverityBadge({ severity, className = '' }) {
  const currentStyle = severityStyles[severity] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${currentStyle} ${className}`}
    >
      {severity} Severity
    </span>
  );
}
