const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/doctor.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'doctor.html'));
});

app.get('/appointments.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'appointments.html'));
});

app.get('/reports.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'reports.html'));
});

app.get('/billing.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'billing.html'));
});

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'IT24102304@mysql',
    database: process.env.DB_NAME || 'hospital_db',
    port: process.env.DB_PORT || 3306
});

db.connect((err) => {
    if (err) {
        console.log('MySQL Notice:', err.message);
        return;
    }
    console.log('Connected to MySQL Database.');
});

// Get all doctors
app.get('/api/doctors', (req, res) => {
    const sql = "SELECT * FROM doctors ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Add a new doctor
app.post('/api/doctors', (req, res) => {
    const { doctor_name, specialization, phone, room_no } = req.body || {};

    if (!doctor_name || !specialization || !phone || !room_no) {
        return res.status(400).json({ error: 'All doctor fields are required.' });
    }

    const sql = "INSERT INTO doctors (doctor_name, specialization, phone, room_no) VALUES (?, ?, ?, ?)";

    db.query(sql, [doctor_name.trim(), specialization.trim(), phone.trim(), room_no.trim()], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database insertion error' });
        }
        res.status(201).json({ message: 'Doctor added successfully!', id: result.insertId });
    });
});

// Get all patients
app.get('/api/patients', (req, res) => {
    const sql = "SELECT * FROM patients ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Add a new patient
app.post('/api/patients', (req, res) => {
    const { full_name, dob, gender, phone, address } = req.body || {};

    if (!full_name || !dob || !phone) {
        return res.status(400).json({ error: 'Full name, date of birth, and phone are required.' });
    }

    const sql = "INSERT INTO patients (full_name, date_of_birth, gender, phone, address) VALUES (?, ?, ?, ?, ?)";

    db.query(sql, [full_name.trim(), dob, gender || 'Other', phone.trim(), (address || '').trim()], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database insertion error' });
        }

        res.status(201).json({ message: 'Patient registered successfully!', patient_id: result.insertId });
    });
});

// Get all appointments with patient and doctor details
app.get('/api/appointments', (req, res) => {
    const sql = `
        SELECT a.id AS appointment_id, a.patient_id, a.doctor_id, a.status, a.appointment_datetime,
               p.full_name AS patient_name,
               d.doctor_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN doctors d ON a.doctor_id = d.id
        ORDER BY a.appointment_datetime DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Book an appointment
app.post('/api/appointments', (req, res) => {
    const { patient_id, doctor_id, appointment_date, appointment_datetime, status } = req.body || {};
    const finalAppointmentDate = appointment_datetime || appointment_date;

    if (!patient_id || !doctor_id || !finalAppointmentDate) {
        return res.status(400).json({ error: 'Patient ID, doctor ID, and appointment date are required.' });
    }

    const sql = "INSERT INTO appointments (patient_id, doctor_id, appointment_datetime, status) VALUES (?, ?, ?, ?)";

    db.query(sql, [patient_id, doctor_id, finalAppointmentDate, status || 'Pending'], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database insertion error' });
        }

        res.status(201).json({ message: 'Appointment booked successfully!', id: result.insertId });
    });
});

// Delete/Cancel an appointment
app.delete('/api/appointments/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM appointments WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database deletion error' });
        }
        res.json({ message: 'Appointment cancelled successfully!' });
    });
});

// Get all medical reports
app.get('/api/reports', (req, res) => {
    const sql = `
        SELECT mr.id, mr.patient_id, mr.doctor_id, mr.diagnosis, mr.prescription, mr.report_date,
               p.full_name AS patient_name,
               d.doctor_name
        FROM medical_reports mr
        JOIN patients p ON mr.patient_id = p.id
        JOIN doctors d ON mr.doctor_id = d.id
        ORDER BY mr.report_date DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Save a medical report
app.post('/api/reports', (req, res) => {
    const { patient_id, doctor_id, diagnosis, prescription } = req.body || {};

    if (!patient_id || !doctor_id || !diagnosis || !prescription) {
        return res.status(400).json({ error: 'Patient ID, doctor ID, diagnosis, and prescription are required.' });
    }

    const sql = "INSERT INTO medical_reports (patient_id, doctor_id, diagnosis, prescription) VALUES (?, ?, ?, ?)";

    db.query(sql, [patient_id, doctor_id, diagnosis.trim(), prescription.trim()], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database insertion error' });
        }

        res.status(201).json({ message: 'Medical report saved successfully!', id: result.insertId });
    });
});

// Get all billing records
app.get('/api/billing', (req, res) => {
    const sql = `
        SELECT b.id, p.full_name AS patient_name, b.amount, b.payment_status, b.billing_date
        FROM billing b
        JOIN patients p ON b.patient_id = p.id
        ORDER BY b.billing_date DESC
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Add a new bill
app.post('/api/billing', (req, res) => {
    const { patient_id, amount, payment_status } = req.body || {};

    if (!patient_id || !amount) {
        return res.status(400).json({ error: 'Patient ID and amount are required.' });
    }

    const sql = "INSERT INTO billing (patient_id, amount, payment_status) VALUES (?, ?, ?)";

    db.query(sql, [patient_id, amount, payment_status || 'Unpaid'], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database insertion error' });
        }

        res.status(201).json({ message: 'Bill created successfully!', id: result.insertId });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
// Get comprehensive system overview counts
app.get('/api/admin/overview', (req, res) => {
    const queries = {
        doctors: "SELECT COUNT(*) AS total FROM doctors",
        patients: "SELECT COUNT(*) AS total FROM patients",
        appointments: "SELECT COUNT(*) AS total FROM appointments",
        billing: "SELECT SUM(amount) AS total_revenue FROM billing WHERE payment_status = 'Paid'"
    };

    db.query(queries.doctors, (err, docRes) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        db.query(queries.patients, (err, patRes) => {
            db.query(queries.appointments, (err, appRes) => {
                db.query(queries.billing, (err, billRes) => {
                    res.json({
                        totalDoctors: docRes[0].total,
                        totalPatients: patRes[0].total,
                        totalAppointments: appRes[0].total,
                        totalRevenue: billRes[0].total_revenue || 0
                    });
                });
            });
        });
    });
});

module.exports = app;
