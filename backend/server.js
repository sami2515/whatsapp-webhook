import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import whatsappRoutes from './routes/whatsapp.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/whatsapp', whatsappRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('WhatsApp Cloud API Server is running...');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
