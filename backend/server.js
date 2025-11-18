const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Loads MONGODB_URI, EMAIL_USER, EMAIL_PASS, JWT_SECRET from .env (Render env)
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;

// -----------------------------------------------------
// ⭐ CORRECT CORS FIX FOR RENDER FRONTEND + BACKEND
// -----------------------------------------------------
const allowedOrigins = [
  "http://localhost:5173",
  "https://tour-money-calculator-hcq4.onrender.com"   // your frontend URL
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

// Allow preflight for all routes
app.options("*", cors());

// -----------------------------------------------------
// Body parser
// -----------------------------------------------------
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// -----------------------------------------------------
// Test Route
// -----------------------------------------------------
app.get('/', (req, res) => {
  res.json({ message: "Hello from the TripSplit backend!" });
});

// -----------------------------------------------------
// Start Server Function
// -----------------------------------------------------
const startServer = async () => {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB database connection established successfully!");

    // Load routes AFTER DB is ready
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

    // Start server
    app.listen(PORT, () => {
      console.log(`Backend server is running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("Could not connect to MongoDB:", err);
    process.exit(1);
  }
};

startServer();
