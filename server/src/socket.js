import { loadStops } from './utils/stopsLoader.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Map to track active ride requests
// Format: { requestId: { passengerId, pickupStop, destinationStop, timestamp, status } }
export const activeRequests = new Map();
export const rideHistory = [];

// Counters for generating unique IDs
let requestCounter = 1;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const RIDE_HISTORY_FILE = path.join(DATA_DIR, 'rideHistory.json');

const persistRideHistory = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(RIDE_HISTORY_FILE, JSON.stringify(rideHistory, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to persist ride history:', error);
  }
};

const loadRideHistory = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const fileContent = await fs.readFile(RIDE_HISTORY_FILE, 'utf-8');
    const parsed = JSON.parse(fileContent);
    if (Array.isArray(parsed)) {
      rideHistory.splice(0, rideHistory.length, ...parsed);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(RIDE_HISTORY_FILE, JSON.stringify([], null, 2), 'utf-8');
      return;
    }
    console.error('Failed to load ride history:', error);
  }
};

const getRideHistoryForUser = (userType, userId) => {
  if (!userType || !userId) {
    return rideHistory;
  }

  if (userType === 'passenger') {
    return rideHistory.filter((ride) => ride.passengerId === userId);
  }

  if (userType === 'driver') {
    return rideHistory.filter((ride) => ride.driverId === userId);
  }

  return rideHistory;
};

export const getRideHistory = (userType, userId) => {
  return getRideHistoryForUser(userType, userId);
};

export const initializeSocket = (io) => {
  // Load stops on initialization
  const stops = loadStops();
  loadRideHistory();

  // Handle namespace connections
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // ==================== PASSENGER EVENTS ====================

    // Passenger joins room
    socket.on('JOIN_PASSENGER', (data) => {
      socket.join('passengers');
      socket.userType = 'passenger';
      socket.userId = data?.passengerId;
      console.log(`Passenger ${socket.id} joined the passengers room`);
      socket.emit('RIDE_HISTORY', getRideHistoryForUser('passenger', socket.userId));
    });

    // Passenger broadcasts ride request
    socket.on('REQUEST_RIDE', (data) => {
      const { passengerId, pickupStopId, destinationStopId } = data;

      if (!pickupStopId || !destinationStopId) {
        socket.emit('ERROR', { message: 'Invalid stops selected' });
        return;
      }

      if (pickupStopId === destinationStopId) {
        socket.emit('ERROR', { message: 'Pickup and destination must be different' });
        return;
      }

      // Create new ride request
      const requestId = `REQ_${Date.now()}_${requestCounter++}`;
      const rideRequest = {
        requestId,
        passengerId,
        pickupStopId,
        destinationStopId,
        timestamp: Date.now(),
        status: 'PENDING',
      };

      // Store in active requests
      activeRequests.set(requestId, rideRequest);
      rideHistory.unshift({
        ...rideRequest,
        createdAt: Date.now(),
      });
      persistRideHistory();

      console.log(`New ride request: ${requestId}`, rideRequest);

      // Emit to all connected drivers
      io.to('drivers').emit('NEW_RIDE_REQUEST', rideRequest);

      // Emit acknowledgment to passenger
      socket.emit('REQUEST_ACKNOWLEDGED', {
        requestId,
        status: 'PENDING',
        message: 'Your request has been broadcasted to drivers',
      });
      io.emit('RIDE_HISTORY_UPDATED');
    });

    // ==================== DRIVER EVENTS ====================

    // Driver joins room
    socket.on('JOIN_DRIVER', (data) => {
      socket.join('drivers');
      socket.driverId = data.driverId;
      socket.userType = 'driver';
      socket.userId = data.driverId;
      console.log(`Driver ${socket.driverId} (${socket.id}) joined the drivers room`);

      // Send driver all pending requests
      const pendingRequests = Array.from(activeRequests.values()).filter(
        (req) => req.status === 'PENDING'
      );
      socket.emit('PENDING_REQUESTS', pendingRequests);
      socket.emit('RIDE_HISTORY', getRideHistoryForUser('driver', socket.userId));
    });

    // Driver accepts a ride
    socket.on('ACCEPT_RIDE', (data) => {
      const { requestId, driverId, seatsAvailable } = data;
      const request = activeRequests.get(requestId);

      if (!request) {
        socket.emit('ERROR', { message: 'Request not found' });
        return;
      }

      if (request.status !== 'PENDING') {
        socket.emit('ERROR', { message: 'Request already handled' });
        return;
      }

      // Update request status
      request.status = 'ACCEPTED';
      request.driverId = driverId;
      request.acceptedAt = Date.now();

      activeRequests.set(requestId, request);
      const historyItem = rideHistory.find((ride) => ride.requestId === requestId);
      if (historyItem) {
        historyItem.status = request.status;
        historyItem.driverId = driverId;
        historyItem.acceptedAt = request.acceptedAt;
        persistRideHistory();
      }

      console.log(`Driver ${driverId} accepted request ${requestId}`);

      // Notify only the requesting passenger
      io.to('passengers').emit('RIDE_ACCEPTED', {
        requestId,
        driverId,
        message: 'Your ride has been accepted!',
      });

      // Notify all other drivers that request is taken
      socket.broadcast.to('drivers').emit('REQUEST_TAKEN', { requestId });

      // Emit to driver confirming acceptance
      socket.emit('RIDE_ACCEPTED_CONFIRMATION', {
        requestId,
        status: 'ACCEPTED',
        seatsAvailable: Math.max(0, seatsAvailable - 1),
      });
      io.emit('RIDE_HISTORY_UPDATED');
    });

    // Driver completes a ride
    socket.on('COMPLETE_RIDE', (data) => {
      const { requestId, driverId } = data;
      const request = activeRequests.get(requestId);

      if (!request) {
        socket.emit('ERROR', { message: 'Request not found' });
        return;
      }

      // Update request status
      request.status = 'COMPLETED';
      request.completedAt = Date.now();
      request.completedBy = driverId;
      activeRequests.set(requestId, request);
      const historyItem = rideHistory.find((ride) => ride.requestId === requestId);
      if (historyItem) {
        historyItem.status = request.status;
        historyItem.completedAt = request.completedAt;
        historyItem.completedBy = driverId;
        persistRideHistory();
      }

      console.log(`Ride ${requestId} marked as completed by driver ${driverId}`);

      // Notify passenger
      io.to('passengers').emit('RIDE_COMPLETED', {
        requestId,
        message: 'Your ride has been completed',
      });

      // Remove from active requests after 5 seconds (for history purposes)
      setTimeout(() => {
        activeRequests.delete(requestId);
      }, 5000);
      io.emit('RIDE_HISTORY_UPDATED');
    });

    // ==================== GENERAL EVENTS ====================

    // Request status check
    socket.on('CHECK_REQUEST_STATUS', (data) => {
      const { requestId } = data;
      const request = activeRequests.get(requestId);

      if (request) {
        socket.emit('REQUEST_STATUS', request);
      } else {
        socket.emit('ERROR', { message: 'Request not found' });
      }
    });

    // Get all stops
    socket.on('GET_STOPS', () => {
      socket.emit('STOPS_LIST', stops);
    });

    socket.on('GET_RIDE_HISTORY', (data = {}) => {
      const userType = data.userType || socket.userType;
      const userId = data.userId || socket.userId;
      socket.emit('RIDE_HISTORY', getRideHistoryForUser(userType, userId));
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

// Function to get active requests (for API endpoints or debugging)
export const getActiveRequests = () => {
  return Array.from(activeRequests.values());
};
