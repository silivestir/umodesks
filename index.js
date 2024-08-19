const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const { Pool } = require('pg');
const cookieParser = require('cookie-parser'); // Ensure you use this middleware to parse cookies
const nodemailer = require('nodemailer');

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

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.set('views', path.join(__dirname, 'views'));
app.set('public', path.join(__dirname, 'public'));

app.set('uploads', path.join(__dirname, 'uploads'));
app.use(express.static(path.join(__dirname, 'uploads')));
// 

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



// Endpoint to handle file upload and metadata insertion
app.post('/upload', upload.single('uploadFile'), async (req, res) => {
  const { title, author, fileDescription } = req.body; // Get metadata from request body
  const filePath = req.file.path; // Get path of the uploaded file

  try {
    const client = await pool.connect();

    try {
      // Insert metadata into the database
      await client.query('INSERT INTO books (title, author, description, path) VALUES ($1, $2, $3, $4)', [title, author, fileDescription, filePath]);

      // Fetch all users from the database
      const result = await client.query('SELECT id FROM users');
      const userIds = result.rows.map(user => user.id);

      // Prepare notifications for all users
      const notifications = userIds.map(userId => {
        return client.query('INSERT INTO notify (user_id, message) VALUES ($1, $2)', [userId, `Hello New book, "${title}" by ${author} posted.`]);
      });

      // Execute all notifications insertion queries
      await Promise.all(notifications);

      client.release();

      // Redirect to the upload page after successful upload
      res.redirect('/upload');
    } catch (error) {
      console.error('Error during database operations:', error);
      client.release();
      throw error; // Rethrow error to be caught by outer catch block
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.get('/user/notifications/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        // Fetch notifications for the given userId from the database
        const result = await pool.query('SELECT * FROM notify WHERE user_id = $1', [userId]);
        const notifications = result.rows;

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
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

  if (!fileId || !fieldToUpdate) {
    return res.status(400).json({ error: 'fileId and fieldToUpdate are required' });
  }

  try {
    const client = await pool.connect();

    let updateQuery;
    if (fieldToUpdate === 'views') {
      updateQuery = 'UPDATE books SET views = views + 1 WHERE id = $1';
    } else if (fieldToUpdate === 'likes') {
      updateQuery = 'UPDATE books SET likes = likes + 1 WHERE id = $1';
    } else {
      client.release();
      return res.status(400).json({ error: 'Invalid fieldToUpdate value' });
    }

    await client.query(updateQuery, [fileId]);
    client.release();

    res.status(200).json({ message: 'Book record updated successfully' });
  } catch (error) {
    console.error('Error updating book record:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.post('/logout', (req, res) => {
  const sessionId = req.cookies.sessionId;

  if (sessionId) {
    delete sessions[sessionId]; // Remove session from memory
    res.clearCookie('sessionId'); // Clear the cookie
    res.json({ message: 'Logged out successfully' });
  } else {
    res.status(400).json({ message: 'No active session' });
  }
});





// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
        user: 'silvestiriassey@gmail.com',
        pass: 'urzt ftqf caxa rhwk' // It's better to use environment variables for sensitive information
    }
});

// Route for user signup and OTP sending
app.post('/signups', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    // Check if the user already exists
    const { rowCount: userCount } = await pool.query('SELECT * FROM users WHERE phone = $1 OR email = $2', [phone, email]);
    if (userCount > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Insert user into the database
    await pool.query('INSERT INTO users (username, email, phone, password) VALUES ($1, $2, $3, $4)', [username, email, phone, password]);

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999); // Random 6-digit OTP
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

    // Update the user's OTP and expiration time
    await pool.query('UPDATE users SET otp = $1, otp_expires_at = $2 WHERE email = $3', [otp, expiresAt, email]);

    // Send OTP email
    const mailOptions = {
      from: 'silvestiriassey@gmail.com',
      to: email,
      subject: 'Your OTP Code',
      html: `
        <p>Hello,</p>
        <p>Your OTP code is <strong>${otp}</strong>.</p>
        <p>This email is sent by the admin at Roitec Education College.</p>
        <img src="cid:logo" alt="Roitec Education College Logo" />
        <p>Best regards,<br>Roitec Education College Team</p>
      `,
      attachments: [
        {
          filename: 'Screenshot_20240727-090533.jpg',
          path: 'uploads/Screenshot_20240727-090533.jpg',
          cid: 'logo'
        }
      ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: 'Failed to send OTP email' });
      }

      console.log('Email sent:', info.response);

      // Redirect to the OTP verification page with email in query string
      return res.redirect(`/otp-verification?email=${email}`);
    });

  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
app.post('/verify-otp', async (req, res) => {
  const { otp, email } = req.body;

  try {
    // Fetch the user from the database
    const { rows } = await pool.query('SELECT otp, otp_expires_at FROM users WHERE email = $1', [email]);

    if (rows.length === 0) {
      return res.status(400).send('OTP has expired or is invalid.');
    }

    const user = rows[0];
    const currentTime = new Date();

    if (user.otp_expires_at < currentTime) {
      await pool.query('UPDATE users SET otp = NULL, otp_expires_at = NULL WHERE email = $1', [email]); // Remove expired OTP
      return res.status(400).send('OTP has expired. Please request a new one.');
    }

    if (user.otp === parseInt(otp, 10)) {
      await pool.query('UPDATE users SET otp = NULL, otp_expires_at = NULL WHERE email = $1', [email]); // Remove OTP after successful verification
      res.send('OTP verified successfully!');
    } else {
      res.status(400).send('Invalid OTP. Please try again.');
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.get('/otp-verification', (req, res) => {
  const email = req.query.email;
  res.render('otp-verification', { email });
});



async function alterUsersTable() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('ALTER TABLE users ADD COLUMN otp INTEGER;');
    await client.query('ALTER TABLE users ADD COLUMN otp_expires_at TIMESTAMP;');
    await client.query('COMMIT');
    console.log('Table altered successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error altering table:', error);
  } finally {
    client.release();
  }
}

alterUsersTable().catch(error => console.error('Failed to alter users table:', error));

app.use((req, res, next) => {
  const sessionId = req.cookies.sessionId;

  if (sessionId && sessions[sessionId]) {
    req.userId = sessions[sessionId].userId; // Attach userId to the request object
    next(); // Proceed to the next middleware or route handler
  } else {
    next(); // Proceed without authentication for routes that don't require it
  }
});

// Authentication route
//const jwt = require('jsonwebtoken');
 // For generating session IDs

const sessions = {}; // In-memory session storage

app.post('/login', async (req, res) => {
    const { phone, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (password !== user.password) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const sessionId = crypto.randomBytes(16).toString('hex');
        sessions[sessionId] = { userId: user.id };

        res.cookie('sessionId', sessionId, { httpOnly: true, maxAge: 3600000 });
        res.cookie('userId', user.id, { httpOnly: true, maxAge: 3600000 }); // Set user ID cookie

        if (phone === '255778611556') {
            return res.redirect('/upload');
        } else {
          
            return res.redirect('/uploads/viewer.html');
        }
    } catch (error) {
        console.error('Error authenticating user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/uploads/viewer.html', (req, res) => {
  if (req.userId) {
    res.sendFile('/path/to/viewer.html'); // Serve the file if the user is authenticated
  } else {
    res.status(401).redirect('/login'); // Redirect to login if not authenticated
  }
});


// Route to handle updating likes for a book
app.post('/updateLikes/:id', async (req, res) => {
  const bookId = req.params.id; // Access route parameter correctly

  try {
    console.log(bookId);
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

app.post('/updateViews/:id', async (req, res) => {
  const bookId = req.params.id; // Access route parameter correctly

  try {
    console.log(bookId);
    // Increment likes count for the specified book ID
    const updateQuery = 'UPDATE books SET views = views + 1 WHERE id = $1';
    await pool.query(updateQuery, [bookId]);
    
    // Send success response
    res.json({ success: true, message: 'you have aded as a file viewer' });
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
