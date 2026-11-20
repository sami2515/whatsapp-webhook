import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/whatsapp-chats';
        const conn = await mongoose.connect(uri);
        console.log(`[MongoDB] Connected successfully: ${conn.connection.host} (${conn.connection.name})`);
    } catch (error) {
        console.error(`[MongoDB Connection Error] ${error.message}`);
        // Do not crash server completely if MongoDB is temporarily down, but log clearly
    }
};

export default connectDB;
