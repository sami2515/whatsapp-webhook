import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import './config/env.js';
import connectDB from './config/db.js';
import messagesRouter from './routes/messages.js';

const app = express();
const server = http.createServer(app);

// Real-Time Socket.io Setup with flexible CORS
const io = new SocketIOServer(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'DELETE']
    }
});

// Save io reference in Express app so controllers can emit events
app.set('io', io);

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local uploads folder if fallback storage is used
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Socket.io connection logging
io.on('connection', (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
        console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
});

// Routes - support both /api/messages and /api/whatsapp for full compatibility
app.use('/api/messages', messagesRouter);
app.use('/api/whatsapp', messagesRouter);

// Health check root route
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'WhatsApp Live Chat Server is running with MongoDB & Cloudinary.',
        timestamp: new Date()
    });
});

server.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🚀 Chat Server running on port ${PORT}`);
    console.log(`📡 Socket.io active for real-time frontend connection`);
    console.log(`📦 MongoDB & Cloudinary endpoints ready`);
    console.log(`===============================================`);
});
