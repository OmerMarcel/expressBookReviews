const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
  return users.some((user) => user.username === username);
};

const authenticatedUser = (username, password) => {
  return users.some((user) => user.username === username && user.password === password);
};

//only registered users can login
regd_users.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (authenticatedUser(username, password)) {
    let accessToken = jwt.sign({data: password}, "access", {expiresIn: 60 * 60});
    req.session.authorization = {
      accessToken: accessToken
    };
    req.session.username = username;
    return res.status(200).send(username + " successfully logged in");
  }
  return res.status(401).send("Invalid Login. Check username and password");
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.username;
  if (books[isbn]) {
    books[isbn].reviews[username] = review;
    return res.status(200).json({message: "Review added/updated successfully"});
  }
  return res.status(404).json({message: "Book not found"});
});

// Delete a book review
regd_users.delete("/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.username;
  if (books[isbn]) {
    if (books[isbn].reviews[username]) {
      delete books[isbn].reviews[username];
      return res.status(200).json({message: "Review deleted"});
    }
    return res.status(400).json({message: "No review found for this user"});
  }
  return res.status(404).json({message: "Book not found"});
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
