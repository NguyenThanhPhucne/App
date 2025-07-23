const express = require('express');
  const cors = require('cors');
  const connectDB = require('./db');
  const tasksRouter = require('./routes/tasks');
  const requestLogger = require('./middleware/logger');
  require('dotenv').config();

  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Connect to MongoDB
  connectDB();

  // Routes
  app.use('/api/tasks', tasksRouter);

  // Error Handling Middleware
  const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: `Validation error: ${err.message}` });
    }
    if (err.name === 'MongoServerError' && err.code === 11000) {
      return res.status(400).json({ error: 'Duplicate task_id error' });
    }
    if (err.name === 'MongoServerError') {
      return res.status(500).json({ error: `Database error: ${err.message}` });
    }
    res.status(500).json({ error: 'Internal server error' });
  };
  app.use(errorHandler);

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));