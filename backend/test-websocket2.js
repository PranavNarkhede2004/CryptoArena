import WebSocket from 'ws';

// Test the new WebSocket endpoint format
const streams = ['btcusdt@ticker', 'ethusdt@ticker'].join('/');
const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
console.log('Testing WebSocket URL:', wsUrl);

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('WebSocket connected successfully');
});

ws.on('message', (data) => {
  try {
    const parsed = JSON.parse(data.toString());
    console.log('Received data:', JSON.stringify(parsed, null, 2));
    
    // Show ticker info
    if (parsed.data) {
      console.log(`${parsed.data.s}: $${parsed.data.c} (${parsed.data.P}%)`);
    }
    
    // Close after receiving a few messages
    setTimeout(() => ws.close(), 5000);
  } catch (error) {
    console.error('Parse error:', error.message);
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error.message);
});

ws.on('close', () => {
  console.log('WebSocket connection closed');
});

// Timeout after 15 seconds
setTimeout(() => {
  if (ws.readyState === WebSocket.OPEN) {
    console.log('Test timeout - closing connection');
    ws.close();
  }
}, 15000);
