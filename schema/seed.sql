INSERT INTO books
  (author, title, isbn, image_url, description, bookshelf)
VALUES
  ('Random Author', 'Random title', 'Random isbn', 'https:
//i.imgur.com/J5LVHEL.jpg', 'blah blah description', 'random bookshelf')
RETURNING *;