// Import required packages
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// This line loads the variables from our .env file (like MONGODB_URI)
require('dotenv').config();

// Create the Express app
const app = express();
const PORT = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;

// --- Middleware ---
// Set up middleware *before* routes
app.use(cors());
app.use(express.json());


// --- Basic Test Route ---
// This route doesn't use the DB, so it can be defined here
app.get('/', (req, res) => {
  res.json({ message: "Hello from the TripSplit backend!" });
});

// --- Start Server Function ---
// We create an async function to start the server
const startServer = async () => {
  try {
    // 1. Wait for the database connection
    // The code will *stop* here until the connection is successful
    await mongoose.connect(uri);
    
    console.log("MongoDB database connection established successfully!");

    // 2. THIS IS THE FIX:
    //    Import and use routes *ONLY AFTER* the connection is open.
    //    This prevents the "model before connection" error.
    const tripsRouter = require('./routes/trips');
    const participantsRouter = require('./routes/participants');
    const expensesRouter = require('./routes/expenses');

    app.use('/trips', tripsRouter);
    app.use('/participants', participantsRouter);
    app.use('/expenses', expensesRouter);

    // 3. Now, and only now, start the server
    app.listen(PORT, () => {
      console.log(`Backend server is running on http://localhost:${PORT}`);
    });

  } catch (err) {
    // If the database connection fails, log the error and stop the app
    console.error("Could not connect to MongoDB:", err);
    process.exit(1);
  }
};

// --- Run the Server ---
// We call our new function to start everything.
startServer();