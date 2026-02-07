const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/tasks.json');

// Helper to read tasks
const readTasks = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            fs.writeFileSync(DATA_FILE, '[]');
            return [];
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (err) {
        console.error('Error reading data:', err);
        return [];
    }
};

// Helper to write tasks
const writeTasks = (tasks) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
    } catch (err) {
        console.error('Error writing data:', err);
    }
};

const auth = require('../middleware/authMiddleware');

// GET all tasks (User specific) with Pagination
router.get('/', auth, (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const tasks = readTasks();
    const userTasks = tasks.filter(t => t.userId === req.user.id);

    // Sort by order asc, then createdAt desc
    userTasks.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const paginatedTasks = userTasks.slice(startIndex, endIndex);

    res.json({
        tasks: paginatedTasks,
        totalTasks: userTasks.length,
        totalPages: Math.ceil(userTasks.length / limit),
        currentPage: page
    });
});

// POST a new task
router.post('/', auth, (req, res) => {
    const { title, description, priority, dueDate } = req.body;
    if (!title) {
        return res.status(400).json({ message: 'Title is required' });
    }

    // Calculate new order to be at the top
    const tasks = readTasks(); // FIX: Read tasks first!
    const userTasks = tasks.filter(t => t.userId === req.user.id);
    const minOrder = userTasks.reduce((min, t) => Math.min(min, t.order || 0), 0);

    const newTask = {
        _id: Date.now().toString(),
        userId: req.user.id,
        title,
        description: description || '',
        priority: priority || 'Medium',
        dueDate: dueDate || '',
        dueTime: req.body.dueTime || '',
        status: 'Pending',
        reminderSent: false,
        order: minOrder - 1,   // Place at top
        createdAt: new Date().toISOString()
    };

    tasks.push(newTask);
    writeTasks(tasks);
    res.status(201).json(newTask);
});

// UPDATE a task
router.put('/:id', auth, (req, res) => {
    const tasks = readTasks();
    const taskIndex = tasks.findIndex(t => t._id === req.params.id && t.userId === req.user.id);

    if (taskIndex === -1) {
        return res.status(404).json({ message: 'Task not found' });
    }

    const task = tasks[taskIndex];
    if (req.body.title != null) task.title = req.body.title;
    if (req.body.description != null) task.description = req.body.description;
    if (req.body.status != null) task.status = req.body.status;
    if (req.body.priority != null) task.priority = req.body.priority;
    if (req.body.dueDate != null) task.dueDate = req.body.dueDate;
    if (req.body.dueTime != null) task.dueTime = req.body.dueTime;

    tasks[taskIndex] = task;
    writeTasks(tasks);
    res.json(task);
});

// REORDER tasks
router.put('/reorder/all', auth, (req, res) => {
    const { orderedIds } = req.body;
    if (!orderedIds || !Array.isArray(orderedIds)) {
        return res.status(400).json({ message: 'Invalid data' });
    }

    let tasks = readTasks();
    const userTasks = tasks.filter(t => t.userId === req.user.id);
    const otherTasks = tasks.filter(t => t.userId !== req.user.id);

    // Update order of user tasks based on the array index
    userTasks.forEach(task => {
        const newIndex = orderedIds.indexOf(task._id);
        if (newIndex !== -1) {
            task.order = newIndex;
        }
    });

    // Merge back
    tasks = [...otherTasks, ...userTasks];
    writeTasks(tasks);
    res.json({ message: 'Tasks reordered' });
});

// DELETE a task
router.delete('/:id', auth, (req, res) => {
    let tasks = readTasks();
    const taskIndex = tasks.findIndex(t => t._id === req.params.id && t.userId === req.user.id);

    if (taskIndex === -1) {
        return res.status(404).json({ message: 'Task not found' });
    }

    tasks = tasks.filter(t => t._id !== req.params.id);
    writeTasks(tasks);
    res.json({ message: 'Task deleted' });
});

module.exports = router;
