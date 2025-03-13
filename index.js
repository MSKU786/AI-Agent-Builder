const express = require('express');
const sqlLite = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
app.use(bodyParser.json());

// Connect to SQLite
const db = new sqlLite.Database('./database/salesAgent.db');

const port = process.env.PORT || 3000;

// Endpoint to get user information
app.post('/users/collect', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const query = `INSERT INTO users (name, email) VALUES ('${name}', '${email}')`;
  db.run(query, [], (err) => {
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

// Endpoint to answer user question
app.post('/users/:userId/ask', async (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is requried' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: question }],
    });
    res.json({
      status: 'success',
      response: response.choices[0].message.content,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(port, () => {
  console.log('Server listening on port ', port);
});
