import { useState, useEffect } from 'react';
import { RideProvider } from './context/RideContext';
import { UserSelector } from './components/UserSelector';
import { PassengerView } from './pages/PassengerView';
import { DriverView } from './pages/DriverView';
import './App.css';

function App() {
  const [userData, setUserData] = useState(null);

  // Check for existing user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('campusBusUser');
    if (savedUser) {
      try {
        setUserData(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('campusBusUser');
      }
    }
  }, []);

  const handleRoleSelect = (data) => {
    setUserData(data);
  };

  const handleLogout = () => {
    setUserData(null);
    localStorage.removeItem('campusBusUser');
  };

  return (
    <RideProvider>
      <div className="App">
        {!userData ? (
          <UserSelector onSelectRole={handleRoleSelect} />
        ) : userData.userType === 'passenger' ? (
          <div>
            <PassengerView userData={userData} />
            <button
              onClick={handleLogout}
              className="fixed top-4 right-4 bg-white/90 backdrop-blur-md text-red-700 border border-red-100 px-4 py-2 rounded-full text-sm font-semibold shadow-md hover:shadow-lg hover:bg-white transition-all z-40"
            >
              Logout
            </button>
          </div>
        ) : (
          <div>
            <DriverView userData={userData} />
            <button
              onClick={handleLogout}
              className="fixed top-4 right-4 bg-white/90 backdrop-blur-md text-red-700 border border-red-100 px-4 py-2 rounded-full text-sm font-semibold shadow-md hover:shadow-lg hover:bg-white transition-all z-40"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </RideProvider>
  );
}

export default App;
