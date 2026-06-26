const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB conectado: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`Error de conexión MongoDB: ${error.message}`);
    return false;
  }
};

module.exports = connectDB;
