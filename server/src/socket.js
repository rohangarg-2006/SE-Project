import { loadStops } from './utils/stopsLoader.js';

// Map to track active ride requests
// Format: { requestId: { passengerId, pickupStop, destinationStop, timestamp, status } }
export const activeRequests = new Map();

// Counters for generating unique IDs
let requestCounter = 1;

export const initializeSocket = (io) => {
  // Load stops on initialization
  const stops = loadStops();

  // Handle namespace connections
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // ==================== PASSENGER EVENTS ====================

    // Passenger joins room
    socket.on('JOIN_PASSENGER', (data) => {
      socket.join('passengers');
      console.log(`Passenger ${socket.id} joined the passengers room`);
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

      console.log(`New ride request: ${requestId}`, rideRequest);

      // Emit to all connected drivers
      io.to('drivers').emit('NEW_RIDE_REQUEST', rideRequest);

      // Emit acknowledgment to passenger
      socket.emit('REQUEST_ACKNOWLEDGED', {
        requestId,
        status: 'PENDING',
        message: 'Your request has been broadcasted to drivers',
      });
    });

    // ==================== DRIVER EVENTS ====================

    // Driver joins room
    socket.on('JOIN_DRIVER', (data) => {
      socket.join('drivers');
      socket.driverId = data.driverId;
      console.log(`Driver ${socket.driverId} (${socket.id}) joined the drivers room`);

      // Send driver all pending requests
      const pendingRequests = Array.from(activeRequests.values()).filter(
        (req) => req.status === 'PENDING'
      );
      socket.emit('PENDING_REQUESTS', pendingRequests);
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