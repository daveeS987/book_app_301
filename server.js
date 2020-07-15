'use strict';

require('dotenv').config();

const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const morgan = require('morgan');
const cors = require('cors');
const PORT = process.env.PORT || 3000;
const app = express();
const methodOverride = require('method-override');
const client = new pg.Client(process.env.DATABASE_URL);

app.use(cors());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));

// Routes
app.get('/', handleHome);
app.get('/searchs/new', handleSearch);
app.post('/searches', renderResults);
app.get('/bookDetail/:book_id', renderBookDetails);
app.post('/bookDetail', handleSelectBook);

app.delete('/delete/:book_id', handleDeleteBook);
app.put('/updateBook/:book_id', handleUpdateBook);

app.use('*', handleNotFound);
app.use(handleError);

//////////////     Home Page
function handleHome(req, res) {
  let SQL = 'SELECT * FROM books';
  client
    .query(SQL)
    .then(results => {
      let amount = results.rowCount;
      let databaseArr = results.rows;
      let hide = 'hidden';
      let show = '';

      res.render('pages/index', { data: databaseArr, pgName: `${amount} Saved Books`, home: hide, searchNew: show });
    })
    .catch(error => handleError(error, res));
}

////////////////     Render Search Page
function handleSearch(req, res) {
  let hide = 'hidden';
  let show = '';

  res.render('pages/searches/new', { pgName: 'Search by Title or Author', home: show, searchNew: hide });
}

//////////////   Render Search Results Page
function renderResults(req, res) {
  const API = 'https://www.googleapis.com/books/v1/volumes';
  let queryObj = {
    q: `${req.body.title_author}:${req.body.search_query}`,
  };
  superagent
    .get(API)
    .query(queryObj)
    .then(apiData => {
      // console.log('hey API DATA____________+++++++++++++++++++++++!!!!!!!!!!!!!!!', apiData.body.items);
      let bookArr = apiData.body.items.map(value => new Books(value));
      let show = '';
      res.render('pages/searches/show', { data: bookArr, pgName: 'Search Results', home: show, searchNew: show });
    })
    .catch(error => handleError(error, res));
}

/////////////////////     Book Constructor
function Books(obj) {
  this.image_url = obj.volumeInfo.imageLinks.thumbnail.replace(/^http:\/\//i, 'https://') || `https://i.imgur.com/J5LVHEL.jpg`;
  this.title = obj.volumeInfo.title || 'Title Not Found.';
  this.author = obj.volumeInfo.authors || 'Author Not Found.';
  this.description = obj.volumeInfo.description || 'Description Not Found.';
  this.isbn = obj.volumeInfo.industryIdentifiers[0].identifier || 'ISBN not found';
}

////////////////     Render Book Details Page
function renderBookDetails(req, res) {
  // res.send(req.params);
  let SQL = `SELECT * FROM books WHERE id = $1`;
  let param = [req.params.book_id];
  let show = '';

  client
    .query(SQL, param)
    .then(results => {
      let dataBaseBooks = results.rows;
      res.render('pages/books/show', { data: dataBaseBooks, pgName: 'Details Page', home: show, searchNew: show });
    })
    .catch(error => handleError(error, res));
}

/////     Cache Selected Book to Database and Redirect to Detail Page
function handleSelectBook(req, res) {
  let userInput = req.body;
  const safeQuery = [userInput.author, userInput.title, userInput.isbn, userInput.image_url, userInput.description, userInput.bookshelf];
  const SQL = `
    INSERT INTO books (author, title, isbn, image_url, description, bookshelf) 
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;`;
  client
    .query(SQL, safeQuery)
    .then(results => {
      let dataBaseBooks = results.rows;
      let show = '';

      res.render('pages/books/show', { data: dataBaseBooks, pgName: 'Details Page', home: show, searchNew: show });
    })
    .catch(error => handleError(error, res));
}

///////////   Delete Selected Book and Return to Home Page
function handleDeleteBook(req, res) {
  console.log('req.param:++++++++++++++++++++++++++++++++++++++++++++++++', req.params);
  let SQL = 'DELETE from books WHERE id = $1';
  let safeQuery = [req.params.book_id];

  client
    .query(SQL, safeQuery)
    .then(results => {
      res.status(200).redirect('/');
    })
    .catch(error => handleError(error, res));
}

///////////   Update Selected Book and Return to Details Page
function handleUpdateBook(req, res) {
  console.log('req.body: ++++++++++++++++++++++++++++++++++++++++++++++++', req.body);
  res.status(200).redirect('/bookDetail/:book_id');
}

//////////////////    Errors
function handleNotFound(req, res) {
  res.status(404).send('Route not found');
}

function handleError(error, res) {
  console.log(error);
  res.render('pages/error', { data: error.message, pgName: 'Error 404' });
}

////////////// Listen on Port, Start the server
client.connect(() => {
  app.listen(PORT, () => console.log(`Server is up on port: ${PORT}`));
});
