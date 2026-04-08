# Campus Virtual Bus - Full Stack Application

A real-time campus ride-sharing platform with separate frontend and backend, built with React, Vite, Node.js, Express, and Socket.io.

## Project Structure

```
SE Project/
├── server/                 # Backend server
│   ├── src/
│   │   ├── index.js       # Main server entry point
│   │   ├── socket.js      # Socket.io event handlers
│   │   ├── config/
│   │   │   └── stops.json # Campus stops registry
│   │   └── utils/
│   │       └── stopsLoader.js
│   ├── package.json
│   └── .env
│
└── client/                 # Frontend application
    ├── src/
    │   ├── main.jsx       # React entry point
    │   ├── App.jsx        # Main app component
    │   ├── context/
    │   │   └── RideContext.jsx # Global ride state management
    │   ├── pages/
    │   │   ├── PassengerView.jsx
    │   │   └── DriverView.jsx
    │   ├── components/
    │   │   ├── UserSelector.jsx
    │   │   └── UserSelector.css
    │   ├── index.css
    │   └── App.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── .env
```

## Tech Stack

### Backend
- **Framework**: Express.js
- **Real-time**: Socket.io
- **Runtime**: Node.js
- **Configuration**: Dotenv

### Frontend
- **Framework**: React 18.2
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io Client

## Installation & Setup

### Prerequisites
- Node.js v16+ and npm

### Step 1: Install Server Dependencies

```bash
cd server
npm install
```

### Step 2: Install Client Dependencies

```bash
cd ../client
npm install
```

## Running the Application

### Terminal 1: Start the Server (Port 3001)

```bash
cd server
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

**Expected Output:**
```
╔════════════════════════════════════════════╗
║   Campus Virtual Bus Server Started        ║
║   Port: 3001                               ║
║   Socket.io Ready for connections          ║
╚════════════════════════════════════════════╝
Health check: http://localhost:3001/health
Socket.io listening on http://localhost:3001
```

### Terminal 2: Start the Client (Port 5173)

```bash
cd client
npm run dev
```

**Expected Output:**
```
  Local:   http://localhost:5173/
```

### Step 3: Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

## Features

### Passenger Features
- 👤 **Role Selection**: Choose between Passenger and Driver roles
- 📍 **Stop Selection**: Select pickup and destination stops from a dropdown
- 📤 **Broadcast Request**: Send ride requests to all available drivers
- 📊 **Real-time Status**: Track request status (IDLE → REQUESTING → MATCHED → COMPLETED)
- ✅ **Ride Confirmation**: Receive notifications when driver accepts

### Driver Features
- 🚗 **Live Feed**: View all incoming ride requests in real-time
- ✅ **Accept Rides**: Accept requests with one click
- 🚐 **Vehicle Management**: Track available seats (decrements when accepting a ride)
- 📍 **Stop Details**: See pickup and destination stop information with landmarks
- ✔️ **Complete Rides**: Mark rides as completed with confirmation

### Real-time Features
- 🔄 Instant notifications for request acceptance/completion
- 📡 Live feed updates for drivers
- 🎯 Automatic room management (drivers room, passengers room)
- 💾 In-memory request tracking with unique request IDs

## API Endpoints

### REST Endpoints

```
GET /health
Returns server status and current timestamp

GET /api/requests
Returns all active ride requests with count
```

## Socket.io Events

### Passenger Events

```javascript
// Join as passenger
socket.emit('JOIN_PASSENGER', { passengerId })

// Request a ride
socket.emit('REQUEST_RIDE', {
  passengerId,
  pickupStopId,
  destinationStopId
})

// Listen for acceptance
socket.on('RIDE_ACCEPTED', (data) => {
  // data: { requestId, driverId, message }
})

// Listen for completion
socket.on('RIDE_COMPLETED', (data) => {
  // data: { requestId, message }
})
```

### Driver Events

```javascript
// Join as driver
socket.emit('JOIN_DRIVER', {
  driverId,
  seatsAvailable: 5
})

// Accept a ride
socket.emit('ACCEPT_RIDE', {
  requestId,
  driverId,
  seatsAvailable
})

// Complete a ride
socket.emit('COMPLETE_RIDE', {
  requestId,
  driverId
})

// Listen for new requests
socket.on('NEW_RIDE_REQUEST', (request) => {
  // request: { requestId, passengerId, pickupStopId, destinationStopId, timestamp, status }
})

// Listen for taken requests
socket.on('REQUEST_TAKEN', (data) => {
  // data: { requestId }
})
```

## Stop Registry

The application includes 31 predefined stops at **IIT ISM Dhanbad** campus:

1. **S001** - Main Gate (Primary entrance)
2. **S002** - Rosaline Hostel (Girl's residential)
3. **S003** - Ruby Hostel (Girl's residential)
4. **S004** - Ruby Mart (Shopping & provisions)
5. **S005** - Central Library (Sardar Patel Library, academic hub)
6. **S006** - CDC (Career Development Center)
7. **S007** - RD (Residential Development)
8. **S008** - NLHC (New Ladies Hostel Complex)
9. **S009** - Jasper Hostel (Boy's residential)
10. **S010** - Amber Hostel (Boy's residential)
11. **S011** - Aquamarine Hostel (Boy's residential)
12. **S012** - Sapphire Hostel (Boy's residential)
13. **S013** - Diamond Hostel (Boy's residential)
14. **S014** - Petroleum Department (Academic)
15. **S015** - OAT (Outdoor Activities Ground)
16. **S016** - Penmen Auditorium (Main auditorium)
17. **S017** - GJLT (Conference Hall)
18. **S018** - Upper Ground (Common area)
19. **S019** - Lower Ground (Basement facility)
20. **S020** - CSE Department (Computer Science)
21. **S021** - Heritage Building (Administrative)
22. **S022** - AGP Department (Applied Geology & Petroleum)
23. **S023** - NAC (New Academic Complex)
24. **S024** - Temple (Religious place)
25. **S025** - Health Centre (Medical facility)
26. **S026** - Science Block (Science departments)
27. **S027** - Environmental Engineering Department
28. **S028** - Mechanical Engineering Department
29. **S029** - NVCTI (National Virtual Campus Training Institute)
30. **S030** - I2H (Innovation to Incubation Hub)
31. **S031** - IRH (Indian Resource Hub)

Each stop has specific landmarks and descriptions for easy identification across IIT ISM Dhanbad campus.

## Global State Management with RideContext

The `RideContext` provides:

```javascript
const {
  socket,           // Socket.io instance
  userType,         // 'passenger' or 'driver'
  stops,            // Array of campus stops
  rideState,        // Current ride state object
  notification,     // Current notification
  pendingRequests,  // Array of pending ride requests
  
  // Passenger methods
  joinAsPassenger,
  requestRide,
  cancelRide,
  
  // Driver methods
  joinAsDriver,
  acceptRide,
  completeRide,
  
  // Utility methods
  showNotification,
} = useRide();
```

## Request State Flow

### Passenger Flow
```
IDLE → REQUESTING (after broadcasting) → MATCHED (when driver accepts) → COMPLETED
```

### Request Structure
```javascript
{
  responseId: "REQ_1234567890_1",
  passengerId: "passenger_abc123",
  pickupStopId: "S001",
  destinationStopId: "S005",
  timestamp: 1234567890,
  status: "PENDING",      // PENDING, ACCEPTED, COMPLETED
  driverId: "driver_xyz", // Added when accepted
  acceptedAt: 1234567900   // Added when accepted
}
```

## Troubleshooting

### Connection Issues
- Ensure both server and client are running
- Check that ports 3001 (server) and 5173 (client) are not in use
- Verify `VITE_SERVER_URL` in `client/.env` matches your server URL

### Socket Connection Failed
- Check server logs for actual port and URL being used
- Ensure CORS is properly configured (check `.env` files)
- Try clearing browser cache and reconnecting

### Stops Not Loading
- Verify `server/src/config/stops.json` exists and is valid JSON
- Check server logs for file loading errors

## Environment Variables

### Server (.env)
```
PORT=3001
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Client (.env)
```
VITE_SERVER_URL=http://localhost:3001
```

## Development Notes

- The application uses in-memory storage for ride requests (not persisted)
- Requests are automatically removed 5 seconds after completion
- Each new server restart clears all active requests
- For production, replace in-memory storage with Firebase Admin SDK or a database

## Future Enhancements

1. **Database Integration**: Replace in-memory storage with MongoDB/Firebase
2. **Authentication**: Add JWT-based user authentication
3. **Real GPS**: Implement actual location tracking instead of stops
4. **Payment Gateway**: Add Stripe/PayPal integration
5. **Rating System**: Add driver and passenger ratings
6. **History**: Store ride history and user statistics
7. **Admin Dashboard**: Monitor all active rides and user statistics
8. **Mobile App**: React Native version for mobile deployment

## License

ISC

## Author

Campus Virtual Bus Development Team
#   S E - P r o j e c t  
 