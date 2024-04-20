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
app.set('view engine', 'ejs');

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

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
app.post('/delete', async (req, res) => {
  try {
    const title = req.body.title; // Get title from request body
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
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to render the upload page
app.get('/upload', async (req, res) => {
  try {
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

// Define routes
const routes = ['/', '/home', '/mybooks', '/upload', '/login', '/signup', '/admin', '/salio'];

routes.forEach(route => {
  app.get(route, (req, res) => {
    res.render(route.slice(1), { files: [] }); // Render corresponding EJS template with an empty files array
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
