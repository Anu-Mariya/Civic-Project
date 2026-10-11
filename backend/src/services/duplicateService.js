const Complaint = require('../models/Complaint');

/**
 * Calculates geographic distance between two coordinates in meters using the Haversine Formula.
 * R = 6,371,000 meters (mean Earth radius).
 */
function calculateHaversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (value) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}

/**
 * Checks for existing unresolved complaints in the same category within proximity radius.
 * Proximity threshold: 100 meters (configurable).
 * Unresolved statuses: ['Submitted', 'Under Review', 'Assigned', 'In Progress']
 */
async function findPotentialDuplicate(category, latitude, longitude, radiusMeters = 100) {
  const hasValidCoordinates = (lat, lng) => {
    const numericLat = Number(lat);
    const numericLng = Number(lng);
    return (
      lat !== null && lat !== undefined && String(lat).trim() !== '' &&
      lng !== null && lng !== undefined && String(lng).trim() !== '' &&
      Number.isFinite(numericLat) && Number.isFinite(numericLng) &&
      numericLat >= -90 && numericLat <= 90 &&
      numericLng >= -180 && numericLng <= 180
    );
  };

  if (!hasValidCoordinates(latitude, longitude) || !category) {
    return null;
  }

  // Find active, unresolved complaints in the same category
  const activeComplaints = await Complaint.find({
    aiCategory: category,
    status: { $in: ['Submitted', 'Under Review', 'Assigned', 'In Progress'] },
  }).populate('citizen', 'name email');

  let closestDuplicate = null;
  let minDistance = Infinity;

  for (const complaint of activeComplaints) {
    if (!complaint.location || !hasValidCoordinates(complaint.location.latitude, complaint.location.longitude)) {
      continue;
    }

    const distance = calculateHaversineDistanceMeters(
      latitude,
      longitude,
      complaint.location.latitude,
      complaint.location.longitude
    );

    if (distance <= radiusMeters && distance < minDistance) {
      minDistance = distance;
      closestDuplicate = {
        complaint,
        distanceMeters: distance,
        radiusThresholdMeters: radiusMeters,
      };
    }
  }

  return closestDuplicate;
}

module.exports = {
  calculateHaversineDistanceMeters,
  findPotentialDuplicate,
};
