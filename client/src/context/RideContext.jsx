import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

// Create the context
const RideContext = createContext();
const initialRideState = {
  status: 'IDLE', // IDLE, REQUESTING, MATCHED, COMPLETED
  requestId: null,
  pickupStopId: null,
  destinationStopId: null,
  driverId: null,
  seatsAvailable: 0,
  timestamp: null,
  acceptedAt: null,
};

// Provider component
export const RideProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [userType, setUserType] = useState(null); // 'passenger' or 'driver'
  const [currentUserId, setCurrentUserId] = useState(null);
  const [stops, setStops] = useState([]);
  
  // Ride state
  const [rideState, setRideState] = useState(initialRideState);

  // Live ride requests (for drivers)
  const [pendingRequests, setPendingRequests] = useState([]);
  const [rideHistory, setRideHistory] = useState([]);
  
  // Notifications
  const [notification, setNotification] = useState(null);

  const getHistoryStorageKey = useCallback((role, id) => {
    if (!role || !id) return null;
    return `campusBusRideHistory:${role}:${id}`;
  }, []);

  const upsertLocalRideHistory = useCallback(
    (ridePatch, roleOverride, userIdOverride) => {
      const savedUser = localStorage.getItem('campusBusUser');
      let parsedUser = null;
      if (savedUser) {
        try {
          parsedUser = JSON.parse(savedUser);
        } catch (error) {
          parsedUser = null;
        }
      }

      const role =
        roleOverride ||
        userType ||
        parsedUser?.userType ||
        (parsedUser?.vehicle ? 'driver' : 'passenger');
      const userId = userIdOverride || currentUserId || parsedUser?.userId;
      const storageKey = getHistoryStorageKey(role, userId);
      if (!storageKey || !ridePatch?.requestId) return;

      let storedHistory = [];
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) storedHistory = parsed;
        }
      } catch (error) {
        storedHistory = [];
      }

      const existingIndex = storedHistory.findIndex((ride) => ride.requestId === ridePatch.requestId);
      const updatedRide =
        existingIndex >= 0
          ? { ...storedHistory[existingIndex], ...ridePatch }
          : { ...ridePatch };

      if (existingIndex >= 0) {
        storedHistory[existingIndex] = updatedRide;
      } else {
        storedHistory.unshift(updatedRide);
      }

      localStorage.setItem(storageKey, JSON.stringify(storedHistory));
      setRideHistory(storedHistory);
    },
    [currentUserId, getHistoryStorageKey, userType]
  );

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

  const refreshRideHistory = useCallback(
    async (overrideUserType, overrideUserId) => {
      const savedUser = localStorage.getItem('campusBusUser');
      let parsedUser = null;
      if (savedUser) {
        try {
          parsedUser = JSON.parse(savedUser);
        } catch (error) {
          parsedUser = null;
        }
      }

      const inferredUserType =
        overrideUserType ||
        userType ||
        parsedUser?.userType ||
        (parsedUser?.vehicle ? 'driver' : 'passenger');
      const inferredUserId = overrideUserId || currentUserId || parsedUser?.userId;

      if (!inferredUserType || !inferredUserId) return;

      const storageKey = getHistoryStorageKey(inferredUserType, inferredUserId);
      if (storageKey) {
        try {
          const rawLocalHistory = localStorage.getItem(storageKey);
          if (rawLocalHistory) {
            const parsedLocalHistory = JSON.parse(rawLocalHistory);
            if (Array.isArray(parsedLocalHistory) && parsedLocalHistory.length > 0) {
              setRideHistory(parsedLocalHistory);
            }
          }
        } catch (error) {
          console.error('Failed to read local ride history:', error);
        }
      }

      if (!socket) return;
      socket.emit('GET_RIDE_HISTORY', {
        userType: inferredUserType,
        userId: inferredUserId,
      });

      // Fallback fetch to ensure history is visible even if socket event is delayed.
      try {
        const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';
        const response = await fetch(
          `${serverUrl}/api/rides?userType=${encodeURIComponent(inferredUserType)}&userId=${encodeURIComponent(inferredUserId)}`
        );
        if (!response.ok) return;
        const data = await response.json();
        if (Array.isArray(data?.rides)) {
          setRideHistory(data.rides);
        }
      } catch (error) {
        console.error('Failed to fetch ride history from API:', error);
      }
    },
    [socket, userType, currentUserId, getHistoryStorageKey]
  );

  // ==================== PASSENGER METHODS ====================

  const joinAsPassenger = useCallback((passengerId) => {
    if (socket) {
      setUserType('passenger');
      setCurrentUserId(passengerId);
      socket.emit('JOIN_PASSENGER', { passengerId });
      socket.emit('GET_RIDE_HISTORY', { userType: 'passenger', userId: passengerId });
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

  const resetRideState = useCallback(() => {
    setRideState(initialRideState);
  }, []);

  const cancelRide = useCallback(() => {
    resetRideState();
    showNotification('Ride request cancelled');
  }, [resetRideState]);

  // ==================== DRIVER METHODS ====================

  const joinAsDriver = useCallback((driverId, seatsAvailable = 5) => {
    if (socket) {
      setUserType('driver');
      setCurrentUserId(driverId);
      socket.emit('JOIN_DRIVER', { driverId, seatsAvailable });
      socket.emit('GET_RIDE_HISTORY', { userType: 'driver', userId: driverId });
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
      resetRideState();
    }, 1000);
  }, [socket, resetRideState]);

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
      upsertLocalRideHistory({
        requestId: data.requestId,
        passengerId: currentUserId,
        pickupStopId: rideState.pickupStopId,
        destinationStopId: rideState.destinationStopId,
        timestamp: rideState.timestamp || Date.now(),
        status: 'PENDING',
      });
      showNotification(data.message, 'success');
    });

    socket.on('RIDE_ACCEPTED', (data) => {
      setRideState((prev) => ({
        ...prev,
        status: 'MATCHED',
        driverId: data.driverId,
        acceptedAt: Date.now(),
      }));
      upsertLocalRideHistory({
        requestId: data.requestId,
        status: 'ACCEPTED',
        driverId: data.driverId,
        acceptedAt: Date.now(),
      });
      showNotification('Driver accepted your ride! On the way...', 'success');
    });

    socket.on('RIDE_COMPLETED', (data) => {
      setRideState((prev) => ({
        ...prev,
        status: 'COMPLETED',
      }));
      upsertLocalRideHistory({
        requestId: data.requestId,
        status: 'COMPLETED',
        completedAt: Date.now(),
      });
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

    socket.on('RIDE_HISTORY', (history) => {
      const normalizedHistory = Array.isArray(history) ? history : [];
      setRideHistory(normalizedHistory);

      const savedUser = localStorage.getItem('campusBusUser');
      let parsedUser = null;
      if (savedUser) {
        try {
          parsedUser = JSON.parse(savedUser);
        } catch (error) {
          parsedUser = null;
        }
      }
      const role =
        userType ||
        parsedUser?.userType ||
        (parsedUser?.vehicle ? 'driver' : 'passenger');
      const userId = currentUserId || parsedUser?.userId;
      const storageKey = getHistoryStorageKey(role, userId);
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(normalizedHistory));
      }
    });

    socket.on('RIDE_HISTORY_UPDATED', () => {
      refreshRideHistory();
    });

    return () => {
      socket.off('REQUEST_ACKNOWLEDGED');
      socket.off('RIDE_ACCEPTED');
      socket.off('RIDE_COMPLETED');
      socket.off('PENDING_REQUESTS');
      socket.off('NEW_RIDE_REQUEST');
      socket.off('REQUEST_TAKEN');
      socket.off('RIDE_ACCEPTED_CONFIRMATION');
      socket.off('RIDE_HISTORY');
      socket.off('RIDE_HISTORY_UPDATED');
    };
  }, [socket, refreshRideHistory, currentUserId, rideState.pickupStopId, rideState.destinationStopId, rideState.timestamp, upsertLocalRideHistory, userType, getHistoryStorageKey]);

  const value = {
    socket,
    userType,
    stops,
    rideState,
    setRideState,
    notification,
    showNotification,
    pendingRequests,
    rideHistory,
    // Passenger methods
    joinAsPassenger,
    requestRide,
    cancelRide,
    resetRideState,
    // Driver methods
    joinAsDriver,
    acceptRide,
    completeRide,
    refreshRideHistory,
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
