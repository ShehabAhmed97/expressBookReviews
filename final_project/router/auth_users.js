const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const JWT_SECRET = "access";

const isValid = (username) => {
  return users.some(u => u.username === username);
};

const authenticatedUser = (username, password) => {
  return users.some(u => u.username === username && u.password === password);
};

// Task 7 - Login as a registered user
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid username or password." });
  }
  const accessToken = jwt.sign({ data: username }, JWT_SECRET, { expiresIn: 60 * 60 });
  req.session.authorization = { accessToken, username };
  return res.status(200).json({ message: `User '${username}' logged in successfully.`, token: accessToken });
});

// Task 8 - Add or modify a book review (logged-in users only; own reviews only)
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.body.review || req.query.review;
  const username = req.session.authorization && req.session.authorization.username;

  if (!username) {
    return res.status(401).json({ message: "Not logged in." });
  }
  if (!review) {
    return res.status(400).json({ message: "Review text is required (body or query 'review')." });
  }
  if (!books[isbn]) {
    return res.status(404).json({ message: `No book found for ISBN ${isbn}.` });
  }

  const isUpdate = Boolean(books[isbn].reviews[username]);
  books[isbn].reviews[username] = review;
  return res.status(200).json({
    message: isUpdate
      ? `Review by '${username}' updated for ISBN ${isbn}.`
      : `Review by '${username}' added for ISBN ${isbn}.`,
    reviews: books[isbn].reviews
  });
});

// Task 9 - Delete a book review (only the user's own review)
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization && req.session.authorization.username;

  if (!username) {
    return res.status(401).json({ message: "Not logged in." });
  }
  if (!books[isbn]) {
    return res.status(404).json({ message: `No book found for ISBN ${isbn}.` });
  }
  if (!books[isbn].reviews[username]) {
    return res.status(404).json({ message: `No review by '${username}' found for ISBN ${isbn}.` });
  }

  delete books[isbn].reviews[username];
  return res.status(200).json({
    message: `Review by '${username}' for ISBN ${isbn} deleted successfully.`,
    reviews: books[isbn].reviews
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
module.exports.JWT_SECRET = JWT_SECRET;
