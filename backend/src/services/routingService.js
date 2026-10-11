const Department = require('../models/Department');

/**
 * Maps a civic issue category to the responsible municipal department.
 * Automatically looks up or assigns the corresponding Department document.
 */
async function routeComplaintToDepartment(category) {
  const categoryMapping = {
    'Pothole': 'ROADS',
    'Garbage Overflow': 'WASTE',
    'Broken Streetlight': 'ELECTRICAL',
    'Drainage Issue': 'DRAINAGE',
  };

  const deptCode = categoryMapping[category] || 'GENERAL';

  // Find department by code or by category covered
  let department = await Department.findOne({
    $or: [{ code: deptCode }, { categoriesCovered: category }],
  });

  if (!department) {
    // Fallback: search for any active department or first one
    department = await Department.findOne({ isActive: true });
  }

  return department;
}

module.exports = { routeComplaintToDepartment };
