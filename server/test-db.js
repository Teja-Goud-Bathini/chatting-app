const { Client } = require('pg');

const client = new Client({
  connectionString:
    'postgresql://chatuser:chatpass@localhost:5433/chatapp'
});

client.connect()
  .then(() => {
    console.log('CONNECTED');
    return client.end();
  })
  .catch(console.error);