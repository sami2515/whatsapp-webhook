import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // Connect to local MongoDB by default if no URI is provided.
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/whatsapp-bot');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
