# Quick Start Guide

## ⚡ Get Running in 2 Minutes

### Step 1: Install Dependencies
Open PowerShell in the project folder and run:
```powershell
npm install
```

### Step 2: Start the Server
```powershell
npm start
```

You should see:
```
IPC Debugger backend running on http://localhost:3000
```

### Step 3: Open in Browser
Navigate to: **http://localhost:3000**

---

## 🎯 Using the Debugger

### Landing Page (Home)
- Click **"Launch Debugger"** to go to the simulation tool
- Click **"Learn More"** to see features
- Use navigation links to jump between pages

### Step 1: Create Processes
1. Enter a process name (e.g., "Producer1")
2. Select a role:
   - **Producer** (sends messages)
   - **Consumer** (receives messages)
   - **Mixed** (both send and receive)
3. Set the action interval (in milliseconds)
4. Click **"+ Add Process"**
5. Repeat to add at least 2 processes

### Step 2: Create Channels
1. Click on **Step 2** in the sidebar
2. Select the channel type:
   - **Pipe**: 1-to-1 synchronous
   - **Message Queue**: 1-to-1 with buffer
   - **Shared Memory**: Global variable
3. Select "From" and "To" processes
4. Set capacity (for pipes/queues)
5. Click **"+ Add Channel"**
6. Configure simulation settings
7. Click **"Step 3"** to continue

### Step 3: Run Simulation
1. Click **"▶ Start Simulation"** to begin
2. Watch the process cards update in real-time
3. See colors change:
   - 🟢 Running (active)
   - 🟡 Waiting (idle)
   - 🔴 Blocked (waiting for I/O)
4. Click **"💾 Save"** to save the simulation state
5. Click **"Step 4"** to see issues detected

### Step 4: Debug Issues
- View detected issues:
  - **Deadlock/Long Block**: Process blocked too long
  - **Bottleneck**: Buffer full, sender blocked
  - **Race/Sync**: Multiple writers on shared memory
- Check the **Event Log** for detailed timestamps
- Every send, receive, and block event is logged

---

## ❌ Troubleshooting

### "Cannot find module 'express'"
Run: `npm install`

### Server won't start
- Check if port 3000 is already in use
- Try: `npm start` again
- Check console for error messages

### Buttons not working
- Open browser DevTools (F12)
- Check Console tab for errors
- Refresh the page (Ctrl+R)
- Verify server is running

### Pages not loading
- Check that you're at `http://localhost:3000`
- Verify server is running (should see "IPC Debugger backend running")
- Try hard refresh (Ctrl+Shift+R)

### No processes appearing
- Make sure you added at least one process in Step 1
- Click **"+ Add Process"** button
- Refresh page if needed

### Simulation not starting
- Add at least 1 process (required)
- Click **"▶ Start Simulation"** button
- Check if error appears in browser console

---

## 📊 Console Debugging

Open DevTools (F12 → Console) to see:
- ✅ "IPC Debugger script loaded successfully" - Script initialized
- ✅ Process creation logs
- ✅ Channel creation logs
- ✅ Simulation start/stop events

---

## 🔧 File Structure

```
IPC_DEBUGGER/
├── server.js          ← Express backend (start this)
├── landing.html       ← Home page
├── index1.html        ← Debugger interface
├── script.js          ← Simulation logic
├── styles.css         ← All styling
├── package.json       ← Dependencies
├── README.md          ← Full documentation
└── QUICK_START.md     ← This file
```

---

## ✨ Features Working

✅ Navigation between pages
✅ Process creation and management
✅ Channel creation (pipes, queues, shared memory)
✅ Real-time simulation
✅ Process state visualization
✅ Deadlock detection
✅ Bottleneck detection
✅ Race condition detection
✅ Event logging
✅ Simulation saving to backend
✅ Pause/Resume simulation
✅ Reset simulation

---

## 🚀 Next Steps

After exploring the basic functionality:
1. Create multiple producer/consumer pairs
2. Connect them with different channel types
3. Observe how different IPC mechanisms behave
4. Try to cause deadlocks and bottlenecks intentionally
5. Analyze the event logs to understand timing
6. Save different simulation scenarios

Enjoy debugging IPC! 🎯
