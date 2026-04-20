import React, { useEffect, useState } from 'react';
import { useRide } from '../context/RideContext';

export const PassengerView = ({ userData }) => {
  const {
    stops,
    rideState,
    requestRide,
    cancelRide,
    resetRideState,
    joinAsPassenger,
    notification,
    rideHistory,
    refreshRideHistory,
  } = useRide();
  const [pickupStop, setPickupStop] = useState('');
  const [destinationStop, setDestinationStop] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [activeTab, setActiveTab] = useState('request');

  useEffect(() => {
    if (userData?.userId) {
      joinAsPassenger(userData.userId);
      refreshRideHistory('passenger', userData.userId);
    }
  }, [userData?.userId, joinAsPassenger, refreshRideHistory]);

  const handleRequestRide = () => {
    if (!pickupStop || !destinationStop) {
      alert('Please select both pickup and destination stops');
      return;
    }
    setIsRequesting(true);
    requestRide(userData.userId, pickupStop, destinationStop);
  };

  const handleCancel = () => {
    setPickupStop('');
    setDestinationStop('');
    setIsRequesting(false);
    cancelRide();
  };

  const handleStartNewRide = () => {
    setPickupStop('');
    setDestinationStop('');
    setIsRequesting(false);
    resetRideState();
  };

  const getStopName = (stopId) => {
    const stop = stops.find((s) => s.stopId === stopId);
    return stop ? stop.name : stopId;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleString();
  };

  useEffect(() => {
    if (activeTab !== 'history' || !userData?.userId) return;
    const intervalId = setInterval(() => {
      refreshRideHistory('passenger', userData.userId);
    }, 2500);
    return () => clearInterval(intervalId);
  }, [activeTab, userData?.userId, refreshRideHistory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🚌 Campus Virtual Bus</h1>
          <p className="text-gray-600">Passenger Portal</p>
          <p className="text-sm text-gray-500 mt-2">👤 {userData?.userName || 'Passenger'}</p>
          <p className="text-xs text-gray-400">ID: {userData?.userId}</p>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              notification.type === 'error'
                ? 'bg-red-100 border border-red-400 text-red-700'
                : notification.type === 'success'
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-blue-100 border border-blue-400 text-blue-700'
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-2xl font-bold text-white">Passenger Dashboard</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('request')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'request'
                      ? 'bg-white text-blue-700'
                      : 'bg-blue-500 text-white hover:bg-blue-400'
                  }`}
                >
                  Request Ride
                </button>
                <button
                  onClick={() => {
                    setActiveTab('history');
                    refreshRideHistory('passenger', userData?.userId);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'history'
                      ? 'bg-white text-blue-700'
                      : 'bg-blue-500 text-white hover:bg-blue-400'
                  }`}
                >
                  Your Rides
                </button>
              </div>
            </div>
          </div>

          <div className="p-8">
            {activeTab === 'request' ? (
              <>
                {/* Status Display */}
                <div className="mb-8 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                  <p className="text-sm text-gray-600 mb-1">Current Status</p>
                  <p className="text-xl font-semibold text-gray-800 capitalize">{rideState.status}</p>
                  {rideState.requestId && (
                    <p className="text-xs text-gray-500 mt-2">Request ID: {rideState.requestId}</p>
                  )}
                </div>

                {/* Form */}
                {rideState.status === 'IDLE' || rideState.status === 'REQUESTING' ? (
                  <div className="space-y-6">
                    {/* Pickup Stop */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        📍 Pickup Stop
                      </label>
                      <select
                        value={pickupStop}
                        onChange={(e) => setPickupStop(e.target.value)}
                        disabled={isRequesting}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="">Select a stop</option>
                        {stops.map((stop) => (
                          <option key={stop.stopId} value={stop.stopId}>
                            {stop.name} - {stop.landmarks}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Destination Stop */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        🎯 Destination Stop
                      </label>
                      <select
                        value={destinationStop}
                        onChange={(e) => setDestinationStop(e.target.value)}
                        disabled={isRequesting}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      >
                        <option value="">Select a stop</option>
                        {stops.map((stop) => (
                          <option key={stop.stopId} value={stop.stopId}>
                            {stop.name} - {stop.landmarks}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={handleRequestRide}
                        disabled={isRequesting || !pickupStop || !destinationStop}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRequesting ? 'Finding Drivers...' : '📤 Broadcast Request'}
                      </button>
                      {isRequesting && (
                        <button
                          onClick={handleCancel}
                          className="bg-red-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-600 transition-all"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Match Status */}
                {rideState.status === 'MATCHED' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                      <p className="text-green-700 font-semibold mb-3">✅ Ride Accepted!</p>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p>
                          <strong>Pickup:</strong> {getStopName(rideState.pickupStopId)}
                        </p>
                        <p>
                          <strong>Destination:</strong> {getStopName(rideState.destinationStopId)}
                        </p>
                        <p>
                          <strong>Driver ID:</strong> {rideState.driverId}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleStartNewRide}
                      className="w-full bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-all"
                    >
                      Start New Request
                    </button>
                  </div>
                )}

                {rideState.status === 'COMPLETED' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                      <p className="text-blue-700 font-semibold">🎉 Ride Completed!</p>
                    </div>
                    <button
                      onClick={handleStartNewRide}
                      className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all"
                    >
                      Request Another Ride
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Your Rides</h3>
                  <button
                    onClick={() => refreshRideHistory('passenger', userData?.userId)}
                    className="text-sm bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-all"
                  >
                    Refresh
                  </button>
                </div>
                {rideHistory.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    No rides yet. Your completed and active rides will appear here.
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                    {rideHistory.map((ride) => (
                      <div
                        key={ride.requestId}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-semibold text-gray-800">{ride.requestId}</p>
                          <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                            {ride.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 space-y-1">
                          <p>
                            <strong>Pickup:</strong> {getStopName(ride.pickupStopId)}
                          </p>
                          <p>
                            <strong>Destination:</strong> {getStopName(ride.destinationStopId)}
                          </p>
                          <p>
                            <strong>Driver ID:</strong> {ride.driverId || 'Not assigned yet'}
                          </p>
                          <p>
                            <strong>Requested:</strong> {formatTime(ride.timestamp)}
                          </p>
                          <p>
                            <strong>Accepted:</strong> {formatTime(ride.acceptedAt)}
                          </p>
                          <p>
                            <strong>Completed:</strong> {formatTime(ride.completedAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
