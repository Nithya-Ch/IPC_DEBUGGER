const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Simple in-memory storage for simulations
const simulations = new Map();

// API Routes

// GET all simulations
app.get('/api/simulations', (req, res) => {
  const sims = Array.from(simulations.values());
  res.json(sims);
});

// POST save a simulation
app.post('/api/simulations', (req, res) => {
  const { name, processes, channels, logs, issues, timeMs } = req.body;
  const id = `sim-${Date.now()}`;
  const simulation = { id, name, processes, channels, logs, issues, timeMs, createdAt: new Date() };
  simulations.set(id, simulation);
  res.json({ success: true, id, simulation });
});

// GET a specific simulation
app.get('/api/simulations/:id', (req, res) => {
  const sim = simulations.get(req.params.id);
  if (!sim) {
    return res.status(404).json({ error: 'Simulation not found' });
  }
  res.json(sim);
});

// DELETE a simulation
app.delete('/api/simulations/:id', (req, res) => {
  const deleted = simulations.delete(req.params.id);
  res.json({ success: deleted });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Landing page (home)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'landing.html'));
});

// Serve debugger
app.get('/debugger', (req, res) => {
  res.sendFile(path.join(__dirname, 'index1.html'));
});

app.listen(PORT, () => {
  console.log(`IPC Debugger backend running on http://localhost:${PORT}`);
});
