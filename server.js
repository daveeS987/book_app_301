'use strict';

require('dotenv').config();

const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const morgan = require('morgan');
const cors = require('cors');
const PORT = process.env.PORT || 3000;
const app = express();
const client = new pg.Client(process.env.DATABASE_URL);

app.use(cors());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));
app.set('view engine', 'ejs');

// Routes
app.get('/', handleHome);
app.get('/searchs/new', handleSearch);
app.post('/searches', renderResults);
app.get('/bookDetail/:book_id', renderBookDetails);
app.use('*', handleNotFound);
app.use(handleError);


//////////////     Home Page
function handleHome(req, res) {
  let SQL = 'SELECT * FROM books';
  client.query(SQL)
    .then(results => {
      let amount = results.rowCount;
      let databaseArr = results.rows;
      console.log(databaseArr);
      res.render('pages/index', { data: databaseArr, count: amount});
    });

}

////////////////     Search for books
function handleSearch(req, res){
  res.render('pages/searches/new');
}

////////////////    Renders Results
function renderResults(req, res) {
  const API = 'https://www.googleapis.com/books/v1/volumes';
  let queryObj = {
    q: `${req.body.title_author}:${req.body.search_query}`
  };

  superagent
    .get(API)
    .query(queryObj)
    .then(apiData => {
      let bookArr = apiData.body.items.map(value => new Books(value));
      res.render('pages/searches/show', { data: bookArr });
    })
    .catch(error => handleError(error, res));
}

//////////////     Book Constructor
function Books(obj) {
  this.image_url = obj.volumeInfo.imageLinks.thumbnail.replace(/^http:\/\//i, 'https://') || `https://i.imgur.com/J5LVHEL.jpg`;
  this.title = obj.volumeInfo.title || 'Title Not Found.';
  this.author = obj.volumeInfo.authors || 'Author Not Found.';
  this.description = obj.volumeInfo.description || 'Description Not Found.';
  this.isbn = obj.volumeInfo.industryIdentifiers[0].identifier || 'ISBN not found';
}

////////////////     Render Details
function renderBookDetails(req, res) {
  // res.send(req.params);
  let SQL = `SELECT * FROM books WHERE id = $1`;
  let param = [req.params.book_id];

  client.query(SQL, param)
    .then(results => {
      let dataBaseBooks = results.rows;
      res.render('pages/books/show', { data: dataBaseBooks});
    });

}



////////////////////// Errors
function handleNotFound(req, res) {
  res.status(404).send('Route not found');
}

function handleError(error, req, res, next) {
  console.log(error);
  res.render('pages/error', {errMessage: error.message});
}


////////////// Listen on Port, Start the server
client.connect(() => {
  app.listen(PORT, () => console.log(`Server is up on port: ${PORT}`));
});
