require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', require('./routes/authRoutes'));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// --- Reminder Service ---
const fs = require('fs');
const nodemailer = require('nodemailer');

const TASKS_FILE = path.join(__dirname, 'data/tasks.json');
const USERS_FILE = path.join(__dirname, 'data/users.json');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

function checkReminders() {
    console.log('Checking for reminders...');
    try {
        if (!fs.existsSync(TASKS_FILE) || !fs.existsSync(USERS_FILE)) return;

        const tasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8') || '[]');
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '[]');
        const now = new Date();
        const fortyEightHoursFromNow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
        let updated = false;

        tasks.forEach(task => {
            if (task.status !== 'Completed' && !task.reminderSent && task.dueDate) {
                // Construct Date object from date and time
                const dueDateTimeString = task.dueTime ? `${task.dueDate}T${task.dueTime}` : `${task.dueDate}T00:00`;
                const dueDateTime = new Date(dueDateTimeString);

                if (dueDateTime > now && dueDateTime <= fortyEightHoursFromNow) {
                    const user = users.find(u => u._id === task.userId);
                    if (user && user.email) {
                        // Send Email
                        const mailOptions = {
                            from: process.env.EMAIL_USER,
                            to: user.email,
                            subject: `Reminder: Task "${task.title}" is due soon!`,
                            text: `Hi ${user.username},\n\nThis is a reminder that your task "${task.title}" is due on ${task.dueDate} at ${task.dueTime || 'All Day'}.\n\nPlease complete it on time!\n\nBest,\nTask Manager`
                        };

                        transporter.sendMail(mailOptions, (err, info) => {
                            if (err) console.error('Error sending reminder:', err);
                            else console.log(`Reminder sent to ${user.email} for task "${task.title}"`);
                        });

                        task.reminderSent = true;
                        updated = true;
                    }
                }
            }
        });

        if (updated) {
            fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
        }
    } catch (err) {
        console.error('Reminder service error:', err);
    }
}

// Run reminder check every 60 seconds
setInterval(checkReminders, 60000);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Using file-based storage (data/tasks.json)`);
    console.log(`Reminder service started (checks every 60s)`);
});
