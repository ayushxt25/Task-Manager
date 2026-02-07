const fs = require('fs');
const path = require('path');

const TASKS_FILE = path.join(__dirname, 'data/tasks.json');
const USERS_FILE = path.join(__dirname, 'data/users.json');

const generateTasks = () => {
    // Read users to get a valid ID
    let users = [];
    try {
        users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch (err) {
        console.error('Error reading users:', err);
        return;
    }

    if (users.length === 0) {
        console.error('No users found! Please register a user first.');
        return;
    }

    const userId = users[0]._id; // Assign to the first user
    const tasks = [];

    const priorities = ['High', 'Medium', 'Low'];
    const statuses = ['Pending', 'Completed'];

    console.log(`Generating 1000 tasks for user: ${users[0].username} (${userId})...`);

    for (let i = 0; i < 1000; i++) {
        tasks.push({
            _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId: userId,
            title: `Mock Task ${i + 1} - Performance Test`,
            description: `This is a generated task description for task ${i + 1}. used to test application performance with large datasets.`,
            priority: priorities[Math.floor(Math.random() * priorities.length)],
            dueDate: new Date(Date.now() + Math.random() * 10000000000).toISOString().split('T')[0],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            order: i,
            createdAt: new Date().toISOString()
        });
    }

    // Read existing tasks (optional, if we want to keep them)
    let existingTasks = [];
    try {
        if (fs.existsSync(TASKS_FILE)) {
            existingTasks = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
        }
    } catch (err) { }

    const allTasks = [...existingTasks, ...tasks];

    fs.writeFileSync(TASKS_FILE, JSON.stringify(allTasks, null, 2));
    console.log('Successfully added 1000 tasks!');
};

generateTasks();
