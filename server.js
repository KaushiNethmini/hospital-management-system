const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Test Route
app.get('/', (req, res) => {
    res.send('Hospital Management System API is running...');
});

// 2. Fetch Roles
app.get('/api/roles', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM roles');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. User Registration (Sign Up)
app.post('/api/register', async (req, res) => {
    const { username, email, password, role_id } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (username, email, password_hash, role_id) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, role_id]
        );
        res.status(201).json({ message: 'User registered successfully!', userId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. User Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        res.json({ message: 'Login successful!', user: { id: user.id, username: user.username, role_id: user.role_id } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Get All Doctors
app.get('/api/doctors', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM doctors');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 6. Book an Appointment
app.post('/api/appointments', async (req, res) => {
    const { patient_id, doctor_id, appointment_date, status } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO appointments (patient_id, doctor_id, appointment_date, status) VALUES (?, ?, ?, ?)',
            [patient_id, doctor_id, appointment_date, status || 'Pending']
        );
        res.status(201).json({ message: 'Appointment booked successfully!', appointmentId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Get All Appointments
app.get('/api/appointments', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM appointments');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

/// Register a new patient
app.post('/api/patients', async (req, res) => {
    console.log("--> Received request at /api/patients!");
    console.log("--> Request Body:", req.body);

    const { full_name, dob, gender, phone, address } = req.body;

    const query = 'INSERT INTO patients (full_name, dob, gender, phone, address) VALUES (?, ?, ?, ?, ?)';

    try {
        console.log("--> Executing MySQL query...");
        // Use await with Promise-based db pool
        const [result] = await db.query(query, [full_name, dob, gender, phone, address]);

        console.log("--> Insert Success! ID:", result.insertId);
        return res.status(201).json({ 
            message: 'Patient registered successfully!', 
            patient_id: result.insertId 
        });
    } catch (err) {
        console.error('--> MySQL Error:', err);
        return res.status(500).json({ error: err.message });
    }
});