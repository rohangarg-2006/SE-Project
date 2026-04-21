import React, { useEffect, useState } from 'react';
import { useRide } from '../context/RideContext';

export const DriverView = ({ userData }) => {
  const {
    stops,
    pendingRequests,
    rideState,
    joinAsDriver,
    acceptRide,
    completeRide,
    notification,
  } = useRide();
  const [seatsAvailable, setSeatsAvailable] = useState(userData?.seatsAvailable || 5);
  const [activeRide, setActiveRide] = useState(null);

  useEffect(() => {
    if (userData?.userId) {
      joinAsDriver(userData.userId, seatsAvailable);
    }
  }, [userData?.userId, seatsAvailable, joinAsDriver]);

  const handleAcceptRide = (request) => {
    acceptRide(request.requestId, userData.userId, seatsAvailable);
    setActiveRide(request);
    setSeatsAvailable((prev) => Math.max(0, prev - 1));
  };

  const handleCompleteRide = async () => {
  if (activeRide) {
    try {
      // 🔥 API CALL TO YOUR SERVER (MongoDB)
      const response = await fetch("http://localhost:3001/api/rides/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId: activeRide.requestId,
          passengerId: activeRide.passengerId,
          driverId: userData.userId,
          pickupStopId: activeRide.pickupStopId,
          destinationStopId: activeRide.destinationStopId,
          status: "completed",
          completedAt: new Date(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save ride");
      }

      // ✅ EXISTING LOGIC (UNCHANGED)
      completeRide(activeRide.requestId, userData.userId);
      setActiveRide(null);
      setSeatsAvailable((prev) => prev + 1);

    } catch (error) {
      console.error("Error saving ride:", error);
      alert("Error saving ride to database");
    }
  }
};

  const getStopName = (stopId) => {
    const stop = stops.find((s) => s.stopId === stopId);
    return stop ? stop.name : stopId;
  };

  const getStopLandmarks = (stopId) => {
    const stop = stops.find((s) => s.stopId === stopId);
    return stop ? stop.landmarks : '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🚌 Campus Virtual Bus</h1>
          <p className="text-gray-600">Driver Portal</p>
          <p className="text-sm text-gray-500 mt-2">🚗 {userData?.userName || 'Driver'}</p>
          <p className="text-xs text-gray-400">Vehicle: {userData?.vehicle || 'N/A'}</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Pending Requests */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6">
                <h2 className="text-2xl font-bold text-white">📥 Live Feed</h2>
                <p className="text-orange-100 text-sm mt-1">
                  Pending Requests ({pendingRequests.length})
                </p>
              </div>

              <div className="p-6">
                {activeRide ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                      <p className="text-green-700 font-semibold mb-3">🟢 Active Ride</p>
                      <div className="text-sm text-gray-700 space-y-2 mb-4">
                        <p>
                          <strong>Request ID:</strong> {activeRide.requestId}
                        </p>
                        <p>
                          <strong>Passenger ID:</strong> {activeRide.passengerId}
                        </p>
                        <div className="mt-3 p-3 bg-white rounded border border-green-300">
                          <p className="text-gray-600 mb-2">
                            📍 <strong>Pickup:</strong> {getStopName(activeRide.pickupStopId)}
                          </p>
                          <p className="text-xs text-gray-500 ml-6 mb-3">
                            {getStopLandmarks(activeRide.pickupStopId)}
                          </p>
                          <p className="text-gray-600 mb-2">
                            🎯 <strong>Destination:</strong>{' '}
                            {getStopName(activeRide.destinationStopId)}
                          </p>
                          <p className="text-xs text-gray-500 ml-6">
                            {getStopLandmarks(activeRide.destinationStopId)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleCompleteRide}
                        className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-all"
                      >
                        ✅ Complete Ride
                      </button>
                    </div>
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No pending requests</p>
                    <p className="text-gray-400 text-sm mt-2">Waiting for passengers...</p>
                  </div>
                ) : (



                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.requestId}
                        className="p-4 border-l-4 border-orange-500 bg-gradient-to-r from-orange-50 to-transparent rounded-lg hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-semibold text-gray-800">
                              Request: {request.requestId}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Passenger: {request.passengerId}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                            PENDING
                          </span>
                        </div>

                        <div className="text-sm text-gray-700 space-y-2 mb-4">
                          <p>
                            📍 <strong>From:</strong> {getStopName(request.pickupStopId)}
                          </p>
                          <p className="text-xs text-gray-500 ml-6">
                            {getStopLandmarks(request.pickupStopId)}
                          </p>
                          <p>
                            🎯 <strong>To:</strong> {getStopName(request.destinationStopId)}
                          </p>
                          <p className="text-xs text-gray-500 ml-6">
                            {getStopLandmarks(request.destinationStopId)}
                          </p>
                        </div>


                        <button
                          onClick={() => handleAcceptRide(request)}
                          disabled={seatsAvailable === 0}
                          className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {seatsAvailable === 0 ? '🚫 No Seats Available' : '✅ Accept Ride'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Vehicle Info */}
          <div className="space-y-6">
            {/* Vehicle Status Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
                <h3 className="text-lg font-bold text-white">🚐 Vehicle Status</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Available Seats</p>
                  <p className="text-4xl font-bold text-blue-600">{seatsAvailable}</p>
                </div>
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className={`flex-1 h-2 rounded ${
                          i < seatsAvailable ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      ></div>
                      <span className="text-xs text-gray-600 w-4">
                        {i < seatsAvailable ? '✓' : '✕'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Pending Requests</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {pendingRequests.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Ride</span>
                  <span className="text-xl font-bold text-green-600">
                    {activeRide ? '🟢 Yes' : '⚫ No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};