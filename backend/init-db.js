// init-db.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const db = new sqlite3.Database('./db.sqlite');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) return console.error("Create users table error:", err);
    console.log("Users table ready.");

    const adminEmail = 'admin@tabletime.local';
    const adminPassword = 'admin123';

    db.get("SELECT id FROM users WHERE email = ?", [adminEmail], async (err, row) => {
      if (err) return console.error(err);
      if (!row) {
        try {
          const hash = await bcrypt.hash(adminPassword, 10);
          db.run(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            ['Admin', adminEmail, hash, 'manager'],
            function (err) {
              if (err) return console.error("Insert admin error:", err);
              console.log(`Inserted demo admin: ${adminEmail} / ${adminPassword}`);
              db.close(); // ✅ only close once everything’s done
            }
          );
        } catch (e) {
          console.error("Hash error:", e);
          db.close();
        }
      } else {
        console.log("Demo admin already exists.");
        db.close();
      }
    });
  });
});
