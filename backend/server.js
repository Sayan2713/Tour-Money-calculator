const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Loads MONGODB_URI from the .env file
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;

// --- Middleware ---
app.use(cors());

// 🔧 FIX: Increase payload size limit to 50MB to allow image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// --- Basic Test Route (Doesn't use DB) ---
app.get('/', (req, res) => {
  res.json({ message: "Hello from the TripSplit backend!" });
});

// --- Start Server Function ---
const startServer = async () => {
  try {
    // 1. Wait for the database connection
    await mongoose.connect(uri);
    
    console.log("MongoDB database connection established successfully!");

    // 2. Import and use routes *ONLY AFTER* the connection is open
    const tripsRouter = require('./routes/trips');
    const participantsRouter = require('./routes/participants');
    const expensesRouter = require('./routes/expenses');
    const authRouter = require('./routes/auth');
    const invitationsRouter = require('./routes/invitations');
    const usersRouter = require('./routes/users');

    app.use('/invitations', invitationsRouter);
    app.use('/auth', authRouter);
    app.use('/trips', tripsRouter);
    app.use('/participants', participantsRouter);
    app.use('/expenses', expensesRouter);
    app.use('/users', usersRouter);

    // 3. Now, start the Express server
    app.listen(PORT, () => {
      console.log(`Backend server is running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("Could not connect to MongoDB:", err);
    process.exit(1);
  }
};

startServer();