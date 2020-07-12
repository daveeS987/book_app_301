INSERT INTO books
  (author, title, isbn, image_url, description, bookshelf)
VALUES
  ('Random Author', 'Random title', 'Random isbn', 'https://random', 'blah blah description', 'random bookshelf')
RETURNING *;