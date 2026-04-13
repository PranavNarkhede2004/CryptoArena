import WebSocket from 'ws';

// Test the Binance WebSocket connection directly
const ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');

ws.on('open', () => {
  console.log('WebSocket connected successfully');
});

ws.on('message', (data) => {
  try {
    const parsed = JSON.parse(data.toString());
    console.log(`Received ${parsed.length} tickers`);
    
    // Show first few tickers as sample
    const sample = parsed.slice(0, 3);
    sample.forEach(ticker => {
      console.log(`${ticker.s}: $${ticker.c} (${ticker.P}%)`);
    });
    
    // Close after receiving first message
    ws.close();
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

// Timeout after 10 seconds
setTimeout(() => {
  if (ws.readyState === WebSocket.OPEN) {
    console.log('Test timeout - closing connection');
    ws.close();
  }
}, 10000);
