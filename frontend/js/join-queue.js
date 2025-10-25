// ✅ Join Queue Endpoint
const QRCode = require('qrcode');
const { randomUUID } = require('crypto');

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

app.post('/api/join-queue', async (req, res) => {
  const { name, phone, partySize } = req.body;

  if (!name || !phone || !partySize) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const ticketId = randomUUID();

    // Generate QR Code as data URL
    const qrCodeUrl = await QRCode.toDataURL(ticketId);

    // Store in DB
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
