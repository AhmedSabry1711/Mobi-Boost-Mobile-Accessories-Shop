const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`🎯 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    process.exit(1); // إيقاف السيرفر لو فشل الاتصال
  }
};

// السطر ده هو أهم سطر، بيتأكد إن الدالة بتخرج بشكل مباشر
module.exports = connectDB;