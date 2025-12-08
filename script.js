class SimProcess {
  constructor(id, name, role, intervalMs) {
    this.id = id;
    this.name = name;
    this.role = role;
    this.intervalMs = intervalMs;
    this.lastActionAt = 0;
    this.state = 'waiting';
    this.blockedSince = null;
  }
}

class IPCChannel {
  constructor(id, type, fromId, toId, capacity) {
    this.id = id;
    this.type = type;
    this.fromId = fromId;
    this.toId = toId;
    this.capacity = capacity || 1;
    this.buffer = [];
    this.sharedValue = null;
    this.lastWriter = null;
  }
}

class Simulation {
  constructor() {
    this.processes = new Map();
    this.channels = new Map();
    this.logs = [];
    this.issues = [];
    this.timeMs = 0;
    this.timer = null;
    this.tickInterval = 500;
    this.blockThreshold = 3000;
  }

  reset() {
    this.processes.clear();
    this.channels.clear();
    this.logs = [];
    this.issues = [];
    this.timeMs = 0;
    this.stop();
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.tickInterval);
  }

  pause() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  stop() {
    this.pause();
  }

  addProcess(proc) {
    this.processes.set(proc.id, proc);
  }

  addChannel(ch) {
    this.channels.set(ch.id, ch);
  }

  log(processId, event, channelId, details) {
    const entry = { time: this.timeMs, processId, event, channelId, details };
    this.logs.push(entry);
    appendLogRow(entry);
  }

  addIssue(type, message) {
    const key = type + '::' + message;
    const exists = this.issues.some(i => i.key === key);
    if (exists) return;
    const issue = { key, type, message, time: this.timeMs };
    this.issues.push(issue);
    renderIssues(this.issues);
  }

  tick() {
    this.timeMs += this.tickInterval;
    updateTimeBadge(this.timeMs);

    for (const proc of this.processes.values()) {
      if (this.timeMs - proc.lastActionAt >= proc.intervalMs) {
        this.performProcessStep(proc);
        proc.lastActionAt = this.timeMs;
      } else {
        if (proc.state !== 'blocked') {
          proc.state = 'waiting';
        }
      }
    }

    for (const proc of this.processes.values()) {
      if (proc.state === 'blocked') {
        if (proc.blockedSince === null) {
          proc.blockedSince = this.timeMs;
        } else {
          const blockedDuration = this.timeMs - proc.blockedSince;
          if (blockedDuration >= this.blockThreshold) {
            this.addIssue(
              'deadlock',
              `Process ${proc.name} has been blocked for ${blockedDuration} ms`
            );
          }
        }
      } else {
        proc.blockedSince = null;
      }
    }

    renderProcessCards(this.processes, this.channels);
  }

  performProcessStep(proc) {
    const outgoing = Array.from(this.channels.values()).filter(
      ch => ch.fromId === proc.id
    );
    const incoming = Array.from(this.channels.values()).filter(
      ch => ch.toId === proc.id
    );

    let didSomething = false;

    const wantsToSend = proc.role === 'producer' || proc.role === 'mixed';
    const wantsToReceive = proc.role === 'consumer' || proc.role === 'mixed';

    if (wantsToSend && outgoing.length > 0) {
      for (const ch of outgoing) {
        const ok = this.trySend(proc, ch);
        if (ok) didSomething = true;
      }
    }

    if (wantsToReceive && incoming.length > 0) {
      for (const ch of incoming) {
        const ok = this.tryReceive(proc, ch);
        if (ok) didSomething = true;
      }
    }

    if (didSomething) {
      proc.state = 'running';
    } else {
      if (proc.state !== 'blocked') {
        proc.state = 'waiting';
      }
    }
  }

  trySend(proc, ch) {
    if (ch.type === 'shared') {
      const value = `v${Math.floor(Math.random() * 100)}`;
      const previousWriter = ch.lastWriter;
      ch.sharedValue = value;
      ch.lastWriter = proc.id;
      this.log(proc.id, 'WRITE_SHARED', ch.id, `val=${value}`);
      if (previousWriter && previousWriter !== proc.id) {
        this.addIssue(
          'race',
          `Potential race: shared memory ${ch.id} written by multiple processes without sync`
        );
      }
      return true;
    } else {
      if (ch.buffer.length >= ch.capacity) {
        proc.state = 'blocked';
        this.log(proc.id, 'BLOCKED_SEND', ch.id, 'Buffer full');
        this.addIssue(
          'bottleneck',
          `Bottleneck on ${ch.type} ${ch.id}: sender ${proc.name} blocked (buffer full)`
        );
        return false;
      } else {
        const msg = {
          id: `m${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          size: 1
        };
        ch.buffer.push(msg);
        this.log(proc.id, 'SEND', ch.id, `msg=${msg.id}`);
        return true;
      }
    }
  }

  tryReceive(proc, ch) {
    if (ch.type === 'shared') {
      if (ch.sharedValue === null) {
        proc.state = 'blocked';
        this.log(proc.id, 'BLOCKED_READ_SHARED', ch.id, 'No value yet');
        return false;
      } else {
        const value = ch.sharedValue;
        this.log(proc.id, 'READ_SHARED', ch.id, `val=${value}`);
        return true;
      }
    } else {
      if (ch.buffer.length === 0) {
        proc.state = 'blocked';
        this.log(proc.id, 'BLOCKED_RECV', ch.id, 'Buffer empty');
        return false;
      } else {
        const msg = ch.buffer.shift();
        this.log(proc.id, 'RECV', ch.id, `msg=${msg.id}`);
        return true;
      }
    }
  }
}

const sim = new Simulation();
let processIdCounter = 1;
let channelIdCounter = 1;

const processListEl = document.getElementById('process-list');
const channelListEl = document.getElementById('channel-list');
const processCardsEl = document.getElementById('process-cards');
const issuesListEl = document.getElementById('issues-list');
const logBodyEl = document.getElementById('log-body');
const processCountEl = document.getElementById('process-count');
const channelFromSelect = document.getElementById('channel-from');
const channelToSelect = document.getElementById('channel-to');
const timeBadgeEl = document.getElementById('time-badge');
const simStateEl = document.getElementById('sim-state');

function renderProcessList() {
  processListEl.innerHTML = '';
  channelFromSelect.innerHTML = '';
  channelToSelect.innerHTML = '';

  for (const proc of sim.processes.values()) {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <span>${proc.name} <span class="tag">${proc.role}</span></span>
      <span class="small">${proc.intervalMs} ms</span>
    `;
    processListEl.appendChild(item);

    const optFrom = document.createElement('option');
    optFrom.value = proc.id;
    optFrom.textContent = `${proc.name} (${proc.role})`;
    channelFromSelect.appendChild(optFrom);

    const optTo = document.createElement('option');
    optTo.value = proc.id;
    optTo.textContent = `${proc.name} (${proc.role})`;
    channelToSelect.appendChild(optTo);
  }

  processCountEl.textContent = `${sim.processes.size} added`;
}

function renderChannelList() {
  channelListEl.innerHTML = '';

  for (const ch of sim.channels.values()) {
    const from = sim.processes.get(ch.fromId);
    const to = sim.processes.get(ch.toId);
    const typeLabel =
      ch.type === 'pipe'
        ? 'Pipe'
        : ch.type === 'queue'
        ? 'Queue'
        : 'Shared Memory';

    const item = document.createElement('div');
    item.className = 'list-item';
    item.innerHTML = `
      <span>${ch.id} <span class="tag">${typeLabel}</span></span>
      <span class="small">
        ${from ? from.name : '?'} → ${to ? to.name : '?'}
        ${ch.type !== 'shared' ? ' · cap=' + ch.capacity : ''}
      </span>
    `;
    channelListEl.appendChild(item);
  }
}

function renderProcessCards(processes, channels) {
  processCardsEl.innerHTML = '';

  for (const proc of processes.values()) {
    const card = document.createElement('div');
    card.className = 'process-card';

    let stateClass = 'state-waiting';
    if (proc.state === 'running') stateClass = 'state-running';
    if (proc.state === 'blocked') stateClass = 'state-blocked';

    const outgoing = Array.from(channels.values()).filter(
      ch => ch.fromId === proc.id
    );
    const incoming = Array.from(channels.values()).filter(
      ch => ch.toId === proc.id
    );

    card.innerHTML = `
      <h4>${proc.name}</h4>
      <div class="process-meta">
        Role: ${proc.role} · Interval: ${proc.intervalMs} ms
      </div>
      <div class="process-meta">
        Outgoing:
        ${
          outgoing.length
            ? outgoing
                .map(
                  ch =>
                    `<span class="channel-chip ${
                      ch.type === 'pipe'
                        ? 'pipe'
                        : ch.type === 'queue'
                        ? 'queue'
                        : 'shared'
                    }">${ch.id}</span>`
                )
                .join('')
            : '<span class="small">none</span>'
        }
      </div>
      <div class="process-meta">
        Incoming:
        ${
          incoming.length
            ? incoming
                .map(
                  ch =>
                    `<span class="channel-chip ${
                      ch.type === 'pipe'
                        ? 'pipe'
                        : ch.type === 'queue'
                        ? 'queue'
                        : 'shared'
                    }">${ch.id}</span>`
                )
                .join('')
            : '<span class="small">none</span>'
        }
      </div>
      <span class="state-pill ${stateClass}">${proc.state}</span>
    `;
    processCardsEl.appendChild(card);
  }
}

function renderIssues(issues) {
  issuesListEl.innerHTML = '';
  if (!issues.length) {
    issuesListEl.innerHTML =
      '<div class="hint">No issues yet. Run the simulation in Step 3 to see potential problems here.</div>';
    return;
  }

  for (const issue of issues) {
    const div = document.createElement('div');
    div.className = 'issue-item';
    const typeLabel =
      issue.type === 'deadlock'
        ? 'Deadlock / Long Block'
        : issue.type === 'bottleneck'
        ? 'Bottleneck'
        : 'Race / Sync';
    div.innerHTML = `
      <span class="issue-tag">${typeLabel}</span>
      <span>${issue.message}</span>
      <div class="small" style="opacity:0.6;">at t = ${issue.time} ms</div>
    `;
    issuesListEl.appendChild(div);
  }
}

function appendLogRow(entry) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${entry.time}</td>
    <td>${getProcessName(entry.processId)}</td>
    <td>${entry.event}</td>
    <td>${entry.channelId || '-'}</td>
    <td>${entry.details || ''}</td>
  `;
  logBodyEl.appendChild(tr);
  logBodyEl.parentElement.scrollTop = logBodyEl.parentElement.scrollHeight;
}

function getProcessName(id) {
  const p = sim.processes.get(id);
  return p ? p.name : '?';
}

function updateTimeBadge(timeMs) {
  timeBadgeEl.textContent = `t = ${timeMs} ms`;
}

function updateSimStateLabel() {
  if (sim.timer) {
    simStateEl.textContent = 'Running';
    simStateEl.style.color = '#16a34a';
  } else if (sim.timeMs > 0) {
    simStateEl.textContent = 'Paused';
    simStateEl.style.color = '#ea580c';
  } else {
    simStateEl.textContent = 'Idle';
    simStateEl.style.color = '#111827';
  }
}

const navButtons = document.querySelectorAll('.nav-item');
const steps = {
  1: document.getElementById('step-1'),
  2: document.getElementById('step-2'),
  3: document.getElementById('step-3'),
  4: document.getElementById('step-4'),
};

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const step = btn.getAttribute('data-step');
    navButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    Object.keys(steps).forEach(k => steps[k].classList.remove('active-step'));
    steps[step].classList.add('active-step');
  });
});

document.getElementById('add-process-btn').addEventListener('click', () => {
  const nameInput = document.getElementById('proc-name');
  const roleSelect = document.getElementById('proc-role');
  const intervalInput = document.getElementById('proc-interval');

  const name = nameInput.value.trim() || `P${processIdCounter}`;
  const role = roleSelect.value;
  const intervalMs = parseInt(intervalInput.value, 10) || 800;

  const proc = new SimProcess(
    `P${processIdCounter++}`,
    name,
    role,
    intervalMs
  );
  sim.addProcess(proc);
  renderProcessList();
  renderProcessCards(sim.processes, sim.channels);

  nameInput.value = '';
});

document.getElementById('add-channel-btn').addEventListener('click', () => {
  const typeSelect = document.getElementById('channel-type');
  const fromSelect = document.getElementById('channel-from');
  const toSelect = document.getElementById('channel-to');
  const capacityInput = document.getElementById('channel-capacity');

  if (sim.processes.size < 2) {
    alert('Add at least two processes before creating channels.');
    return;
  }

  const type = typeSelect.value;
  const fromId = fromSelect.value;
  const toId = toSelect.value;

  if (!fromId || !toId || fromId === toId) {
    alert('Select different "from" and "to" processes.');
    return;
  }

  let capacity = parseInt(capacityInput.value, 10);
  if (type === 'shared') {
    capacity = 1;
  } else if (!capacity || capacity <= 0) {
    capacity = 5;
  }

  const ch = new IPCChannel(
    `C${channelIdCounter++}`,
    type,
    fromId,
    toId,
    capacity
  );
  sim.addChannel(ch);
  renderChannelList();
  renderProcessCards(sim.processes, sim.channels);
});

document.getElementById('start-btn').addEventListener('click', () => {
  if (sim.processes.size === 0) {
    alert('Add at least one process.');
    return;
  }
  sim.tickInterval =
    parseInt(document.getElementById('tick-interval').value, 10) || 500;
  sim.blockThreshold =
    parseInt(document.getElementById('block-threshold').value, 10) || 3000;

  sim.start();
  document.getElementById('pause-btn').disabled = false;
  updateSimStateLabel();
});

document.getElementById('pause-btn').addEventListener('click', () => {
  sim.pause();
  document.getElementById('pause-btn').disabled = true;
  updateSimStateLabel();
});

document.getElementById('reset-btn').addEventListener('click', () => {
  if (!confirm('Reset will clear all processes, channels, logs, and issues. Continue?')) {
    return;
  }
  sim.reset();
  processIdCounter = 1;
  channelIdCounter = 1;
  processListEl.innerHTML = '';
  channelListEl.innerHTML = '';
  processCardsEl.innerHTML = '';
  issuesListEl.innerHTML =
    '<div class="hint">No issues yet. Run the simulation in Step 3 to see potential problems here.</div>';
  logBodyEl.innerHTML = '';
  renderProcessList();
  renderChannelList();
  updateTimeBadge(0);
  updateSimStateLabel();
});

renderProcessList();
renderChannelList();
renderIssues([]);
renderProcessCards(sim.processes, sim.channels);
updateSimStateLabel();
