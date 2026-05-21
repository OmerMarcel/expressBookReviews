const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = 'http://localhost:5000';

// Promise helpers for book data access (Tasks 10-13)
const getAllBooks = () => {
  return new Promise((resolve) => {
    resolve(books);
  });
};

const getBookByISBN = (isbn) => {
  return new Promise((resolve, reject) => {
    if (books[isbn]) {
      resolve(books[isbn]);
    } else {
      reject(new Error("Book not found"));
    }
  });
};

const getBooksByAuthor = (author) => {
  return new Promise((resolve, reject) => {
    const keys = Object.keys(books);
    const booksByAuthor = {};
    keys.forEach((isbn) => {
      if (books[isbn].author === author) {
        booksByAuthor[isbn] = books[isbn];
      }
    });
    if (Object.keys(booksByAuthor).length > 0) {
      resolve(booksByAuthor);
    } else {
      reject(new Error("No books found for this author"));
    }
  });
};

const getBooksByTitle = (title) => {
  return new Promise((resolve, reject) => {
    const keys = Object.keys(books);
    const booksByTitle = {};
    keys.forEach((isbn) => {
      if (books[isbn].title === title) {
        booksByTitle[isbn] = books[isbn];
      }
    });
    if (Object.keys(booksByTitle).length > 0) {
      resolve(booksByTitle);
    } else {
      reject(new Error("No books found with this title"));
    }
  });
};

// Internal sync endpoints used by Axios (Tasks 10-13)
public_users.get('/service/books', (req, res) => {
  getAllBooks()
    .then((data) => res.status(200).send(JSON.stringify(data, null, 4)))
    .catch((err) => res.status(500).json({message: err.message}));
});

public_users.get('/service/isbn/:isbn', (req, res) => {
  getBookByISBN(req.params.isbn)
    .then((data) => res.status(200).send(JSON.stringify(data, null, 4)))
    .catch(() => res.status(404).json({message: "Book not found"}));
});

public_users.get('/service/author/:author', (req, res) => {
  getBooksByAuthor(req.params.author)
    .then((data) => res.status(200).send(JSON.stringify(data, null, 4)))
    .catch(() => res.status(404).json({message: "No books found for this author"}));
});

public_users.get('/service/title/:title', (req, res) => {
  getBooksByTitle(req.params.title)
    .then((data) => res.status(200).send(JSON.stringify(data, null, 4)))
    .catch(() => res.status(404).json({message: "No books found with this title"}));
});

public_users.post("/register", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (username && password) {
    if (!users.some((user) => user.username === username)) {
      users.push({username, password});
      return res.status(200).json({message: "User successfully registered. Now you can login"});
    }
    return res.status(400).json({message: "User already exists!"});
  }
  return res.status(400).json({message: "Unable to register. Username and password required"});
});

// Task 10: Get all books using Promise callbacks with Axios
public_users.get('/', (req, res) => {
  axios.get(`${BASE_URL}/service/books`, {responseType: 'text'})
    .then((response) => res.status(200).send(response.data))
    .catch((err) => res.status(500).json({message: err.message}));
});

// Task 11: Get book by ISBN using async-await with Axios
public_users.get('/isbn/:isbn', async (req, res) => {
  try {
    const response = await axios.get(`${BASE_URL}/service/isbn/${req.params.isbn}`, {responseType: 'text'});
    return res.status(200).send(response.data);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({message: "Book not found"});
    }
    return res.status(500).json({message: err.message});
  }
});

// Task 12: Get books by author using Promise callbacks with Axios
public_users.get('/author/:author', (req, res) => {
  const author = encodeURIComponent(req.params.author);
  axios.get(`${BASE_URL}/service/author/${author}`, {responseType: 'text'})
    .then((response) => res.status(200).send(response.data))
    .catch((err) => {
      if (err.response && err.response.status === 404) {
        return res.status(404).json({message: "No books found for this author"});
      }
      return res.status(500).json({message: err.message});
    });
});

// Task 13: Get books by title using async-await with Axios
public_users.get('/title/:title', async (req, res) => {
  try {
    const title = encodeURIComponent(req.params.title);
    const response = await axios.get(`${BASE_URL}/service/title/${title}`, {responseType: 'text'});
    return res.status(200).send(response.data);
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return res.status(404).json({message: "No books found with this title"});
    }
    return res.status(500).json({message: err.message});
  }
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  if (books[isbn]) {
    return res.status(200).send(JSON.stringify(books[isbn].reviews, null, 4));
  }
  return res.status(404).json({message: "Book not found"});
});

module.exports.general = public_users;
