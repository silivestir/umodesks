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
//const jwxt = require('jsonwebtoken');
//const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const secretKey = crypto.randomBytes(32).toString('hex');

console.log(secretKey)

const bodyParser = require('body-parser');


// Middleware to parse JSON bodies
app.use(bodyParser.json());


app.use(bodyParser.urlencoded({ extended: true }));

// Handle

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

const notify=`CREATE TABLE IF NOT EXISTS notify (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    seen BOOLEAN DEFAULT false
);`;


const createUserTable = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);
`;

const  books=`ALTER TABLE books ADD COLUMN likes INTEGER DEFAULT 0
`;

async function initializeTables() {
  try {
    const client = await pool.connect();
 //   await client.query(books);
    await client.query(createUserTable);
    await client.query(notify);
    const checkUser = await client.query('SELECT * FROM users WHERE phone = $1', ['255778611556']);
    if (checkUser.rowCount === 0) {
      await client.query('INSERT INTO users (username, phone, password) VALUES ($1, $2, $3)', ['admin', '255778611556', 'admin@umodesk']);
    }
    client.release();
    console.log('Tables initialized successfully.');
  } catch (error) {
    console.error('Error initializing tables:', error);
  }
}

initializeTables();


//const jwt = require('jsonwebtoken');
/*
// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Unauthorized');
  
  jwt.verify(token, '1351ea61fcad693d0422433dd34644558e2e8373ec1a36c55a30e126924b4e48', (err, decoded) => {
    if (err) return res.status(401).send('Unauthorized');
    req.userId = decoded.userId; // Extracting user's ID from the token
    next();
  });
}*/

//const jwt = require('jsonwebtoken');

app.get('/user/notifications/:userId', async (req, res) => {
  const userId = req.params.userId;
  
  try {
    // Decode the token to extract the user ID
    
    // Get unseen notifications for the user
    const notifications = await pool.query('SELECT * FROM notify WHERE user_id = $1 AND seen = false', [userId]);
    res.status(200).json(notifications.rows);
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



/*
app.put('/user/notifications/:notificationId', verifyToken, async (req, res) => {
  const notificationId = req.params.notificationId;
  const userId = req.userId;

  try {
    // Check if the notification belongs to the logged-in user
    const notification = await pool.query('SELECT user_id FROM notify WHERE id = $1', [notificationId]);
    if (notification.rows.length === 0) {
      return res.status(404).send('Notification not found');
    }
    const ownerId = notification.rows[0].user_id;
    if (userId !== ownerId) {
      return res.status(403).send('Forbidden');
    }

    // Mark notification as seen
    await pool.query('UPDATE notify SET seen = true WHERE id = $1', [notificationId]);
    res.status(200).send('Notification marked as seen');
  } catch (error) {
    console.error('Error marking notification as seen:', error);
    res.status(500).send('Internal server error');
  }
});

*/






























































































































// Endpoint to handle file upload and metadata insertion
app.post('/upload', upload.single('uploadFile'), async (req, res) => {
  try {
    const { title, author, fileDescription } = req.body; // Get metadata from request body
    const filePath = req.file.path; // Get path of the uploaded file

    // Insert metadata into the database
    const client = await pool.connect();
    //add modifications to handle notifications to user
    
    
    
    
    
    
    
    
    await client.query('INSERT INTO books (title, author, description, path) VALUES ($1, $2, $3, $4)', [title, author, fileDescription, filePath]);
    
    
    
    const users = await client.query('SELECT * FROM users');

    // Insert notifications for each user
    users.rows.forEach(async (user) => {
      await client.query('INSERT INTO notify (user_id, message) VALUES ($1, $2)', [user.id, `Hello New book, "${title}" by ${author} posted.`]);
    });

    
    
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
SELECT * FROM books;
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

app.post('/updateBook', async (req, res) => {
  const { fileId, fieldToUpdate } = req.body;
  
  try {
    const client = await pool.connect();
    
    // Update the appropriate field in the books table based on fileId and fieldToUpdate
    let updateQuery;
    if (fieldToUpdate === 'views') {
      updateQuery = `UPDATE books SET views = views + 1 WHERE id = $1`;
    } else if (fieldToUpdate === 'likes') {
      updateQuery = `UPDATE books SET likes = likes + 1 WHERE id = $1`;
    } else {
      // Handle invalid fieldToUpdate value
      res.status(400).json({ error: 'Invalid fieldToUpdate value' });
      return;
    }
    
    await client.query(updateQuery, [fileId]);
    client.release();
    
    res.status(200).json({ message: 'Book record updated successfully' });
  } catch (error) {
    console.error('Error updating book record:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});







app.post('/signups', async (req, res) => {
  try {
    
    const username = req.body.username;
    const phone = req.body.phone;
    const password = req.body.password;

    // Process t
   console.log(username)
    const existingUser = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (existingUser.rowCount > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    await pool.query('INSERT INTO users (username, phone, password) VALUES ($1, $2, $3)', [username, phone, password]);

    // Redirect to the home page after successful signup
    return res.redirect('/login');

  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

function generateToken(userId) {
  return jwt.sign({ userId }, '1351ea61fcad693d0422433dd34644558e2e8373ec1a36c55a30e126924b4e48', { expiresIn: '4h' }); // Change 'your_secret_key' to your actual secret key
}


// Authentication route
//const jwt = require('jsonwebtoken');
const sessions={};
app.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  try {
    // Fetch user data from the database
    const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check password (insecure, should be replaced with bcrypt hashing)
    if (password !== user.password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Check if the user is already logged in
    if (sessions[user.id]) {
      // Invalidate existing session
      delete sessions[user.id];
      console.log(`User ${user.id} logged out from previous session.`);
    }

    // Include user ID in the redirect URL
    const redirectUrl = `/uploads/viewer.html?userId=${user.id}`;

    // Redirect to viewer.html with user ID in the URL parameters
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Error authenticating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


/*

app.post('/login', async (req, res) => {
  try {
    const phone = req.body.phone;
    const password = req.body.password;
//navigator.localStorage.setIteam("user","assey")


    console.log(phone)
    const user = await pool.query('SELECT * FROM users WHERE phone = $1 AND password = $2', [phone, password]);
    if (user.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    // Check if the user's phone number is "0666666666"
    if (phone === "0666666666") {
      // Redirect to the upload page
      return res.redirect('/upload');
    } else {
      // Redirect to the home page
      return res.redirect('/uploads/viewer');
    }

    // Generate JWT token for user session
    // const token = jwt.sign({ userId: user.rows[0].id }, 'secret', { expiresIn: '1h' });
    // res.json({ token });

  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

*/


// Route to handle updating likes for a book
app.post('/updateLikes:id', async (req, res) => {
  const { bookId } = req.params.id;

  try {
    console.log(bookId)
    // Increment likes count for the specified book ID
    const updateQuery = 'UPDATE books SET likes = likes + 1 WHERE id = $1';
    await pool.query(updateQuery, [bookId]);
    
    // Send success response
    res.json({ success: true, message: 'Likes updated successfully' });
  } catch (error) {
    console.error('Error updating likes:', error);
    // Send error response
    res.status(500).json({ success: false, error: 'Error updating likes' });
  }
});





// Define routes
const routes = ['/', '/home', '/uploxads/vijxewer','/mybooks', '/upload', '/login', '/signup', '/admin', '/homes'];

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