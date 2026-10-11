import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">CivicSense AI</span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              AI-Powered Civic Complaint Management and Resolution Platform. Designed for municipal corporations to streamline citizen grievances through Gemini AI image analysis, GPS tracking, duplicate suppression, and automated departmental routing.
            </p>
            <div className="text-[11px] text-slate-500 font-mono">
              MCA Mini Project • Academic Demonstration Architecture
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Civic Categories</h4>
            <ul className="text-xs space-y-1.5 text-slate-400">
              <li>🛣️ Potholes & Road Cracks</li>
              <li>🗑️ Garbage Dump Overflow</li>
              <li>💡 Broken Streetlights</li>
              <li>🌊 Clogged Drainage & Culverts</li>
              <li>🏛️ Municipal Grievances</li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Technology Stack</h4>
            <ul className="text-xs space-y-1.5 text-slate-400">
              <li>• Google Gemini Vision AI</li>
              <li>• Node.js & Express.js REST API</li>
              <li>• MongoDB & Haversine Geolocation</li>
              <li>• React.js, Tailwind CSS & Leaflet Maps</li>
              <li>• JWT Secure Citizen & Admin Auth</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CivicSense. All Municipal Rights Reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Empowering Smart Cities with AI & Active Citizen Participation
          </p>
        </div>
      </div>
    </footer>
  );
}
