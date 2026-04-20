import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

// Create the context
const RideContext = createContext();

// Provider component
export const RideProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [userType, setUserType] = useState(null); // 'passenger' or 'driver'
  const [stops, setStops] = useState([]);
  
  // Ride state
  const [rideState, setRideState] = useState({
    status: 'IDLE', // IDLE, REQUESTING, MATCHED, COMPLETED
    requestId: null,
    pickupStopId: null,
    destinationStopId: null,
    driverId: null,
    seatsAvailable: 0,
    timestamp: null,
    acceptedAt: null,
  });

  // Live ride requests (for drivers)
  const [pendingRequests, setPendingRequests] = useState([]);
  
  // Notifications
  const [notification, setNotification] = useState(null);

  // Initialize Socket.io connection
  useEffect(() => {
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
    const newSocket = io(serverUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('Connected to server:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    newSocket.on('STOPS_LIST', (stopsData) => {
      setStops(stopsData);
    });

    newSocket.on('ERROR', (data) => {
      showNotification(data.message, 'error');
    });

    setSocket(newSocket);

    // Fetch stops on connection
    setTimeout(() => {
      newSocket.emit('GET_STOPS');
    }, 500);

    return () => {
      newSocket.close();
    };
  }, []);

  // Notification handler
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => setNotification(null), 4000);
  };

  // ==================== PASSENGER METHODS ====================

  const joinAsPassenger = useCallback((passengerId) => {
    if (socket) {
      setUserType('passenger');
      socket.emit('JOIN_PASSENGER', { passengerId });
      console.log('Joined as passenger:', passengerId);
    }
  }, [socket]);

  const requestRide = useCallback((passengerId, pickupStopId, destinationStopId) => {
    if (!socket) return;

    setRideState((prev) => ({
      ...prev,
      status: 'REQUESTING',
      pickupStopId,
      destinationStopId,
      timestamp: Date.now(),
    }));

    socket.emit('REQUEST_RIDE', {
      passengerId,
      pickupStopId,
      destinationStopId,
    });
  }, [socket]);

  const cancelRide = useCallback(() => {
    setRideState({
      status: 'IDLE',
      requestId: null,
      pickupStopId: null,
      destinationStopId: null,
      driverId: null,
      seatsAvailable: 0,
      timestamp: null,
      acceptedAt: null,
    });
    showNotification('Ride request cancelled');
  }, []);

  // ==================== DRIVER METHODS ====================

  const joinAsDriver = useCallback((driverId, seatsAvailable = 5) => {
    if (socket) {
      setUserType('driver');
      socket.emit('JOIN_DRIVER', { driverId, seatsAvailable });
      console.log('Joined as driver:', driverId);
    }
  }, [socket]);

  const acceptRide = useCallback((requestId, driverId, seatsAvailable) => {
    if (!socket) return;

    socket.emit('ACCEPT_RIDE', {
      requestId,
      driverId,
      seatsAvailable,
    });
  }, [socket]);

  const completeRide = useCallback((requestId, driverId) => {
    if (!socket) return;

    socket.emit('COMPLETE_RIDE', {
      requestId,
      driverId,
    });

    // Clear ride state after completion
    setTimeout(() => {
      setRideState({
        status: 'IDLE',
        requestId: null,
        pickupStopId: null,
        destinationStopId: null,
        driverId: null,
        seatsAvailable: 0,
        timestamp: null,
        acceptedAt: null,
      });
    }, 1000);
  }, [socket]);

  // ==================== SOCKET EVENT LISTENERS ====================

  useEffect(() => {
    if (!socket) return;

    // Passenger events
    socket.on('REQUEST_ACKNOWLEDGED', (data) => {
      setRideState((prev) => ({
        ...prev,
        requestId: data.requestId,
        status: 'REQUESTING',
      }));
      showNotification(data.message, 'success');
    });

    socket.on('RIDE_ACCEPTED', (data) => {
      setRideState((prev) => ({
        ...prev,
        status: 'MATCHED',
        driverId: data.driverId,
        acceptedAt: Date.now(),
      }));
      showNotification('Driver accepted your ride! On the way...', 'success');
    });

    socket.on('RIDE_COMPLETED', (data) => {
      setRideState((prev) => ({
        ...prev,
        status: 'COMPLETED',
      }));
      showNotification(data.message, 'success');
    });

    // Driver events
    socket.on('PENDING_REQUESTS', (requests) => {
      setPendingRequests(requests);
    });

    socket.on('NEW_RIDE_REQUEST', (request) => {
      setPendingRequests((prev) => [request, ...prev]);
    });

    socket.on('REQUEST_TAKEN', (data) => {
      setPendingRequests((prev) =>
        prev.filter((req) => req.requestId !== data.requestId)
      );
    });

    socket.on('RIDE_ACCEPTED_CONFIRMATION', (data) => {
      setRideState((prev) => ({
        ...prev,
        requestId: data.requestId,
        status: 'MATCHED',
        seatsAvailable: data.seatsAvailable,
      }));
      showNotification('Ride accepted successfully!', 'success');
    });

    return () => {
      socket.off('REQUEST_ACKNOWLEDGED');
      socket.off('RIDE_ACCEPTED');
      socket.off('RIDE_COMPLETED');
      socket.off('PENDING_REQUESTS');
      socket.off('NEW_RIDE_REQUEST');
      socket.off('REQUEST_TAKEN');
      socket.off('RIDE_ACCEPTED_CONFIRMATION');
    };
  }, [socket]);

  const value = {
    socket,
    userType,
    stops,
    rideState,
    setRideState,
    notification,
    showNotification,
    pendingRequests,
    // Passenger methods
    joinAsPassenger,
    requestRide,
    cancelRide,
    // Driver methods
    joinAsDriver,
    acceptRide,
    completeRide,
  };

  return <RideContext.Provider value={value}>{children}</RideContext.Provider>;
};

// Custom hook to use the RideContext
export const useRide = () => {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return context;
};