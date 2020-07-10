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
app.get('/hello', handleHello);
app.use('*', handleNotFound);
app.use(handleError);

function handleHome(req, res) {
  res.status(200).send('Server is working');
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
