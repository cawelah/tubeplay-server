const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000
    });
    console.log(`MongoDB conectado: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`Error de conexión MongoDB: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
