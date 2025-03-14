# AI Agent Builder

This project is an AI-powered sales agent built using Node.js, Express, SQLite, and OpenAI. The agent can collect user information, handle conversational queries, send follow-up messages, save additional user information, and retrieve conversation history.

## Prerequisites

- Node.js
- npm (Node Package Manager)
- SQLite

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
```

2. Navigate to the project directory:

```bash
cd /d:/Student/Assignment/ai-agent-builder
```

3. Install the dependencies:

```bash
npm install
```

4. Create a `.env` file in the root directory and add your OpenAI API key:

```env
OPEN_API_KEY=your_openai_api_key
```

## Database Setup

1. Create the SQLite database:

```bash
sqlite3 saleAgent.db
```

2. Create the `users` and `conversations` tables:

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  product TEXT
);

CREATE TABLE conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## Running the Server

Start the server:
