const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');


public_users.post("/register", (req,res) => {
    // retrieve username and passowrd from req body
    const { username, password } = req.body;
  
    //check if username and password are provoded in the req
    if (!username || !password) {
      return res.status(400).json ({ message: 'Username and password required'});
    }
  
    // check if username already exists
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already existing' });
    }
  
    // if username is unique, create new user
    const newUser = { username, password };
    users.push(newUser);
  
    return res.status(201).json({ message: 'User registered successfully', user: newUser });
  });


// Get the book list available in the shop
public_users.get('/', async function (req, res) {
    try {
      const response = await axios.get('https://localhost/5000');
       // Extract book data from the response
      const books = response.data;
  
      return res.status(200).json(books);
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ message: 'Failed to fetch books' });
    }
});


// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
    // Retrieve ISBN from route parameters
    const { isbn } = req.params;
  
    try {
      const response = await axios.get(`https://localhost/5000/books/${isbn}`);
      const bookDetails = response.data;
      
      // Return book details in the response
      return res.status(200).json(bookDetails);
    } catch (error) {
      return res.status(404).json({ message: 'Book details not found' });
    }
});

  
// Get book details based on author
public_users.get('/author/:author',async function (req, res) {
  const { author } = req.params;
  try {
    const response = await axios.get(`http://localhost/5000/books/${author}`);
    const authorDetails = response.data;
    
    if (books.length > 0) {
        return res.status(200).json(authorDetails);
    } else {
        return res.status(404).json({ message: 'Books by this author not found' })
    }
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch the book' });
  }
});


// Get book details based on title using async/await with Axios
public_users.get('/title/:title', async (req, res) => {
    const { title } = req.params;
  
    try {
      const response = await axios.get(`http://localhost:5000/books?title=${title}`);
      const books = response.data;
  
      if (books.length > 0) {
        return res.status(200).json(books);
      } else {
        return res.status(404).json({ message: 'Books with this title not found' });
      }
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch books with this title' });
    }
});


//  Get book review
public_users.get('/review/:isbn',function (req, res) {
    const { isbn } = req.params; // Retrieve ISBN from request parameters
  
    const book = books.find(book => book.isbn === isbn);
  
    if (book && book.reviews && book.reviews.length > 0) {
      // If book with provided ISBN and reviews found, send reviews in the response
      return res.json(book.reviews);
    } else {
      // If no book with provided ISBN or no reviews found, return a 404 Not Found response
      return res.status(404).json({ message: 'Book reviews not found' });
    }
  });

module.exports.general = public_users;
