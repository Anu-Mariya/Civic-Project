const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config({ path: './.env' });

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/civic_platform_test');
  
  // Clear previous
  await User.deleteMany({ email: 'test@test.com' });
  
  const user = await User.create({
    name: "Test",
    email: "test@test.com",
    password: "password123"
  });
  
  console.log("Hashed password:", user.password);
  
  const foundUser = await User.findOne({ email: "test@test.com" });
  const isMatch = await foundUser.comparePassword("password123");
  
  console.log("Does it match?", isMatch);
  
  mongoose.disconnect();
}

test().catch(console.error);
