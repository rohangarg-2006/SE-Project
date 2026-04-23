import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import './UserSelector.css';

export const UserSelector = ({ onSelectRole }) => {
  const [selected, setSelected] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  const handleSelect = (role) => {
    setSelected(role);
    setShowLogin(true);
  };

  const handleLoginSuccess = (userData) => {
    setShowLogin(false);
    onSelectRole(userData);
  };

  const handleLoginCancel = () => {
    setShowLogin(false);
    setSelected(null);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-sky-700 via-cyan-700 to-emerald-700 flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute -top-28 -left-20 w-80 h-80 bg-white/15 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-28 -right-20 w-80 h-80 bg-amber-200/20 rounded-full blur-3xl"></div>
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold tracking-tight text-white mb-4">🚌 Campus Virtual Bus</h1>
          <p className="text-xl text-cyan-50/95">Choose Your Role</p>
        </div>

        {/* Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Passenger Card */}
          <div
            onClick={() => handleSelect('passenger')}
            className={`cursor-pointer transform transition-all duration-300 ${
              selected === 'passenger' ? 'scale-105' : 'hover:scale-102'
            }`}
          >
            <div
              className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 border border-white/60 ${
                selected === 'passenger'
                  ? 'ring-4 ring-blue-500 shadow-blue-500/50'
                  : 'hover:shadow-blue-900/30'
              }`}
            >
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-12 text-center">
                <div className="text-6xl mb-4">👤</div>
                <h2 className="text-3xl font-bold text-white mb-2">Passenger</h2>
                <p className="text-blue-100">Request a ride to your destination</p>
              </div>
              <div className="p-8">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center gap-3">
                    <span className="text-blue-500 text-xl">✓</span>
                    Select pickup & drop stops
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-blue-500 text-xl">✓</span>
                    Broadcast ride requests
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-blue-500 text-xl">✓</span>
                    Real-time status updates
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-blue-500 text-xl">✓</span>
                    Track driver information
                  </li>
                </ul>
                <button
                  onClick={() => handleSelect('passenger')}
                  className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  {selected === 'passenger' ? '✓ Logging in...' : 'Continue as Passenger'}
                </button>
              </div>
            </div>
          </div>

          {/* Driver Card */}
          <div
            onClick={() => handleSelect('driver')}
            className={`cursor-pointer transform transition-all duration-300 ${
              selected === 'driver' ? 'scale-105' : 'hover:scale-102'
            }`}
          >
            <div
              className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 border border-white/60 ${
                selected === 'driver'
                  ? 'ring-4 ring-orange-500 shadow-orange-500/50'
                  : 'hover:shadow-orange-900/30'
              }`}
            >
              <div className="bg-gradient-to-br from-orange-500 to-red-600 p-12 text-center">
                <div className="text-6xl mb-4">🚗</div>
                <h2 className="text-3xl font-bold text-white mb-2">Driver</h2>
                <p className="text-orange-100">Accept and complete ride requests</p>
              </div>
              <div className="p-8">
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-center gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    View pending requests
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    Accept ride requests
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    Track seat availability
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="text-orange-500 text-xl">✓</span>
                    Complete rides easily
                  </li>
                </ul>
                <button
                  onClick={() => handleSelect('driver')}
                  className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-3 px-6 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  {selected === 'driver' ? '✓ Logging in...' : 'Continue as Driver'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-cyan-50/90 text-sm">
            Real-time campus transportation at your fingertips
          </p>
        </div>
      </div>

      {/* Login Form Modal */}
      {showLogin && (
        <LoginForm
          userType={selected}
          onLoginSuccess={handleLoginSuccess}
          onCancel={handleLoginCancel}
        />
      )}
    </div>
  );
};
