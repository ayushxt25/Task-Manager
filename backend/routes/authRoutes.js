const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join(__dirname, '../data/users.json');
const JWT_SECRET = 'your_jwt_secret_key_here'; // In production, use .env

// Helper to read users
const readUsers = () => {
    try {
        if (!fs.existsSync(USERS_FILE)) {
            fs.writeFileSync(USERS_FILE, '[]');
            return [];
        }
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (err) {
        return [];
    }
};

// Helper to write users
const writeUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// Register User
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const users = readUsers();

    if (users.find(u => u.username === username || u.email === email)) {
        return res.status(400).json({ message: 'Username or Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
        _id: Date.now().toString(),
        username,
        email,
        password: hashedPassword
    };

    users.push(newUser);
    writeUsers(users);

    // Send Welcome Email
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to Task Manager!',
        text: `Hi ${username},\n\nWelcome to Task Manager! Your account has been successfully created.\n\nYou can now log in and start organizing your tasks.\n\nBest regards,\nThe Team`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error('Error sending welcome email:', err);
            // Don't fail the registration if email fails, just log it
        } else {
            console.log('Welcome email sent:', info.response);
        }
    });

    res.status(201).json({ message: 'User created successfully' });
});

// Login User
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();

    // Allow login with username OR email
    const user = users.find(u => u.username === username || u.email === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, username: user.username });
});

// Forgot Password - Generate Reset Code
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;
    const users = readUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetCode = resetCode;
    user.resetCodeExpires = Date.now() + 3600000; // 1 hour

    writeUsers(users);

    // Nodemailer Transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Code - Task Manager',
        text: `Your password reset code is: ${resetCode}\n\nThis code expires in 1 hour.`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            console.error('Error sending email:', err);
            return res.status(500).json({ message: 'Error sending email. Please try again later.' });
        }
        console.log('Email sent:', info.response);
        res.json({ message: 'Reset code sent to your email.' });
    });
});

// Reset Password - Verify Code and Update Password
router.post('/reset-password', async (req, res) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const users = readUsers();
    const user = users.find(u => u.email === email);

    if (!user || user.resetCode !== code || user.resetCodeExpires < Date.now()) {
        return res.status(400).json({ message: 'Invalid or expired code' });
    }

    user.password = await bcrypt.hash(newPassword, 10);

    // Clear reset code
    delete user.resetCode;
    delete user.resetCodeExpires;

    writeUsers(users);

    res.json({ message: 'Password reset successfully' });
});

module.exports = router;
