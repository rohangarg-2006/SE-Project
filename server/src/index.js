import express from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeSocket, getActiveRequests } from './socket.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb+srv://robinkumardbg11:aPTJ!E8LbWEgZZf@first.qxoadwq.mongodb.net/se_proj?retryWrites=true&w=majority&appName=First')
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 3001;

// ==================== REST ENDPOINTS ====================

const rideSchema = new mongoose.Schema({
  requestId: String,
  passengerId: String,
  driverId: String,
  pickupStopId: String,
  destinationStopId: String,
  status: String,
  completedAt: {
    type: Date,
    default: Date.now
  }
});

const Ride = mongoose.model("Ride", rideSchema);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Get all active requests
app.get('/api/requests', (req, res) => {
  const requests = getActiveRequests();
  res.json({ requests, count: requests.length });
});


 app.post("/api/rides/complete", async (req, res) => {
  try {
    console.log("hello");
    
    const ride = new Ride(req.body);
    await ride.save();

    console.log("Ride saved:", ride);

    res.status(201).json({ message: "Ride saved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save ride" });
  }
});

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ==================== SOCKET.IO INITIALIZATION ====================

initializeSocket(io);

// ==================== SERVER STARTUP ====================

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Campus Virtual Bus Server Started        ║
║   Port: ${PORT}                              ║
║   Socket.io Ready for connections          ║
╚════════════════════════════════════════════╝
  `);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Socket.io listening on http://localhost:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});