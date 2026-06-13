// This file contains the server shared application logic.

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import medicalRecordRoutes from './routes/medicalRecordRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import labRequestRoutes from './routes/labRequestRoutes.js';
import radiologyRequestRoutes from './routes/radiologyRequestRoutes.js';
import billRoutes from './routes/billRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import userService from './services/userService.js';
import departmentService from './services/departmentService.js';
import patientService from './services/patientService.js';
import billService from './services/billService.js';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

// Handle app.
const app = express();
// Store the port setting used by this file.
const PORT = process.env.PORT || 5000;

// Attach this middleware or route group to the server.
app.use(cors());
// Attach this middleware or route group to the server.
app.use(express.json());

// Attach this middleware or route group to the server.
app.use('/api/users', authRoutes);
// Attach this middleware or route group to the server.
app.use('/api/users', userRoutes);
// Attach this middleware or route group to the server.
app.use('/api/patients', patientRoutes);
// Attach this middleware or route group to the server.
app.use('/api/appointments', appointmentRoutes);
// Attach this middleware or route group to the server.
app.use('/api/queue', queueRoutes);
// Attach this middleware or route group to the server.
app.use('/api/medical-records', medicalRecordRoutes);
// Attach this middleware or route group to the server.
app.use('/api/prescriptions', prescriptionRoutes);
// Attach this middleware or route group to the server.
app.use('/api/medicines', medicineRoutes);
// Attach this middleware or route group to the server.
app.use('/api/lab-requests', labRequestRoutes);
// Attach this middleware or route group to the server.
app.use('/api/radiology-requests', radiologyRequestRoutes);
// Attach this middleware or route group to the server.
app.use('/api/bills', billRoutes);
// Attach this middleware or route group to the server.
app.use('/api/inventory', inventoryRoutes);
// Attach this middleware or route group to the server.
app.use('/api/feedback', feedbackRoutes);
// Attach this middleware or route group to the server.
app.use('/api/notifications', notificationRoutes);
// Attach this middleware or route group to the server.
app.use('/api/reports', reportRoutes);
// Attach this middleware or route group to the server.
app.use('/api/departments', departmentRoutes);
// Attach this middleware or route group to the server.
app.use('/api/doctors', doctorRoutes);

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Hospital Management System API is running',
    });
});

// Handle start server.
const startServer = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not configured');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Database connected');

    await userService.ensureDefaultAdmin();
    await departmentService.ensureDefaultDepartments();
    const repairedPatientProfiles = await patientService.ensurePatientProfilesForPatientUsers();
    if (repairedPatientProfiles > 0)
        console.log(`Repaired ${repairedPatientProfiles} patient profile link(s)`);
    const assignedDoctorRooms = await billService.ensureDoctorRoomNumbers();
    if (assignedDoctorRooms > 0)
        console.log(`Assigned ${assignedDoctorRooms} doctor room number(s)`);
    const repairedAppointmentBills = await billService.ensurePaidAppointmentBills();
    if (repairedAppointmentBills > 0)
        console.log(`Created ${repairedAppointmentBills} missing paid appointment bill(s)`);

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer().catch((error) => {
    console.error('Server startup error:', error.message);
    process.exit(1);
});
