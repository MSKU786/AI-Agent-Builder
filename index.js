const express = require('express');
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');

const app = express();
app.use(bodyParser.json());

const db = new sqlite3.Database('./saleAgent.db');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPEN_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
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

      // Format conversation history for OpenAI
      const conversationHistory = rows.map((row) => ({
        role: row.role,
        content: row.message,
      }));

      // Add system-level instructions
      const systemInstruction =
        'You are a dumb AI smart phone sales agent. Provide simple and straightforward responses. It might ask some question on smart phone like iphone samsung.';
      conversationHistory.push({ role: 'system', content: systemInstruction });

      // Add the new user message to the history
      conversationHistory.push({ role: 'user', content: message });

      // Add the new user message to the history
      conversationHistory.push({ role: 'user', content: message });

      // Generate a response using OpenAI
      const response = await openai.chat.completions.create({
        model: 'nvidia/llama-3.1-nemotron-70b-instruct', // Use GPT-3.5 or GPT-4
        messages: conversationHistory,
        temperature: 0.5,
        top_p: 1,
        max_tokens: 1024,
      });

      console.log(response);
      const assistantResponse = response.choices[0].message.content;

      // Save the user message and assistant response to the database
      const insertUserMessage = `INSERT INTO conversations (user_id, role, message) VALUES (?, ?, ?)`;
      const insertAssistantMessage = `INSERT INTO conversations (user_id, role, message) VALUES (?, ?, ?)`;

      db.serialize(() => {
        db.run(insertUserMessage, [userId, 'user', message]);
        db.run(insertAssistantMessage, [
          userId,
          'assistant',
          assistantResponse,
        ]);
      });

      // Return the assistant's response
      res.json({ status: 'success', response: assistantResponse });
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

// Endpoint to retrieve conversation history
app.get('/conversation/:userId', (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res
      .status(400)
      .json({ status: 'error', message: 'User ID is required' });
  }

  const query = `SELECT role, message, timestamp FROM conversations WHERE user_id = ? ORDER BY timestamp ASC`;
  db.all(query, [userId], (err, rows) => {
    if (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }

    // Format the conversation history
    const conversationHistory = rows.map((row) => ({
      role: row.role,
      message: row.message,
      timestamp: row.timestamp,
    }));

    res.json({ status: 'success', conversation: conversationHistory });
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
