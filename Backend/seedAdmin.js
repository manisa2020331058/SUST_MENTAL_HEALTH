const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

const seedAdmin = async () => {
  try {
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const admin = await User.create({
      name: 'Super Admin',
      email: 'mossamanisa@gmail.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('Admin user created:', admin);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();
