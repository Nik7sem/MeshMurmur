// Assuming you have these elements in your HTML
const peerListDiv = document.getElementById('peer-list') as HTMLDivElement;
const logsDiv = document.getElementById('logs') as HTMLDivElement;

/**
 * Updates the peer list with an array of strings
 * @param peers Array of peer names/identifiers
 */
export function updatePeerList(peers: Set<string>): void {
  if (!peerListDiv) {
    console.error('Peer list div not found');
    return;
  }

  // Clear existing content
  peerListDiv.innerHTML = '';

  if (peers.size === 0) {
    peerListDiv.textContent = 'No peers connected';
    return;
  }

  // Create a list of peers
  const list = document.createElement('ul');
  peers.forEach(peer => {
    const listItem = document.createElement('li');
    listItem.textContent = peer;
    list.appendChild(listItem);
  });

  peerListDiv.appendChild(list);
}

/**
 * Adds a new log line to the logs div
 * @param message The log message to add
 * @param timestamp Whether to include a timestamp (default: true)
 */
export function addLogLine(message: string, timestamp: boolean = true): void {
  if (!logsDiv) {
    console.error('Logs div not found');
    return;
  }

  const logLine = document.createElement('div');
  logLine.className = 'log-line';

  if (timestamp) {
    const time = new Date().toLocaleTimeString();
    logLine.textContent = `[${time}] ${message}`;
  } else {
    logLine.textContent = message;
  }

  logsDiv.appendChild(logLine);

  // Auto-scroll to bottom to show latest log
  logsDiv.scrollTop = logsDiv.scrollHeight;
}

// Optional: Function to clear all logs
function clearLogs(): void {
  if (logsDiv) {
    logsDiv.innerHTML = '';
  }
}