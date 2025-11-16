const jwt = require('jsonwebtoken');

// Get the secret key from the .env file
const jwtSecret = process.env.JWT_SECRET;

// Middleware function to check for a valid JWT token
const auth = (req, res, next) => {
  // 1. Check if the token is present in the request header
  const token = req.header('x-auth-token');

  // If no token, return 401 (Unauthorized)
  if (!token) {
    return res.status(401).json({ message: 'Error: No token, authorization denied.' });
  }

  try {
    // 2. Verify the token using the secret key
    const decoded = jwt.verify(token, jwtSecret);

    // 3. Attach the user ID from the token payload to the request object
    //    We can now access req.user.id in our route handlers
    req.user = decoded; 
    
    // 4. Continue to the next middleware or the route handler
    next();
  } catch (e) {
    // If verification fails (e.g., token expired or invalid signature)
    res.status(401).json({ message: 'Error: Token is not valid.' });
  }
};

module.exports = auth;