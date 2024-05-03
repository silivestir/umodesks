/*const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  connectionString: 'postgres://bgckrxlt:OQ2TG25MyY8LMSy-NXsSaY4pLGNxXmTy@salt.db.elephantsql.com/bgckrxlt',
});

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

const createUserTable = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);
`;

const createNotificationTable = `
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  message TEXT,
  recipient_id INT REFERENCES users(id),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

async function initializeTables() {
  try {
    const client = await pool.connect();
    await client.query(createUserTable);
    await client.query(createNotificationTable);
    const checkUser = await client.query('SELECT * FROM users WHERE phone = $1', ['06666666666']);
    if (checkUser.rowCount === 0) {
      await client.query('INSERT INTO users (username, phone, password) VALUES ($1, $2, $3)', ['admin', '06666666666', 'admin@mobcash']);
    }
    client.release();
    console.log('Tables initialized successfully.');
  } catch (error) {
    console.error('Error initializing tables:', error);
  }
}

initializeTables();

app.post('/signup', async (req, res) => {
  try {
    const { username, phone, password } = req.body;
    const existingUser = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (existingUser.rowCount > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    await pool.query('INSERT INTO users (username, phone, password) VALUES ($1, $2, $3)', [username, phone, password]);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE phone = $1 AND password = $2', [phone, password]);
    if (user.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }
    const token = jwt.sign({ userId: user.rows[0].id }, 'secret', { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) {
    return res.sendStatus(401);
  }
  jwt.verify(token, 'secret', (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}

// Add a new SQL query to select path and title from the books table
const selectBooksQuery = `
SELECT path, title FROM books;
`;

// Add a new route to handle the query and return the result as JSON
app.get('/books', async (req, res) => {
  try {
    const client = await pool.connect();
    const books = await client.query(selectBooksQuery);
    client.release();
    res.json(books.rows); // Return the result as JSON
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Your other endpoints can use the authenticateToken middleware to ensure authentication

const routes = ['/', '/home', '/uploxads/vijxewer', '/mybooks', '/upload', '/login', '/signup', '/admin', '/salio'];

routes.forEach(route => {
  app.get(route, (req, res) => {
    res.render(route.slice(1), { files: [] });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});*/

const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const { Pool } = require('pg');

// Set up PostgreSQL database connection
const pool = new Pool({
  connectionString: 'postgres://bgckrxlt:OQ2TG25MyY8LMSy-NXsSaY4pLGNxXmTy@salt.db.elephantsql.com/bgckrxlt',
});

// Set the view engine to EJS
//app.set('view engine', 'ejs');



// Set EJS as the rendering engine for specific routes
app.set('view engine', 'ejs');

// Use routes

// Start the 


//app.use(express.static('uploads'));










// Serve static files from the public directory

app.use(express.static(path.join(__dirname, 'public')));


app.set('views', path.join(__dirname, 'views'));
app.set('public', path.join(__dirname, 'public'));

app.set('uploads', path.join(__dirname, 'uploads'));
app.use(express.static(path.join(__dirname, 'uploads')));
// 


app.engine('hdctml', require('ejs').renderFile);
app.engine('pdf', require('ejs').renderFile);
// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Endpoint to fetch list of files from the database
app.get('/files', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT title FROM books');
    const files = result.rows.map(row => row.title);
    client.release();
    res.json(files);
  } catch (error) {
    console.error('Error fetching files from database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to delete a file from the database
app.post('/delete/:title', async (req, res) => {
  try {
    const title = req.params.title; // Get title from request body
console.log(title)
    // Check if the title is provided
    if (!title) {
      return res.status(400).json({ error: 'Title is required for deletion' });
    }

    // Delete file from the database using its title
    const client = await pool.connect();
    const result = await client.query('DELETE FROM books WHERE title = $1', [title]);
    client.release();

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.redirect('/upload'); // Redirect to the upload page after deletion
 console.log("here in ")
 
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to render the upload page
app.get('/upload', async (req, res) => {
  try {
    console.log('heree')
    // Fetch list of files from the database
    const client = await pool.connect();
    const result = await client.query('SELECT title FROM books');
    const files = result.rows.map(row => row.title);
    client.release();
    
    // Render the upload.ejs template with the list of files
    res.render('upload', { files });
  } catch (error) {
    console.error('Error fetching files from database:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to handle file upload and metadata insertion
app.post('/upload', upload.single('uploadFile'), async (req, res) => {
  try {
    const { title, author, fileDescription } = req.body; // Get metadata from request body
    const filePath = req.file.path; // Get path of the uploaded file

    // Insert metadata into the database
    const client = await pool.connect();
    await client.query('INSERT INTO books (title, author, description, path) VALUES ($1, $2, $3, $4)', [title, author, fileDescription, filePath]);
    client.release();

    // Redirect to the upload page after successful upload
    res.redirect('/upload');
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/icn.html', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', 'UDAHILI DANGOTE.pdf'); // Specify the path to your PDF file
  //  res.render(filePath);
  res.render('in.html?file=filePath')
});
app.get('/inz.html', (req, res) => {
    res.render('in.html', {
        fileUrl: '/reactfull.pdf', // Pass the file URL to the template
        bookName: 'read this book' // Pass the book name to the template
    });
});


app.get('/uploazds/viewer', function(req, res) {
    res.sendFile('/uploads/viewer');
});

app.get('/vifdffewer.html', function(req, res) {
    res.render('/viewer.html', { /* optional data */ });
});


app.get('/inddd', function(req, res) {
    res.render('/saliso', { /* optional data */ });
});
app.get('/inznn.HTML', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', 'the-complete-reference-html-css-fifth-edition.pdf'); // Specify the path to yo
    res.sendFile(path.join(__dirname, 'views', 'in.html')); // Send the in.html file
});
app.get('/inxxdd.html', (req, res) => {
    // Render the in.ejs template
//    res.render('in.html', { filePath: req.query.file });
const filePath = path.join(__dirname, 'uploads', 'the-complete-reference-html-css-fifth-edition.pdf'); // Specify the path to your PDF file
    res.sendFile(filePath);
});
// Add a new SQL query to select path and title from the books table
const selectBooksQuery = `
SELECT path, title FROM books;
`;

// Add a new route to handle the query and return the result as JSON
app.get('/books', async (req, res) => {
  try {
    const client = await pool.connect();
    const books = await client.query(selectBooksQuery);
    client.release();
    res.json(books.rows); // Return the result as JSON
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Define routes
const routes = ['/', '/home', '/uploxads/vijxewer','/mybooks', '/upload', '/login', '/signup', '/admin', '/salio'];

routes.forEach(route => {
  
  app.get(route, (req, res) => {
 //   res.sendFile("/uploads/viewer.html")
   res.render(route.slice(1), { files: [] }); // Render corresponding EJS template with an empty files array
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});