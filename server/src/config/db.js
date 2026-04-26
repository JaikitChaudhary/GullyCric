import mongoose from 'mongoose';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/gullycric';
const dbName = process.env.MONGO_DB_NAME || 'gullycric';
console.log(uri, dbName);

export const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      dbName,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};
