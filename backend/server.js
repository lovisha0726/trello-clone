const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mysql = require('mysql2/promise'); 

const boardRoutes = require('./routes/boardRoutes');
const listRoutes = require('./routes/listRoutes');
const cardRoutes = require('./routes/cardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend working',
    data: {}
  });
});

app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    data: {}
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    data: {}
  });
});

// ✅ NEW DB CONNECTION (RAILWAY FIX)
const testConnection = async () => {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('Database connected ✅');
    await connection.end();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    throw err;
  }
};

const startServer = async () => {
  try {
    await testConnection();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (err) {
    console.error('Database connection failed:', err.message);

    // ❗ server crash nahi hona chahiye
    app.listen(PORT, () => {
      console.log(`Server running without DB on port ${PORT}`);
    });
  }
};

if (require.main === module) {
  startServer();
}

module.exports = app;