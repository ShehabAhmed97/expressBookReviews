const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;
const { JWT_SECRET } = require('./router/auth_users.js');

const app = express();

app.use(express.json());

app.use("/customer", session({
  secret: "fingerprint_customer",
  resave: true,
  saveUninitialized: true
}));

// JWT auth middleware for protected customer routes
app.use("/customer/auth/*", function auth(req, res, next) {
  if (!req.session || !req.session.authorization) {
    return res.status(401).json({ message: "User not logged in." });
  }
  const token = req.session.authorization.accessToken;
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Session token is invalid or expired." });
    }
    req.user = decoded;
    next();
  });
});

const PORT = 5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
