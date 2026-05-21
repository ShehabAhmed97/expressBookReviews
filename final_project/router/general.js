const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

// Register a new user
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }
  if (users.some(u => u.username === username)) {
    return res.status(409).json({ message: "User already exists." });
  }
  users.push({ username, password });
  return res.status(201).json({ message: `User '${username}' registered successfully.` });
});

// Task 1 - Get the list of all books (async/await with Promise)
public_users.get('/', async (req, res) => {
  try {
    const allBooks = await new Promise((resolve) => resolve(books));
    return res.status(200).send(JSON.stringify(allBooks, null, 2));
  } catch (err) {
    return res.status(500).json({ message: "Error retrieving books." });
  }
});

// Task 2 - Get book details by ISBN (Promise)
public_users.get('/isbn/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  new Promise((resolve, reject) => {
    const book = books[isbn];
    if (book) resolve(book);
    else reject({ status: 404, message: `No book found for ISBN ${isbn}.` });
  })
    .then(book => res.status(200).json(book))
    .catch(err => res.status(err.status || 500).json({ message: err.message }));
});

// Task 3 - Get book details by author (Promise)
public_users.get('/author/:author', (req, res) => {
  const author = req.params.author.toLowerCase();
  new Promise((resolve, reject) => {
    const matches = Object.entries(books)
      .filter(([, b]) => b.author.toLowerCase() === author)
      .map(([id, b]) => ({ id, ...b }));
    if (matches.length) resolve(matches);
    else reject({ status: 404, message: `No books found for author '${req.params.author}'.` });
  })
    .then(list => res.status(200).json(list))
    .catch(err => res.status(err.status || 500).json({ message: err.message }));
});

// Task 4 - Get all books by title (Promise)
public_users.get('/title/:title', (req, res) => {
  const title = req.params.title.toLowerCase();
  new Promise((resolve, reject) => {
    const matches = Object.entries(books)
      .filter(([, b]) => b.title.toLowerCase().includes(title))
      .map(([id, b]) => ({ id, ...b }));
    if (matches.length) resolve(matches);
    else reject({ status: 404, message: `No books found with title '${req.params.title}'.` });
  })
    .then(list => res.status(200).json(list))
    .catch(err => res.status(err.status || 500).json({ message: err.message }));
});

// Task 5 - Get reviews for a specific book by ISBN
public_users.get('/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;
  const book = books[isbn];
  if (!book) {
    return res.status(404).json({ message: `No book found for ISBN ${isbn}.` });
  }
  return res.status(200).json(book.reviews);
});

// Axios + Promise / async-await client functions (Task 10)
const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

// Get all books - async/await
async function getAllBooksWithAxios() {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    console.log("All books:", response.data);
    return response.data;
  } catch (err) {
    console.error("Error fetching all books:", err.message);
  }
}

// Get book by ISBN - Promise
function getBookByISBNWithAxios(isbn) {
  return axios.get(`${BASE_URL}/isbn/${isbn}`)
    .then(response => {
      console.log(`Book for ISBN ${isbn}:`, response.data);
      return response.data;
    })
    .catch(err => console.error(`Error fetching ISBN ${isbn}:`, err.message));
}

// Get books by author - Promise
function getBooksByAuthorWithAxios(author) {
  return axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`)
    .then(response => {
      console.log(`Books by ${author}:`, response.data);
      return response.data;
    })
    .catch(err => console.error(`Error fetching author '${author}':`, err.message));
}

// Get books by title - async/await
async function getBooksByTitleWithAxios(title) {
  try {
    const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
    console.log(`Books with title '${title}':`, response.data);
    return response.data;
  } catch (err) {
    console.error(`Error fetching title '${title}':`, err.message);
  }
}

module.exports.general = public_users;
module.exports.getAllBooksWithAxios = getAllBooksWithAxios;
module.exports.getBookByISBNWithAxios = getBookByISBNWithAxios;
module.exports.getBooksByAuthorWithAxios = getBooksByAuthorWithAxios;
module.exports.getBooksByTitleWithAxios = getBooksByTitleWithAxios;
