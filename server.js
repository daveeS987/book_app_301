'use strict';

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const morgan = require('morgan');
const cors = require('cors');
const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors());
app.set('view engine', 'ejs');
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));

// Listen on Port, Start the server
app.listen(PORT, () => console.log(`Server is up on port: ${PORT}`));

// Routes
app.get('/', handleHome);
app.get('/searchs/new', handleSearch);
app.post('/searches', handleResult);
app.use('*', handleNotFound);
app.use(handleError);


///////////////// Home Page
function handleHome(req, res) {
  res.render('pages/index');
}

////////////////// Search for books
function handleSearch(req, res){
  res.render('pages/searches/new');
}




////////////////// Renders Results
function handleResult(req, res) {
  const API = 'https://www.googleapis.com/books/v1/volumes'
  let queryObj = {
    q: `${req.body.title_author}:${req.body.search_query}`
  };

  superagent
    .get(API)
    .query(queryObj)
    .then(apiData => {
      let bookArr = apiData.body.items.map(value => new Books(value));
      res.render('pages/searches/show', { data: bookArr });

    });
}

function Books(obj) {
  this.image = (obj.volumeInfo.imageLinks.thumbnail).replace(/^http:\/\//i, 'https://') || `https://i.imgur.com/J5LVHEL.jpg`;
  this.title = obj.volumeInfo.title || 'N/A';
  this.author = obj.volumeInfo.authors || 'N/A';
  this.description = obj.volumeInfo.description || 'N/A';
}


////////////////////// Errors and Tests
function handleNotFound(req, res) {
  res.status(404).send('Route not found');
}

function handleError(error, req, res, next) {
  console.log(error);
  res.render('pages/error', {errMessage: error.message});
}
