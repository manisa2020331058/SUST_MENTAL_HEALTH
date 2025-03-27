// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Create Express app
const app = express();



// Middleware
app.use(cors()); 
app.use(express.urlencoded({ extended: true }));

// Remove deprecated warnings
mongoose.set('strictQuery', true);
app.use(express.json()); 

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to SUST Mental Health Portal API',
    status: 'Running',
    endpoints: [
      '/api/admin',
      '/api/students',
      '/api/psychologists',
      '/api/sessions',
      '/api/seminars',
      'api/users'
    ]
  });
});
// Routes
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/psychologists', require('./routes/psychologistRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/seminars', require('./routes/seminarRoutes'));

// Favicon and unknown route handler
app.use((req, res, next) => {
  if (req.path === '/favicon.ico') {
    return res.status(204).end();
  }
  next();
});

// 404 Handler
app.use(notFound);

// Error Middleware
app.use(errorHandler);
app.use(express.urlencoded({ extended: true }));


// Port configuration
const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(
  PORT, 
  console.log(`Server running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`)
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});