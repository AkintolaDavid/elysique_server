const { Pool } = require("pg");
require("dotenv").config();
const pgUri = process.env.POSTGRES_URI;

const pool = new Pool({
  connectionString: pgUri,
});

// Example usage of the pool to query the database
pool.connect((err, client, release) => {
  if (err) {
    return console.error("Error acquiring client", err.stack);
  }
  client.query("SELECT NOW()", (err, result) => {
    release();
    if (err) {
      return console.error("Error executing query", err.stack);
    }
    console.log(result.rows);
  });
});
module.exports = pool;
