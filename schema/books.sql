DROP TABLE IF EXISTS books;

CREATE TABLE books
(
  id SERIAL PRIMARY KEY,
  author VARCHAR(1000),
  title VARCHAR(1000),
  isbn VARCHAR(1000),
  image_url VARCHAR(1000),
  description VARCHAR(15000),
  bookshelf VARCHAR(1000)
);