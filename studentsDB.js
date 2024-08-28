const sqlite3 = require("sqlite3").verbose(); // Import SQLite3

// Configure SQLite database connection
const database = new sqlite3.Database("./students.db");

exports.database = database;
