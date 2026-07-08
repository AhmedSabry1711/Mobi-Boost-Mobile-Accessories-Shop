require('dotenv').config();

const connectDB = require('./config/db');
const Admin = require('./models/Admin');

const seedAdmin = async () => {
  try {
    await connectDB();

    // نتأكد إنه مش موجود بالفعل
    const exists = await Admin.findOne({ username: 'admin' });

    if (exists) {
      console.log('⚠️ Admin already exists');
      process.exit();
    }

    await Admin.create({
      name: 'Ahmed',
      username: 'admin',
      password: '123',
      jobTitle: 'Owner',
      phone: '01012345678'
    });

    console.log('✅ Admin created successfully');
    process.exit();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedAdmin();