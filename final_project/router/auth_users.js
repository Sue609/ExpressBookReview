const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{
return username.length >= 4;
}

const authenticatedUser = (username,password)=>{
const foundUser = users.find(user => user.username === username && user.password === password);
// return true if username and password match else false
return !!foundUser
}


//only registered users can login
regd_users.post("/login", (req,res) => {
  const { username, password } = req.body; // Retrieve username and password from request body

  // Check if username and password are provided in the request body
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (!isValid(username)) {
    return res.status(400).json({ message: 'Invalid username format' });
  }

  if (authenticatedUser(username, password)) {
    // Generate a JWT token for the authenticated user
    const accessToken = jwt.sign({ username }, 'access', { expiresIn: '1h' });

    req.session.authenticated = {
      accessToken,
      username
    };

    return res.status(200).json({ message: 'Login successful', accessToken });
  } else {
    return res.status(401).json({ message: 'Invalid username or password' });
  }  
});


// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => { 
  const { isbn } = req.params;
  const { review } = req.query;
  const { username } = req.session.authenticated || {};

  if (!username) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  if (!review) {
    return res.status(400).json({ message: 'Review content is required' });
  }

  const bookIndex = books.findIndex(book => book.isbn === isbn);
  if (bookIndex !== -1) {
    if (!books[bookIndex].reviews) {
      books[bookIndex].reviews = [];
    }
    const existingReviewIndex = books[bookIndex].reviews.findIndex(
      reviewItem => reviewItem.username === username
    );
    if (existingReviewIndex !== -1) {
      // Modify the existing review for the same user and ISBN
      books[bookIndex].reviews[existingReviewIndex].review = review;
      return res.status(200).json({ message: 'Review modified successfully', book: books[bookIndex] });
    } else {
      // Add a new review for a different user or a new review for the same user on a different ISBN
      books[bookIndex].reviews.push({ username, review });
      return res.status(200).json({ message: 'Review added successfully', book: books[bookIndex] });
    }
  } else {
    return res.status(404).json({ message: 'Book not found' });
  }
});


// Delete a book review based on the session username
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params; // Retrieve ISBN from request parameters
  const { username } = req.session.authenticated || {}; // Retrieve username from session

  if (!username) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  // Find the book with the provided ISBN
  const bookIndex = books.findIndex(book => book.isbn === isbn);

  if (bookIndex !== -1) {
    if (!books[bookIndex].reviews) {
      return res.status(404).json({ message: 'No reviews found for this book' });
    }

    // Filter reviews based on the session username and delete
    const initialReviewsLength = books[bookIndex].reviews.length;
    books[bookIndex].reviews = books[bookIndex].reviews.filter(review => review.username !== username);

    if (books[bookIndex].reviews.length !== initialReviewsLength) {
      return res.status(200).json({ message: 'Review(s) deleted successfully', book: books[bookIndex] });
    } else {
      return res.status(404).json({ message: 'No reviews found for the user on this book' });
    }
  } else {
    return res.status(404).json({ message: 'Book not found' });
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
