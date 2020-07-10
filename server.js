'use strict';

require('dotenv').config();

const express = require('express');
const superagent = require('superagent');
// const pg = require('pg');
const morgan = require('morgan');
const cors = require('cors');

const PORT = process.env.PORT || 3000;
const app = express();


app.use(cors());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));

app.set('view engine', 'ejs');


// Routes
app.get('/', handleHome);
app.get('/searchs/new', handleSearch);
app.post('/searches', handleResult);
app.use('*', handleNotFound);
app.use(handleError);


//-------- Home Page
function handleHome(req, res) {
  res.render('pages/index');
}

//-------- Search for books
function handleSearch(req, res){
  res.render('pages/searches/new');
}

//-------- Renders Results
function handleResult(req, res) {
  const API = 'https://www.googleapis.com/books/v1/volumes';

  let queryObj = {
    q: `${req.body.title_author}:${req.body.search_query}`
  };

  superagent.get(API).query(queryObj).then(apiData => {
    let bookArr = apiData.body.items.map(value => new Books(value));

    res.render('pages/searches/show', { data: bookArr });
  });

}

function Books(obj) {
  let regex = (/^http:\/\//i, 'https://');

  this.image = (obj.volumeInfo.imageLinks.thumbnail).replace(regex) || `https://i.imgur.com/J5LVHEL.jpg`;
  this.title = obj.volumeInfo.title || 'Title Not Found.';
  this.author = obj.volumeInfo.authors || 'Author Not Found.';
  this.description = obj.volumeInfo.description || 'Description Not Found.';
}


////////////////////// Errors
function handleNotFound(req, res) {
  res.status(404).send('Route not found');
}

function handleError(error, req, res, next) {
  console.log(error);
  res.render('pages/error', {errMessage: error.message});
}


// Listen on Port, Start the server
app.listen(PORT, () => console.log(`Server is up on port: ${PORT}`));

