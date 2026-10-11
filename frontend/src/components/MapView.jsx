import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ExternalLink, MapPin } from 'lucide-react';

// Fix default Leaflet icon paths in Vite bundle
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Category custom markers
const categoryColors = {
  Pothole: '#ef4444', // Red
  'Garbage Overflow': '#f97316', // Orange
  'Broken Streetlight': '#eab308', // Yellow
  'Drainage Issue': '#06b6d4', // Cyan
  Other: '#8b5cf6', // Purple
};

function createCustomIcon(category = 'Pothole') {
  const color = categoryColors[category] || '#3b82f6';
  return L.divIcon({
    className: 'custom-leaflet-pin',
    html: `
      <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 2px solid #ffffff;">
        <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

function isValidCoordinatePair(lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  return (
    lat !== null && lat !== undefined && String(lat).trim() !== '' &&
    lng !== null && lng !== undefined && String(lng).trim() !== '' &&
    Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180
  );
}

function createComplaintPopup(complaint) {
  const root = L.DomUtil.create('div');
  root.style.fontFamily = 'system-ui';
  root.style.minWidth = '180px';

  const title = L.DomUtil.create('div', '', root);
  title.style.cssText = 'font-weight:700;font-size:13px;margin-bottom:4px;color:#0f172a';
  title.textContent = complaint.title || 'Civic complaint';

  const badges = L.DomUtil.create('div', '', root);
  badges.style.cssText = 'display:flex;gap:4px;margin-bottom:6px';
  const category = L.DomUtil.create('span', '', badges);
  category.style.cssText = 'font-size:11px;padding:2px 6px;background:#e0f2fe;color:#0369a1;border-radius:4px;font-weight:600';
  category.textContent = complaint.aiCategory || 'Other';
  const status = L.DomUtil.create('span', '', badges);
  status.style.cssText = 'font-size:11px;padding:2px 6px;background:#f1f5f9;color:#475569;border-radius:4px';
  status.textContent = complaint.status || 'Submitted';

  const address = L.DomUtil.create('div', '', root);
  address.style.cssText = 'font-size:11px;color:#64748b;margin-bottom:8px';
  address.textContent = complaint.location?.address || 'GPS Location';

  const footer = L.DomUtil.create('div', '', root);
  footer.style.cssText = 'display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;padding-top:6px';
  const upvotes = L.DomUtil.create('span', '', footer);
  upvotes.style.cssText = 'font-size:11px;font-weight:600;color:#2563eb';
  upvotes.textContent = `▲ ${complaint.upvoteCount || 0} Upvotes`;
  const details = L.DomUtil.create('a', '', footer);
  details.href = `/complaints/${encodeURIComponent(complaint._id)}`;
  details.style.cssText = 'font-size:11px;color:#2563eb;text-decoration:underline;font-weight:600';
  details.textContent = 'View Details →';

  return root;
}

export default function MapView({
  center = [12.9716, 77.5946],
  zoom = 13,
  complaints = [],
  selectedLocation = null,
  isPicker = false,
  onLocationSelect = null,
  height = '400px',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pickerMarkerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const initialPropsRef = useRef({ center, zoom, selectedLocation, isPicker });
  const onLocationSelectRef = useRef(onLocationSelect);
  const selectedLat = selectedLocation?.lat;
  const selectedLng = selectedLocation?.lng;

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const currentProps = initialPropsRef.current;
      const initialCenter = isValidCoordinatePair(currentProps.selectedLocation?.lat, currentProps.selectedLocation?.lng)
        ? [Number(currentProps.selectedLocation.lat), Number(currentProps.selectedLocation.lng)]
        : currentProps.center;

      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: currentProps.zoom,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Google Maps GPS Coordinates',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        pickerMarkerRef.current = null;
      }
    };
  }, []);

  // Keep picker clicks attached to the live map and use the latest callback.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isPicker) return undefined;

    const handleMapClick = (event) => {
      const { lat, lng } = event.latlng;
      onLocationSelectRef.current?.({
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
      });
    };

    map.on('click', handleMapClick);
    return () => map.off('click', handleMapClick);
  }, [isPicker]);

  // Update center if props change
  useEffect(() => {
    if (mapInstanceRef.current && isValidCoordinatePair(selectedLat, selectedLng)) {
      const newLatLng = L.latLng(Number(selectedLat), Number(selectedLng));
      if (isPicker) {
        // Only pan if the new location is out of bounds, preventing jumpy behavior on click
        if (!mapInstanceRef.current.getBounds().contains(newLatLng)) {
          mapInstanceRef.current.setView(newLatLng, mapInstanceRef.current.getZoom());
        }
      } else {
        mapInstanceRef.current.setView(newLatLng, mapInstanceRef.current.getZoom());
      }
    }
  }, [selectedLat, selectedLng, isPicker]);

  // Render picker marker
  useEffect(() => {
    if (!mapInstanceRef.current || !isPicker) return;

    if (isValidCoordinatePair(selectedLat, selectedLng)) {
      const position = [Number(selectedLat), Number(selectedLng)];
      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.setLatLng(position);
      } else {
        const pickerIcon = L.divIcon({
          className: 'picker-pin',
          html: `
            <div style="background-color: #2563eb; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(37,99,235,0.5); border: 3px solid #ffffff;">
              <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        pickerMarkerRef.current = L.marker(position, {
          icon: pickerIcon,
          draggable: true,
        }).addTo(mapInstanceRef.current);

        pickerMarkerRef.current.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          onLocationSelectRef.current?.({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) });
        });
      }
    } else if (pickerMarkerRef.current) {
      pickerMarkerRef.current.remove();
      pickerMarkerRef.current = null;
    }
  }, [selectedLat, selectedLng, isPicker]);

  // Render complaints markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    const complaintBounds = L.latLngBounds([]);

    if (complaints && complaints.length > 0) {
      complaints.forEach((c) => {
        if (isValidCoordinatePair(c.location?.latitude, c.location?.longitude)) {
          const position = [Number(c.location.latitude), Number(c.location.longitude)];
          const marker = L.marker(position, {
            icon: createCustomIcon(c.aiCategory),
          });
          marker.bindPopup(createComplaintPopup(c));
          markersLayerRef.current.addLayer(marker);
          if (!isPicker && !isValidCoordinatePair(selectedLat, selectedLng)) {
            complaintBounds.extend(position);
          }
        }
      });

      if (!isPicker && complaintBounds.isValid()) {
        mapInstanceRef.current.fitBounds(complaintBounds, { padding: [24, 24], maxZoom: 13 });
      }
    }
  }, [complaints, isPicker, selectedLat, selectedLng]);

  const firstGeolocatedComplaint = complaints.find((complaint) =>
    isValidCoordinatePair(complaint.location?.latitude, complaint.location?.longitude)
  );
  const activeLat = selectedLat ?? firstGeolocatedComplaint?.location.latitude ?? center[0];
  const activeLng = selectedLng ?? firstGeolocatedComplaint?.location.longitude ?? center[1];
  const googleMapsUrl = `https://www.google.com/maps?q=${activeLat},${activeLng}`;

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <div ref={mapContainerRef} style={{ height }} className="w-full z-0" />

      {/* Floating Google Maps External Navigation Button */}
      <div className="absolute top-3 right-3 z-20">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 rounded-lg shadow-md border border-slate-200 backdrop-blur-sm transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>View on Google Maps</span>
        </a>
      </div>

      {isPicker && (
        <div className="absolute bottom-3 left-3 z-20 bg-slate-900/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 pointer-events-none">
          <MapPin className="w-3.5 h-3.5 text-blue-400" />
          <span>Click anywhere on the map or drag the pin to adjust GPS location</span>
        </div>
      )}
    </div>
  );
}
