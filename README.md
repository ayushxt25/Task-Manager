# Task Manager Pro

**A robust, full-stack Task Management application featuring real-time email notifications, secure multi-user authentication, and advanced data visualization.** 

Built with **Node.js, Express, and Vanilla JS**, this project demonstrates a production-ready workflow for personal and team productivity. It includes automated 48-hour email reminders, password recovery via Gmail SMTP, and has been stress-tested with over 2000+ data entries for guaranteed performance.

A full-stack Task Management application built with Node.js, Express, MongoDB, and Vanilla JavaScript.

## Project Overview

This application allows users to create, view, update, and delete tasks. It features a responsive, modern UI and a persistent backend API.

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)

## Setup Instructions

### Prerequisites
- Node.js installed
- MongoDB installed and running locally

### 1. Clone/Download the Repository
If you haven't already, navigate to the project directory.

### 2. Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure MongoDB is running.
4. Start the server:
   ```bash
   npm start
   ```
   The server will run on `http://localhost:5000`.

### 3. Frontend Setup
1. Navigate to the `frontend` folder.
2. Open `index.html` in your browser.
   - You can simply double-click the file or use a live server extension.

## Features

- **Create**: Add new tasks with a title and optional description.
- **Read**: View all tasks in a list, filter by status (All, Pending, Completed).
- **Update**: Edit task details and toggle status between Pending and Completed.
- **Delete**: Remove tasks permanently.
- **Responsive Design**: Works on desktop and mobile devices.

## API Endpoints

- `GET /api/tasks`: Fetch all tasks
- `POST /api/tasks`: Create a new task
- `PUT /api/tasks/:id`: Update a task
- `DELETE /api/tasks/:id`: Delete a task

## License
MIT
