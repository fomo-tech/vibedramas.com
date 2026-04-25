import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vibe-drama';

async function seedAdmin() {
  await mongoose.connect(MONGODB_URI);
  console.log('🔗 Connected to MongoDB');

  const adminEmail = 'admin@vibe.com';
  const plainPassword = 'admin';

  let admin = await User.findOne({ email: adminEmail });
  
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  if (!admin) {
    admin = await User.create({
      username: 'Administrator',
      email: adminEmail,
      passwordHash: hashedPassword,
      role: 'admin',
      coins: 999999,
      vipStatus: true,
      vipExpiry: new Date('2099-12-31')
    });
    console.log('✅ Admin user created successfully.');
  } else {
    admin.role = 'admin';
    admin.passwordHash = hashedPassword;
    await admin.save();
    console.log('✅ Existing user promoted to Admin and password reset.');
  }

  console.log(`
    Credentials:
    Email: ${adminEmail}
    Password: ${plainPassword}
  `);

  process.exit(0);
}

seedAdmin().catch(console.error);
