import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeSocket, getActiveRequests, getRideHistory } from './socket.js';

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

const PORT = process.env.PORT || 3001;

// ==================== REST ENDPOINTS ====================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Get all active requests
app.get('/api/requests', (req, res) => {
  const requests = getActiveRequests();
  res.json({ requests, count: requests.length });
});

app.get('/api/rides', (req, res) => {
  const { userType, userId } = req.query;
  const rides = getRideHistory(userType, userId);
  res.json({ rides, count: rides.length });
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
