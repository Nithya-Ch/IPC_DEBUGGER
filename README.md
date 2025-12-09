# IPC Debugger

A visual simulator and debugger for Inter-Process Communication (IPC) mechanisms including pipes, message queues, and shared memory.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the Application

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. You should see the landing page with options to:
   - **Launch Debugger** - Opens the IPC simulation tool
   - **Learn More** - Shows features
   - **GitHub** - Links to the repository

## Features

### Landing Page (`/`)
- Navigation header with links to Home, Debugger, and GitHub
- Feature cards explaining the tool capabilities
- Call-to-action buttons to launch the debugger

### Debugger (`/debugger`)
A 4-step interactive IPC simulator:

**Step 1: Process Selection**
- Create processes with custom names, roles (Producer/Consumer/Mixed), and intervals
- Define how often each process acts

**Step 2: IPC Channels & Settings**
- Connect processes using:
  - **Pipes** - 1:1 synchronous communication
  - **Message Queues** - 1:1 with buffering
  - **Shared Memory** - Global variable access
- Configure buffer capacities and simulation timing

**Step 3: Simulation**
- Start/Pause/Reset the simulation
- Watch processes change states in real-time
- Save simulation snapshots
- View live process status cards

**Step 4: Debugging**
- Detect and display:
  - **Deadlocks** - Processes blocked too long
  - **Bottlenecks** - Buffer overflows
  - **Race Conditions** - Multiple writers on shared memory
- Complete event log with timestamps

## Project Structure

```
IPC_DEBUGGER/
├── landing.html      # Landing/home page
├── index1.html       # Main debugger interface
├── script.js         # Simulation logic and UI handlers
├── styles.css        # All styling
├── server.js         # Express.js backend
├── package.json      # Dependencies
└── README.md         # This file
```

## API Endpoints

- `GET /` - Landing page
- `GET /debugger` - Debugger interface
- `POST /api/simulations` - Save a simulation
- `GET /api/simulations` - List all simulations
- `GET /api/simulations/:id` - Get specific simulation
- `DELETE /api/simulations/:id` - Delete simulation
- `GET /api/health` - Health check

## How to Use

1. **Create Processes** (Step 1)
   - Click "Add Process"
   - Enter name, select role, set interval
   - Add at least 2 processes for communication

2. **Setup Channels** (Step 2)
   - Click "Add Channel"
   - Select source and destination processes
   - Choose channel type and capacity
   - Configure simulation settings

3. **Run Simulation** (Step 3)
   - Click "Start Simulation"
   - Watch processes interact
   - Click "Save" to snapshot the simulation

4. **Debug Issues** (Step 4)
   - Review detected issues
   - Check event log for details
   - Identify bottlenecks and deadlocks

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Storage**: In-memory (simulations reset on server restart)

## Features Implemented

✅ Process management (create, configure roles)
✅ IPC channel simulation (pipes, queues, shared memory)
✅ Real-time process state tracking
✅ Deadlock detection
✅ Bottleneck detection
✅ Race condition detection
✅ Event logging
✅ Simulation saving
✅ Responsive UI
✅ Navigation between pages
✅ Professional styling with animations

## Future Enhancements

- Persistent storage (database)
- Load saved simulations
- Export logs to CSV
- Advanced visualization graphs
- Multi-process pipes
- Semaphores and mutexes

## License

MIT

## Author

Nithya-Ch
