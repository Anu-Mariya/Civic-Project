const mongoose = require('mongoose');

async function viewDatabase() {
  try {
    const mongoUri = 'mongodb://127.0.0.1:27017/civic_complaints';
    await mongoose.connect(mongoUri);

    console.log('\n=============================================================');
    console.log('       CIVIC PLATFORM - MONGODB DATABASE INSPECTOR           ');
    console.log('=============================================================');
    console.log(`Database Name: civic_complaints`);
    console.log(`MongoDB URI:   ${mongoUri}\n`);

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Complaint = mongoose.model('Complaint', new mongoose.Schema({}, { strict: false }));
    const Department = mongoose.model('Department', new mongoose.Schema({}, { strict: false }));

    const users = await User.find();
    console.log(`👤 USERS COLLECTION (${users.length} registered accounts):`);
    users.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.name} | ${u.email} | Role: ${u.role} | Points: ${u.rewardPoints || 0} pts`);
    });

    const complaints = await Complaint.find();
    console.log(`\n📋 COMPLAINTS COLLECTION (${complaints.length} tickets):`);
    complaints.forEach((c, i) => {
      console.log(`  ${i + 1}. [${c.aiCategory}] "${c.title}" | Status: ${c.status} | Dept: ${c.departmentName}`);
    });

    const departments = await Department.find();
    console.log(`\n🏢 DEPARTMENTS COLLECTION (${departments.length} departments):`);
    departments.forEach((d, i) => {
      console.log(`  ${i + 1}. ${d.name} (${d.code}) | SLA: ${d.slaHours}h`);
    });

    console.log('=============================================================\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error viewing database:', error.message);
    process.exit(1);
  }
}

viewDatabase();
