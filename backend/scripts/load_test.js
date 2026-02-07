const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const USERS_FILE = path.join(__dirname, '../data/users.json');
const TASKS_FILE = path.join(__dirname, '../data/tasks.json');

const NUM_USERS = 500;
const NUM_TASKS = 2000;
const FIXED_PASSWORD = 'password123'; // Using a fixed password for all users

async function generateData() {
    console.log(`Starting data generation: ${NUM_USERS} Users, ${NUM_TASKS} Tasks...`);

    // 1. Generate Users
    const users = [];
    console.log('Generating users...');
    const hashedPassword = await bcrypt.hash(FIXED_PASSWORD, 10);

    for (let i = 0; i < NUM_USERS; i++) {
        users.push({
            _id: `user_${Date.now()}_${i}`,
            username: `user${i}`,
            email: `user${i}@example.com`,
            password: hashedPassword
        });
    }

    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log(`✅ Generated ${users.length} users.`);

    // 2. Generate Tasks
    const tasks = [];
    console.log('Generating tasks...');

    const priorities = ['Low', 'Medium', 'High'];
    const statuses = ['Pending', 'Completed'];

    for (let i = 0; i < NUM_TASKS; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const randomDate = new Date(Date.now() + Math.random() * 10000000000).toISOString().split('T')[0]; // Random future date

        tasks.push({
            _id: `task_${Date.now()}_${i}`,
            userId: randomUser._id,
            title: `Task ${i} - Generated Load Test`,
            description: `This is a generated task description for task number ${i}. It creates some data volume.`,
            priority: randomPriority,
            dueDate: randomDate,
            dueTime: '12:00',
            status: randomStatus,
            reminderSent: false,
            order: i,
            createdAt: new Date().toISOString()
        });
    }

    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
    console.log(`✅ Generated ${tasks.length} tasks.`);

    console.log('=========================================');
    console.log('DATA GENERATION COMPLETE');
    console.log(`Login with: user0 / ${FIXED_PASSWORD}`);
    console.log('=========================================');
}

generateData().catch(err => console.error(err));
