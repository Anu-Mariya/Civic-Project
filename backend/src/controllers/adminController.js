const fs = require('fs/promises');
const path = require('path');
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const { createNotification, awardRewardPoints } = require('../services/notificationService');

// @desc    Get Admin Dashboard Overview Metrics
// @route   GET /api/admin/stats
// @access  Private (Admin Only)
const getDashboardStats = async (req, res) => {
  try {
    const totalComplaints = await Complaint.countDocuments();
    const totalCitizens = await User.countDocuments({ role: 'citizen' });

    // Status counts
    const statusCounts = {
      Submitted: await Complaint.countDocuments({ status: 'Submitted' }),
      'Under Review': await Complaint.countDocuments({ status: 'Under Review' }),
      Assigned: await Complaint.countDocuments({ status: 'Assigned' }),
      'In Progress': await Complaint.countDocuments({ status: 'In Progress' }),
      Resolved: await Complaint.countDocuments({ status: 'Resolved' }),
    };

    // Category counts
    const categories = ['Pothole', 'Garbage Overflow', 'Broken Streetlight', 'Drainage Issue', 'Other'];
    const categoryCounts = {};
    for (const cat of categories) {
      categoryCounts[cat] = await Complaint.countDocuments({ aiCategory: cat });
    }

    // Severity counts
    const severities = ['Low', 'Medium', 'High', 'Critical'];
    const severityCounts = {};
    for (const sev of severities) {
      severityCounts[sev] = await Complaint.countDocuments({ aiSeverity: sev });
    }

    // Department breakdown
    const departments = await Department.find();
    const departmentBreakdown = [];
    for (const dept of departments) {
      const count = await Complaint.countDocuments({ department: dept._id });
      const resolved = await Complaint.countDocuments({ department: dept._id, status: 'Resolved' });
      departmentBreakdown.push({
        id: dept._id,
        name: dept.name,
        code: dept.code,
        categories: dept.categoriesCovered,
        totalAssigned: count,
        resolved,
        pending: count - resolved,
      });
    }

    // Total upvotes across system
    const upvotesAggregate = await Complaint.aggregate([
      { $group: { _id: null, totalUpvotes: { $sum: '$upvoteCount' } } },
    ]);
    const totalUpvotes = upvotesAggregate.length > 0 ? upvotesAggregate[0].totalUpvotes : 0;

    // Recent 5 complaints
    const recentComplaints = await Complaint.find()
      .populate('citizen', 'name email')
      .populate('department', 'name code')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalComplaints,
        totalCitizens,
        totalUpvotes,
        statusCounts,
        categoryCounts,
        severityCounts,
        departmentBreakdown,
        recentComplaints,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Complaint Status & add admin remarks
// @route   PUT /api/admin/complaints/:id/status
// @access  Private (Admin Only)
const updateComplaintStatus = async (req, res) => {
  try {
    const { status, remarks, departmentId } = req.body;
    const complaint = await Complaint.findById(req.params.id).populate('citizen');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    const previousStatus = complaint.status;
    complaint.status = status;

    if (departmentId) {
      const dept = await Department.findById(departmentId);
      if (dept) {
        complaint.department = dept._id;
        complaint.departmentName = dept.name;
      }
    }

    complaint.statusHistory.push({
      status,
      updatedBy: req.user._id,
      remarks: remarks || `Status changed from ${previousStatus} to ${status}.`,
      timestamp: new Date(),
    });

    await complaint.save();

    // If marked as Resolved, award +50 points to citizen
    if (status === 'Resolved' && previousStatus !== 'Resolved') {
      await awardRewardPoints(
        complaint.citizen._id,
        50,
        `Civic issue #${complaint._id.toString().slice(-6)} (${complaint.aiCategory}) has been successfully resolved!`,
        complaint._id
      );

      await createNotification({
        userId: complaint.citizen._id,
        title: 'Issue Resolved!',
        message: `Your complaint for ${complaint.aiCategory} has been marked RESOLVED by the municipal department. ${remarks ? `Remarks: "${remarks}"` : ''}`,
        type: 'complaint_resolved',
        relatedComplaintId: complaint._id,
      });
    } else {
      // General status update notification
      await createNotification({
        userId: complaint.citizen._id,
        title: `Complaint Status: ${status}`,
        message: `Your complaint #${complaint._id.toString().slice(-6)} is now "${status}". ${remarks ? `Remarks: "${remarks}"` : ''}`,
        type: 'status_updated',
        relatedComplaintId: complaint._id,
      });
    }

    res.status(200).json({
      success: true,
      message: `Complaint status updated to ${status}.`,
      complaint,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all registered citizens with complaint statistics
// @route   GET /api/admin/citizens
// @access  Private (Admin Only)
const getAllCitizens = async (req, res) => {
  try {
    const citizens = await User.find({ role: 'citizen' }).select('-password').sort({ rewardPoints: -1 });

    const citizensWithStats = await Promise.all(
      citizens.map(async (citizen) => {
        const totalComplaints = await Complaint.countDocuments({ citizen: citizen._id });
        const resolvedComplaints = await Complaint.countDocuments({ citizen: citizen._id, status: 'Resolved' });
        const upvotesGiven = await Complaint.countDocuments({ upvotes: citizen._id });

        return {
          ...citizen.toObject(),
          totalComplaints,
          resolvedComplaints,
          upvotesGiven,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: citizensWithStats.length,
      citizens: citizensWithStats,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get departments with routing information
// @route   GET /api/admin/departments
// @access  Private (Admin Only)
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.status(200).json({
      success: true,
      count: departments.length,
      departments,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a complaint (Admin only)
// @route   DELETE /api/admin/complaints/:id
// @route   DELETE /api/complaints/:id
// @access  Private (Admin Only)
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found.',
      });
    }

    const complaintId = complaint._id;
    const imageUrl = complaint.imageUrl;

    // 1. Delete complaint from database
    await Complaint.findByIdAndDelete(complaintId);

    // 2. Clean up any notifications linked to this complaint
    await Notification.deleteMany({ relatedComplaint: complaintId });

    // 3. Unlink duplicateOf references in other complaints
    await Complaint.updateMany(
      { duplicateOf: complaintId },
      { $unset: { duplicateOf: 1 } }
    );

    // 4. Safely clean up uploaded image if no other complaint is using it
    if (imageUrl) {
      const filename = path.basename(imageUrl);
      if (filename && !filename.startsWith('sample-')) {
        const remainingUsageCount = await Complaint.countDocuments({
          imageUrl: { $regex: filename, $options: 'i' },
        });

        if (remainingUsageCount === 0) {
          const uploadsDirectory = path.resolve(__dirname, '../../uploads');
          const filePath = path.join(uploadsDirectory, filename);
          try {
            await fs.unlink(filePath);
          } catch (fileErr) {
            if (fileErr.code !== 'ENOENT') {
              console.warn('[Admin Controller] Could not delete unused image file:', fileErr.message);
            }
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Complaint deleted successfully.',
      deletedComplaintId: complaintId,
    });
  } catch (error) {
    console.error('[Admin Controller] Delete error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete complaint.',
    });
  }
};

module.exports = {
  getDashboardStats,
  updateComplaintStatus,
  getAllCitizens,
  getDepartments,
  deleteComplaint,
};
