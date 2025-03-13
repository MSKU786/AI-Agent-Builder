const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const { GPT4All } = require('gpt4all');

const app = express();
app.use(bodyParser.json());

const db = new sqlite3.Database('./saleAgent.db');

// Initialize GPT4All
const gpt4all = new GPT4All();
gpt4all
  .init()
  .then(() => {
    console.log('GPT4All model loaded successfully');
  })
  .catch((err) => {
    console.error('Failed to load GPT4All model:', err);
  });

// Endpoint to collect user information
app.post('/collect', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res
      .status(400)
      .json({ status: 'error', message: 'Name and email are required' });
  }

  const query = `INSERT INTO users (name, email) VALUES (?, ?)`;
  db.run(query, [name, email], function (err) {
    if (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
    res.json({
      status: 'success',
      message: 'Data collected',
      userId: this.lastID,
    });
  });
});

// Endpoint to handle conversational queries
app.post('/query', async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res
      .status(400)
      .json({ status: 'error', message: 'User ID and message are required' });
  }

  try {
    // Fetch conversation history for the user
    const historyQuery = `SELECT role, message FROM conversations WHERE user_id = ? ORDER BY timestamp ASC`;
    db.all(historyQuery, [userId], async (err, rows) => {
      if (err) {
        return res.status(500).json({ status: 'error', message: err.message });
      }

      // Format conversation history for GPT4All
      const conversationHistory = rows
        .map((row) => `${row.role}: ${row.message}`)
        .join('\n');

      // Add the new user message to the history
      const fullPrompt = `${conversationHistory}\nuser: ${message}`;

      // Generate a response using GPT4All
      const response = await gpt4all.prompt(fullPrompt);

      // Save the user message and assistant response to the database
      const insertUserMessage = `INSERT INTO conversations (user_id, role, message) VALUES (?, ?, ?)`;
      const insertAssistantMessage = `INSERT INTO conversations (user_id, role, message) VALUES (?, ?, ?)`;

      db.serialize(() => {
        db.run(insertUserMessage, [userId, 'user', message]);
        db.run(insertAssistantMessage, [userId, 'assistant', response]);
      });

      // Return the assistant's response
      res.json({ status: 'success', response });
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Endpoint to send follow-up messages
app.post('/followup', (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res
      .status(400)
      .json({ status: 'error', message: 'User ID and message are required' });
  }

  const query = `SELECT email FROM users WHERE id = ?`;
  db.get(query, [userId], (err, row) => {
    if (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
    if (!row) {
      return res
        .status(404)
        .json({ status: 'error', message: 'User not found' });
    }

    const email = row.email;
    // Simulate sending an email
    console.log(`Sending follow-up to ${email}: ${message}`);
    res.json({ status: 'success', message: 'Follow-up sent' });
  });
});

// Endpoint to save additional user information
app.post('/save', (req, res) => {
  const { userId, product } = req.body;

  if (!userId || !product) {
    return res
      .status(400)
      .json({ status: 'error', message: 'User ID and product are required' });
  }

  const query = `UPDATE users SET product = ? WHERE id = ?`;
  db.run(query, [product, userId], function (err) {
    if (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
    res.json({ status: 'success', message: 'Data saved' });
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
