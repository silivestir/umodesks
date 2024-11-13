const express = require('express');
const app = express();
const path = require('path');
const multer = require('multer');
const { Pool } = require('pg');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Database connection
const pool = new Pool({
  connectionString: 'postgres://bgckrxlt:OQ2TG25MyY8LMSy-NXsSaY4pLGNxXmTy@salt.db.elephantsql.com/bgckrxlt',
});

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Session management (in-memory, consider using Redis for production)
const sessions = {}; 

// Nodemailer setup for OTP emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'silvestiriassey@gmail.com',
    pass: 'urzt ftqf caxa rhwk', // Replace with environment variable in production
  },
});

// Initialize database tables if not present
const createUserTable = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL,
  otp INTEGER,
  otp_expires_at TIMESTAMP
);
`;

const createNotifyTable = `
CREATE TABLE IF NOT EXISTS notify (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  message TEXT NOT NULL,
  seen BOOLEAN DEFAULT false
);
`;

async function initializeTables() {
  try {
    const client = await pool.connect();
    await client.query(createUserTable);
    await client.query(createNotifyTable);
    
    // Create an admin user if not exists
    const checkUser = await client.query('SELECT * FROM users WHERE phone = $1', ['255778611556']);
    if (checkUser.rowCount === 0) {
      const hashedPassword = await bcrypt.hash('admin@umodesk', 10);
      await client.query('INSERT INTO users (username, phone, password) VALUES ($1, $2, $3)', ['admin', '255778611556', hashedPassword]);
    }
    client.release();
    console.log('Tables initialized successfully.');
  } catch (error) {
    console.error('Error initializing tables:', error);
  }
}

initializeTables();

// Routes for file upload and metadata insertion
app.post('/upload', upload.single('uploadFile'), async (req, res) => {
  const { title, author, fileDescription } = req.body;
  const filePath = req.file.path;

  try {
    const client = await pool.connect();

    // Insert metadata into the database
    await client.query('INSERT INTO books (title, author, description, path) VALUES ($1, $2, $3, $4)', [title, author, fileDescription, filePath]);

    // Fetch all users from the database and send notifications
    const result = await client.query('SELECT id FROM users');
    const userIds = result.rows.map(user => user.id);

    // Prepare notifications for all users
    const notifications = userIds.map(userId => {
      return client.query('INSERT INTO notify (user_id, message) VALUES ($1, $2)', [userId, `New book "${title}" by ${author} posted.`]);
    });

    // Execute all notifications insertion queries
    await Promise.all(notifications);

    client.release();
    res.redirect('/upload');
  } catch (error) {
    console.error('Error during file upload:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route for user signups and OTP sending
app.post('/signups', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    // Check if the user already exists
    const { rowCount: userCount } = await pool.query('SELECT * FROM users WHERE phone = $1 OR email = $2', [phone, email]);
    if (userCount > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the database
    await pool.query('INSERT INTO users (username, email, phone, password) VALUES ($1, $2, $3, $4)', [username, email, phone, hashedPassword]);

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

    // Update the user's OTP and expiration time
    await pool.query('UPDATE users SET otp = $1, otp_expires_at = $2 WHERE email = $3', [otp, expiresAt, email]);

    // Send OTP email
    const mailOptions = {
      from: 'silvestiriassey@gmail.com',
      to: email,
      subject: 'Your OTP Code',
      html: `<p>Your OTP code is <strong>${otp}</strong>.</p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: 'Failed to send OTP email' });
      }
      console.log('Email sent:', info.response);
      return res.redirect(`/otp-verification?email=${email}`);
    });
  } catch (error) {
    console.error('Error signing up:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Route to verify OTP
app.post('/verify-otp', async (req, res) => {
  const { otp, email } = req.body;

  try {
    const { rows } = await pool.query('SELECT otp, otp_expires_at FROM users WHERE email = $1', [email]);

    if (rows.length === 0) {
      return res.status(400).send('OTP has expired or is invalid.');
    }

    const user = rows[0];
    const currentTime = new Date();

    if (user.otp_expires_at < currentTime) {
      await pool.query('UPDATE users SET otp = NULL, otp_expires_at = NULL WHERE email = $1', [email]);
      return res.status(400).send('OTP has expired. Please request a new one.');
    }

    if (user.otp === parseInt(otp, 10)) {
      await pool.query('UPDATE users SET otp = NULL, otp_expires_at = NULL WHERE email = $1', [email]);
      res.send('OTP verified successfully!');
    } else {
      res.status(400).send('Invalid OTP. Please try again.');
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route to render OTP page
app.get('/otp-verification', (req, res) => {
  const email = req.query.email;
  res.render('otp-verification', { email });
});

// Login route with password hashing
app.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const sessionId = crypto.randomBytes(16).toString('hex');
    sessions[sessionId] = { userId: user.id };

    res.cookie('sessionId', sessionId, { httpOnly: true, maxAge: 3600000 });
    res.cookie('userId', user.id, { httpOnly: true, maxAge: 3600000 });

    res.json({ message: 'Login successful' });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout route
app.post('/logout', (req, res) => {
  const sessionId = req.cookies.sessionId;
  delete sessions[sessionId];
  res.clearCookie('sessionId');
  res.clearCookie('userId');
  res.send('Logged out successfully');
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
