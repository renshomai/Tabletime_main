const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const QRCode = require('qrcode');
const { randomUUID } = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const db = new sqlite3.Database('./db.sqlite');
const SECRET_KEY = 'tabletime_secret'; // for JWT

app.use(cors());
app.use(express.json());

// Create users table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create queue table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    party_size INTEGER NOT NULL,
    ticket_id TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ✅ Registration endpoint
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, hash],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: 'Email already registered.' });
          }
          console.error('DB Error:', err);
          return res.status(500).json({ error: 'Failed to register user.' });
        }

        const user = { id: this.lastID, name, email, role: 'customer' };
        const token = jwt.sign(user, SECRET_KEY);
        res.json({ token, user });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// ✅ Login endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, SECRET_KEY);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  });
});

// ✅ Join Queue endpoint
app.post('/api/join-queue', async (req, res) => {
  const { name, phone, partySize } = req.body;

  if (!name || !phone || !partySize) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const ticketId = randomUUID();
    const qrCodeUrl = await QRCode.toDataURL(ticketId);

    db.run(
      'INSERT INTO queue (name, phone, party_size, ticket_id) VALUES (?, ?, ?, ?)',
      [name, phone, partySize, ticketId],
      function (err) {
        if (err) {
          console.error('DB Insert Error:', err);
          return res.status(500).json({ error: 'Failed to save queue entry.' });
        }

        res.json({
          message: 'Joined queue successfully!',
          ticketId,
          qrCodeUrl,
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generating QR code.' });
  }
});

// ✅ Start backend
app.listen(4000, () => {
  console.log('✅ Backend running on http://localhost:4000');
});
