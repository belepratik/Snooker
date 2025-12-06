const net = require('net');

// Create a TCP server that forwards connections to MySQL
const server = net.createServer((socket) => {
  const client = net.createConnection(3306, 'localhost', () => {
    socket.pipe(client);
    client.pipe(socket);
  });

  client.on('error', (err) => {
    console.error('MySQL connection error:', err);
    socket.destroy();
  });

  socket.on('error', (err) => {
    console.error('Client connection error:', err);
    client.destroy();
  });
});

const PORT = 3306;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`MySQL Proxy listening on 0.0.0.0:${PORT}`);
  console.log(`MySQL is now accessible on port 3306 from anywhere`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
