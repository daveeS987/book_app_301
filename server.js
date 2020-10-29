'use strict';

require('dotenv').config();

const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const morgan = require('morgan');
const cors = require('cors');
const PORT = process.env.PORT || 3000;
const app = express();
const client = new pg.Client(process.env.BOOKAPPDB_URL);
const override = require('method-override');

app.use(cors());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));
app.use(override('_method'));
app.set('view engine', 'ejs');

// Routes
app.get('/', handleHome);
app.get('/searchs/new', handleSearch);
app.post('/searches', renderResults);
app.get('/bookDetail/:book_id', renderBookDetails);
app.post('/bookDetail', handleSelectBook);
app.put('/updateBook/:book_id', handleUpdateBook);
app.delete('/delete/:book_id', handleDeleteBook);
app.use('*', handleNotFound);
app.use(handleError);


//////////////     Home Page
function handleHome(req, res) {
  let SQL = 'SELECT * FROM books';
  client.query(SQL)
    .then(results => {
      let amount = results.rowCount;
      let databaseArr = results.rows;
      let hide = 'hidden';
      let show = '';

      res.render('pages/index', { data: databaseArr, pgName: `${amount} Saved Books`, home: hide, searchNew: show});
    })
    .catch(error => handleError(error, req, res));
}

////////////////     Render Search Page
function handleSearch(req, res){
  let hide = 'hidden';
  let show = '';
  res.render('pages/searches/new', {pgName: 'Search by Title or Author', home: show, searchNew: hide});
}

////////////////    Render Search Results Page
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
      let show = '';

      res.render('pages/searches/show',
        { data: bookArr,
          pgName: 'Search Results',
          home: show,
          searchNew: show
        });
    })
    .catch(error => handleError(error, req, res));
}

//////////////     Book Constructor
function Books(obj) {
  this.image_url = obj.volumeInfo.imageLinks.thumbnail.replace(/^http:\/\//i, 'https://') || `https://i.imgur.com/J5LVHEL.jpg`;
  this.title = obj.volumeInfo.title || 'Title Not Found.';
  this.author = obj.volumeInfo.authors || 'Author Not Found.';
  this.description = obj.volumeInfo.description || 'Description Not Found.';
  this.isbn = obj.volumeInfo.industryIdentifiers[0].identifier || 'ISBN not found';
}

////////////////     Render Book Details Page
function renderBookDetails(req, res) {
  let SQL = `SELECT * FROM books WHERE id = $1`;
  let SQL2 = 'SELECT DISTINCT bookshelf FROM books';
  let param = [req.params.book_id];
  let show = '';

  client.query(SQL, param)
    .then(result1 => {
      client.query(SQL2)
        .then(result2 => {
          let withOutCurrentBookShelfArr = result2.rows.filter(value => value.bookshelf !== result1.rows[0].bookshelf);
          res.render('pages/books/show',
            { data: result1.rows[0],
              dropdown: withOutCurrentBookShelfArr,
              pgName: 'Details Page',
              home: '',
              searchNew: show
            });
        });
    })
    .catch(error => handleError(error, req, res));
}

//////// Update Book Details and then Redirect to Details Page
function handleUpdateBook(req, res) {
  let SQL = `UPDATE books 
  SET title = $1, author = $2, isbn = $3, description = $4, image_url = $5, bookshelf = $6 
  WHERE id = $7
  RETURNING *`;
  let bookNum = req.params.book_id;
  let params = [req.body.title, req.body.author, req.body.isbn, req.body.description, req.body.image_url, req.body.bookshelf, req.params.book_id];

  client.query(SQL, params)
    .then(results => {
      res.redirect(`/bookDetail/${bookNum}`);
    }).catch(error => handleError(error, req, res));
}

//////      Delete Selected Book and Redirect to Home Page
function handleDeleteBook(req, res){
  let SQL = 'DELETE FROM books WHERE id = $1';
  let params = [req.params.book_id];

  client.query(SQL, params)
    .then(() => {
      res.status(200).redirect('/');
    }).catch(error => handleError(error, req, res));
}

////     Cache Selected Book to Database and Redirect to Detail Page
function handleSelectBook(req, res) {
  let userInput = req.body;
  const safeQuery = [userInput.author, userInput.title, userInput.isbn, userInput.image_url, userInput.description, userInput.bookshelf];
  const SQL = `
    INSERT INTO books (author, title, isbn, image_url, description, bookshelf) 
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;`;
  client.query(SQL, safeQuery)
    .then(results => {
      res.status(200).redirect(`/bookDetail/${results.rows[0].id}`);
    })
    .catch(error => handleError(error, req, res));
}


//////////////////    Errors
function handleNotFound(req, res) {
  res.status(404).send('Route not found');
}

function handleError(error, req, res) {
  // console.log(error);
  res.render('pages/error', {pgName: 'Error 404', data: error.message, home:'', searchNew: '', });
}


////////////// Listen on Port, Start the server
client.connect(() => {
  app.listen(PORT, () => console.log(`Server is up on port: ${PORT}`));
});
