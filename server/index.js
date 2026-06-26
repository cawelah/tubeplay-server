const http = require('http');

console.log('=== ENV DUMP ===');
Object.keys(process.env).sort().forEach(k => {
  if (k === 'MONGODB_URI' || k === 'JWT_SECRET') return;
  console.log(`${k}=${process.env[k]}`);
});
console.log('=== END ENV DUMP ===');

const PORT = process.env.PORT || 5000;
console.log(`Using PORT: ${PORT}`);

try {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', port: PORT }));
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`LISTENING on 0.0.0.0:${PORT}`);
  });

  server.on('error', (err) => {
    console.log('SERVER ERROR:', err.message);
    process.exit(1);
  });
} catch (err) {
  console.log('CATASTROPHIC ERROR:', err.message, err.stack);
  process.exit(1);
}
