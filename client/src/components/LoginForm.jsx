import React, { useState } from 'react';

export const LoginForm = ({ userType, onLoginSuccess, onCancel }) => {
  const [userName, setUserName] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [seats, setSeats] = useState(5);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (userType === 'driver' && !vehicle.trim()) {
      setError('Please enter vehicle name');
      return;
    }

    // Generate persistent user ID based on name and timestamp
    const userId =
      userType === 'driver'
        ? `driver_${userName.replace(/\s+/g, '_')}_${Date.now()}`
        : `passenger_${userName.replace(/\s+/g, '_')}_${Date.now()}`;

    // Store in localStorage
    const userData = {
      userId,
      userName,
      userType,
      ...(userType === 'driver' && { vehicle, seatsAvailable: parseInt(seats) || 5 }),
    };

    localStorage.setItem('campusBusUser', JSON.stringify(userData));

    onLoginSuccess(userData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/95 rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in border border-slate-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">
            {userType === 'driver' ? '🚗' : '👤'}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 capitalize">
            {userType} Login
          </h2>
          <p className="text-gray-500 text-sm mt-1">Enter your details to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                setError('');
              }}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>

          {/* Driver Specific Fields */}
          {userType === 'driver' && (
            <>
              {/* Vehicle Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vehicle Name/Number
                </label>
                <input
                  type="text"
                  value={vehicle}
                  onChange={(e) => {
                    setVehicle(e.target.value);
                    setError('');
                  }}
                  placeholder="e.g., Bus-01, Van-A"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              {/* Seats Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Available Seats
                </label>
                <input
                  type="number"
                  value={seats}
                  onChange={(e) => setSeats(Math.max(1, parseInt(e.target.value)))}
                  min="1"
                  max="50"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-200 text-slate-800 font-semibold py-3 px-4 rounded-xl hover:bg-slate-300 transition-all"
            >
              Back
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-lg transition-all"
            >
              {userType === 'driver' ? 'Start Driving' : 'Request Ride'}
            </button>
          </div>
        </form>

        {/* Info Text */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Your ID will be automatically generated and saved locally
        </p>
      </div>
    </div>
  );
};
