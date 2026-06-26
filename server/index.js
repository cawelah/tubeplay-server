const http = require('http');

console.log('=== SERVER STARTING ===');

const PORT = process.env.PORT || 5000;
console.log(`PORT=${PORT}`);

const server = http.createServer((req, res) => {
  console.log(`REQUEST: ${req.method} ${req.url}`);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', port: PORT }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`LISTENING on 0.0.0.0:${PORT}`);
  // Keep alive heartbeat
  setInterval(() => {
    console.log('HEARTBEAT: alive');
  }, 10000);
});

server.on('error', (err) => {
  console.log('SERVER ERROR:', err.message);
});
