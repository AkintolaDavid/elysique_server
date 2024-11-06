const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.POSTGRES_URI,
  connectionTimeoutMillis: 5000, // 5 seconds timeout
  idleTimeoutMillis: 30000, // 30 seconds before an idle client is closed
  max: 20, // Maximum number of connections in the pool
});

// Attempt a connection and log any errors
pool
  .connect()
  .then((client) => {
    console.log("Connected to PostgreSQL successfully.");
    client.release();
  })
  .catch((err) => {
    console.error("Error connecting to PostgreSQL:", err);
  });
