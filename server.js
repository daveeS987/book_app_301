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
app.post('/searches', handleSearch);
app.get('/hello', handleHello);
app.use('*', handleNotFound);
app.use(handleError);

function handleHome(req, res) {
  res.render('pages/searches/new');
}

function handleSearch(req, res) {
  // req.body
  // intitle 
  // inauthor

  // if req.body.title_author === title 
  const API = 'https://www.googleapis.com/books/v1/volumes'

  let queryObj = {
    q: `${req.body.title_author}:${req.body.search_query}`
  };
  console.log('queryObj: ', queryObj);

  superagent
    .get(API)
    .query(queryObj)
    .then(apiData => {
      console.log(apiData.body.items);

      let bookArr = apiData.body.items.map(value => new Books(value));
      res.send(bookArr);
      // res.send(apiData.body.items);
    });
}

function Books(obj) {
  //image
  //book title
  // author name
  // description
  this.image = obj.volumeInfo.imageLinks.thumbnail;
  this.title = obj.volumeInfo.title;
  this.author = obj.volumeInfo.authors;
  this.description = obj.volumeInfo.description;
}



function handleHello(req, res) {
  res.render('pages/index');
}

function handleNotFound(req, res) {
  res.status(404).send('Route not found');
}

function handleError(error, req, res, next) {
  console.log(error);
  res.status(500).send('Something bad happened');
}
