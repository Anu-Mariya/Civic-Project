const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

const sampleDepartments = [
  {
    name: 'Roads & Highway Maintenance Department',
    code: 'ROADS',
    description: 'Responsible for road surface upkeep, pothole repair, lane marking, and asphalt maintenance.',
    contactEmail: 'roads@civic.gov',
    contactPhone: '+91 80 2266 0001',
    headOfDepartment: 'Er. Rajesh Kumar',
    categoriesCovered: ['Pothole'],
    slaHours: 48,
  },
  {
    name: 'Waste Management & Sanitation Department',
    code: 'WASTE',
    description: 'Handles municipal solid waste clearance, community dumpster maintenance, and daily sanitation.',
    contactEmail: 'sanitation@civic.gov',
    contactPhone: '+91 80 2266 0002',
    headOfDepartment: 'Dr. Sunita Rao',
    categoriesCovered: ['Garbage Overflow'],
    slaHours: 24,
  },
  {
    name: 'Electrical & Public Lighting Department',
    code: 'ELECTRICAL',
    description: 'Maintains streetlights, public illumination grids, electrical poles, and underground cabling.',
    contactEmail: 'electrical@civic.gov',
    contactPhone: '+91 80 2266 0003',
    headOfDepartment: 'Er. Vikram Malhotra',
    categoriesCovered: ['Broken Streetlight'],
    slaHours: 36,
  },
  {
    name: 'Stormwater Drainage & Sewerage Department',
    code: 'DRAINAGE',
    description: 'Manages stormwater canals, roadside culverts, sewage overflow prevention, and monsoon drainage.',
    contactEmail: 'drainage@civic.gov',
    contactPhone: '+91 80 2266 0004',
    headOfDepartment: 'Er. Mohammed Farooq',
    categoriesCovered: ['Drainage Issue'],
    slaHours: 48,
  },
  {
    name: 'Municipal Grievance Cell',
    code: 'GENERAL',
    description: 'General civic complaints, public property encroachment, and miscellaneous grievances.',
    contactEmail: 'grievance@civic.gov',
    contactPhone: '+91 80 2266 0000',
    headOfDepartment: 'Smt. Kavitha Reddy',
    categoriesCovered: ['Other'],
    slaHours: 72,
  },
];

// Create sample placeholder images in uploads if not present
function createPlaceholderImage(filename, text) {
  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  const filePath = path.join(uploadDir, filename);
  if (!fs.existsSync(filePath)) {
    // Generate a clean minimal SVG saved as placeholder or sample image
    const svg = `<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#1e293b"/>
      <circle cx="300" cy="160" r="70" fill="#3b82f6" opacity="0.2"/>
      <text x="50%" y="45%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff">${text}</text>
      <text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#94a3b8">Civic Infrastructure Photo Verified by AI</text>
    </svg>`;
    fs.writeFileSync(filePath, svg);
  }
}

async function seedData() {
  try {
    console.log('[Seeder] Checking database seed status...');

    // 1. Seed Departments
    for (const dept of sampleDepartments) {
      const exists = await Department.findOne({ code: dept.code });
      if (!exists) {
        await Department.create(dept);
      }
    }
    console.log('[Seeder] Municipal departments synchronized.');

    // 2. Seed Admin User
    const adminEmail = 'admin@civic.gov';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'Municipal Administrator',
        email: adminEmail,
        password: 'Admin@123',
        role: 'admin',
        rewardPoints: 500,
        phone: '+91 9876543210',
        address: 'City Corporation Headquarters, Ward 4',
      });
      console.log(`[Seeder] Admin account created: ${adminEmail} (password: Admin@123)`);
    }

    // 3. Seed Demo Citizens
    const demoCitizens = [
      {
        name: 'Rahul Sharma',
        email: 'rahul.sharma@example.com',
        password: 'Citizen@123',
        role: 'citizen',
        rewardPoints: 85,
        phone: '+91 98888 11111',
        address: 'Indiranagar 100ft Road, Bangalore',
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@example.com',
        password: 'Citizen@123',
        role: 'citizen',
        rewardPoints: 60,
        phone: '+91 97777 22222',
        address: 'Koramangala 4th Block, Bangalore',
      },
      {
        name: 'Ananya Verma',
        email: 'ananya.verma@example.com',
        password: 'Citizen@123',
        role: 'citizen',
        rewardPoints: 35,
        phone: '+91 96666 33333',
        address: 'Whitefield Main Road, Bangalore',
      },
    ];

    const citizenUsers = [];
    for (const c of demoCitizens) {
      let user = await User.findOne({ email: c.email });
      if (!user) {
        user = await User.create(c);
      }
      citizenUsers.push(user);
    }
    console.log('[Seeder] Demo citizens synchronized.');

    // 4. Seed Initial Complaints if none exist
    const complaintCount = await Complaint.countDocuments();
    if (complaintCount === 0) {
      console.log('[Seeder] Populating realistic sample civic complaints...');

      createPlaceholderImage('sample-pothole.svg', 'Pothole on 12th Main Road');
      createPlaceholderImage('sample-garbage.svg', 'Garbage Overflow near Park');
      createPlaceholderImage('sample-light.svg', 'Broken Streetlight #402');
      createPlaceholderImage('sample-drainage.svg', 'Blocked Stormwater Drain');

      const roadsDept = await Department.findOne({ code: 'ROADS' });
      const wasteDept = await Department.findOne({ code: 'WASTE' });
      const elecDept = await Department.findOne({ code: 'ELECTRICAL' });
      const drainDept = await Department.findOne({ code: 'DRAINAGE' });

      const sampleComplaints = [
        {
          title: 'Deep Pothole near Indiranagar Metro Station',
          description: 'A deep pothole has formed in the center of the lane right before the metro pillar. Causing vehicle slowdown and skidding hazard.',
          citizen: citizenUsers[0]._id,
          imageUrl: '/uploads/sample-pothole.svg',
          location: {
            latitude: 12.9784,
            longitude: 77.6408,
            address: '100 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038',
          },
          aiCategory: 'Pothole',
          aiSeverity: 'High',
          aiConfidence: 0.96,
          aiSummary: 'Significant asphalt crater detected in traffic lane with loose gravel perimeter, posing acute hazard for two-wheelers.',
          department: roadsDept._id,
          departmentName: roadsDept.name,
          status: 'In Progress',
          upvotes: [citizenUsers[1]._id, citizenUsers[2]._id],
          upvoteCount: 2,
          statusHistory: [
            {
              status: 'Submitted',
              updatedBy: citizenUsers[0]._id,
              remarks: 'Complaint filed with photo evidence.',
              timestamp: new Date(Date.now() - 48 * 3600 * 1000),
            },
            {
              status: 'Assigned',
              updatedBy: admin._id,
              remarks: 'Routed to Roads & Highway Maintenance Department. Work crew dispatch queued.',
              timestamp: new Date(Date.now() - 24 * 3600 * 1000),
            },
            {
              status: 'In Progress',
              updatedBy: admin._id,
              remarks: 'Road crew assigned with asphalt patch mix. Repair in progress.',
              timestamp: new Date(Date.now() - 6 * 3600 * 1000),
            },
          ],
        },
        {
          title: 'Severe Municipal Garbage Overflow at 4th Block Park',
          description: 'The community trash container has been overflowing for 3 days onto the pedestrian walkway. Foul odor and stray animals gathering.',
          citizen: citizenUsers[1]._id,
          imageUrl: '/uploads/sample-garbage.svg',
          location: {
            latitude: 12.9352,
            longitude: 77.6245,
            address: '80 Feet Rd, 4th Block, Koramangala, Bengaluru, Karnataka 560034',
          },
          aiCategory: 'Garbage Overflow',
          aiSeverity: 'Critical',
          aiConfidence: 0.94,
          aiSummary: 'Extensive solid waste spillover exceeding container capacity, obstructing pedestrian pathway and raising sanitary concerns.',
          department: wasteDept._id,
          departmentName: wasteDept.name,
          status: 'Assigned',
          upvotes: [citizenUsers[0]._id],
          upvoteCount: 1,
          statusHistory: [
            {
              status: 'Submitted',
              updatedBy: citizenUsers[1]._id,
              remarks: 'Citizen reported overflow with GPS photo.',
              timestamp: new Date(Date.now() - 12 * 3600 * 1000),
            },
            {
              status: 'Assigned',
              updatedBy: admin._id,
              remarks: 'Assigned to Waste Management & Sanitation Dept morning collection truck.',
              timestamp: new Date(Date.now() - 8 * 3600 * 1000),
            },
          ],
        },
        {
          title: 'Damaged Streetlight Pole with Exposed Wires',
          description: 'Streetlight pole knocked askew, light fixture dark every night. Pedestrians cannot see the sidewalk after 7 PM.',
          citizen: citizenUsers[2]._id,
          imageUrl: '/uploads/sample-light.svg',
          location: {
            latitude: 12.9698,
            longitude: 77.7499,
            address: 'ITPL Main Rd, Whitefield, Bengaluru, Karnataka 560066',
          },
          aiCategory: 'Broken Streetlight',
          aiSeverity: 'Medium',
          aiConfidence: 0.91,
          aiSummary: 'Sodium-vapor luminaire dark with structural tilt, reducing street illumination along the pedestrian corridor.',
          department: elecDept._id,
          departmentName: elecDept.name,
          status: 'Submitted',
          upvotes: [],
          upvoteCount: 0,
          statusHistory: [
            {
              status: 'Submitted',
              updatedBy: citizenUsers[2]._id,
              remarks: 'Reported by resident.',
              timestamp: new Date(Date.now() - 4 * 3600 * 1000),
            },
          ],
        },
        {
          title: 'Monsoon Stormwater Drain Clogged with Debris',
          description: 'Roadside drain fully blocked by plastic bottles and silt. Water pooling on road during recent rainfall.',
          citizen: citizenUsers[0]._id,
          imageUrl: '/uploads/sample-drainage.svg',
          location: {
            latitude: 12.9716,
            longitude: 77.5946,
            address: 'Cubbon Park Entrance Rd, Bengaluru, Karnataka 560001',
          },
          aiCategory: 'Drainage Issue',
          aiSeverity: 'High',
          aiConfidence: 0.95,
          aiSummary: 'Culvert entrance choked with solid debris causing stagnant stormwater accumulation on roadway curb.',
          department: drainDept._id,
          departmentName: drainDept.name,
          status: 'Resolved',
          upvotes: [citizenUsers[1]._id, citizenUsers[2]._id],
          upvoteCount: 2,
          statusHistory: [
            {
              status: 'Submitted',
              updatedBy: citizenUsers[0]._id,
              remarks: 'Initial complaint filed.',
              timestamp: new Date(Date.now() - 72 * 3600 * 1000),
            },
            {
              status: 'Assigned',
              updatedBy: admin._id,
              remarks: 'Routed to Stormwater Drainage crew.',
              timestamp: new Date(Date.now() - 50 * 3600 * 1000),
            },
            {
              status: 'In Progress',
              updatedBy: admin._id,
              remarks: 'Silt suction jetting machine deployed.',
              timestamp: new Date(Date.now() - 24 * 3600 * 1000),
            },
            {
              status: 'Resolved',
              updatedBy: admin._id,
              remarks: 'Drain desilted and cleared. Flow restored. +50 bonus reward points awarded to citizen.',
              timestamp: new Date(Date.now() - 2 * 3600 * 1000),
            },
          ],
        },
      ];

      for (const item of sampleComplaints) {
        const c = await Complaint.create(item);
        // Seed notifications
        await Notification.create({
          user: item.citizen,
          title: `Complaint Updated: ${item.aiCategory}`,
          message: `Your complaint for ${item.title} is currently marked as ${item.status}.`,
          type: item.status === 'Resolved' ? 'complaint_resolved' : 'status_updated',
          relatedComplaint: c._id,
          isRead: false,
        });
      }
      console.log('[Seeder] Sample complaints and notifications successfully created!');
    }
  } catch (error) {
    console.error('[Seeder] Error during database seeding:', error.message);
  }
}

// Support running directly from CLI via `npm run seed`
if (require.main === module) {
  require('dotenv').config();
  const { connectDB, closeDB } = require('../config/db');
  connectDB().then(async () => {
    await seedData();
    await closeDB();
    process.exit(0);
  });
}

module.exports = { seedData };
