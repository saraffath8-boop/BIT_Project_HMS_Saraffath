// This file contains the app shared application logic.

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import AppShell from './components/layout/AppShell';
import { Toaster } from './components/ui/sonner';
import DashboardRedirect from './pages/DashboardRedirect';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import Signup from './pages/Signup';
import Unauthorized from './pages/Unauthorized';
import ProfilePage from './pages/ProfilePage';
import AppointmentsPage from './pages/appointments/AppointmentsPage';
import AppointmentCreatePage from './pages/appointments/AppointmentCreatePage';
import AppointmentEditPage from './pages/appointments/AppointmentEditPage';
import DoctorConsultationPage from './pages/appointments/DoctorConsultationPage';
import DoctorAvailabilityPage from './pages/appointments/DoctorAvailabilityPage';
import PatientAppointmentBookingPage from './pages/appointments/PatientAppointmentBookingPage';
import BillingPage from './pages/billing/BillingPage';
import BillCreatePage from './pages/billing/BillCreatePage';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import DoctorDashboard from './pages/dashboards/DoctorDashboard';
import LabDashboard from './pages/dashboards/LabDashboard';
import NurseDashboard from './pages/dashboards/NurseDashboard';
import PatientDashboard from './pages/dashboards/PatientDashboard';
import PharmacistDashboard from './pages/dashboards/PharmacistDashboard';
import RadiologyDashboard from './pages/dashboards/RadiologyDashboard';
import FeedbackPage from './pages/feedback/FeedbackPage';
import InventoryPage from './pages/inventory/InventoryPage';
import InventoryCreatePage from './pages/inventory/InventoryCreatePage';
import LaboratoryPage from './pages/laboratory/LaboratoryPage';
import LabRequestCreatePage from './pages/laboratory/LabRequestCreatePage';
import LabRequestProcessingPage from './pages/laboratory/LabRequestProcessingPage';
import MedicalRecordsPage from './pages/medicalRecords/MedicalRecordsPage';
import MedicalRecordCreatePage from './pages/medicalRecords/MedicalRecordCreatePage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import NotificationCreatePage from './pages/notifications/NotificationCreatePage';
import MyAppointmentsPage from './pages/patientPortal/MyAppointmentsPage';
import MyBillsPage from './pages/patientPortal/MyBillsPage';
import MyPrescriptionsPage from './pages/patientPortal/MyPrescriptionsPage';
import MyReportsPage from './pages/patientPortal/MyReportsPage';
import PatientCreatePage from './pages/patients/PatientCreatePage';
import PatientEditPage from './pages/patients/PatientEditPage';
import PatientProfilePage from './pages/patients/PatientProfilePage';
import PatientsPage from './pages/patients/PatientsPage';
import PharmacyPage from './pages/pharmacy/PharmacyPage';
import MedicineCreatePage from './pages/pharmacy/MedicineCreatePage';
import PrescriptionsPage from './pages/prescriptions/PrescriptionsPage';
import PrescriptionCreatePage from './pages/prescriptions/PrescriptionCreatePage';
import QueuePage from './pages/queue/QueuePage';
import QueueCreatePage from './pages/queue/QueueCreatePage';
import QueueEditPage from './pages/queue/QueueEditPage';
import RadiologyPage from './pages/radiology/RadiologyPage';
import RadiologyRequestCreatePage from './pages/radiology/RadiologyRequestCreatePage';
import RadiologyRequestProcessingPage from './pages/radiology/RadiologyRequestProcessingPage';
import ReportsPage from './pages/reports/ReportsPage';
import UsersPage from './pages/users/UsersPage';

// Handle protected route.
const protectedRoute = (children) => (
    <ProtectedRoute>
        <AppShell>{children}</AppShell>
    </ProtectedRoute>
);

// Handle role route.
const roleRoute = (allowedRoles, children) => (
    <ProtectedRoute>
        <RoleRoute allowedRoles={allowedRoles}>
            <AppShell>{children}</AppShell>
        </RoleRoute>
    </ProtectedRoute>
);

// Handle app.
function App() {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/Login" element={<Navigate to="/login" replace />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/book-appointment" element={<PatientAppointmentBookingPage />} />
                <Route path="/Signup" element={<Navigate to="/signup" replace />} />
                <Route path="/dashboard" element={protectedRoute(<DashboardRedirect />)} />
                <Route path="/dashboard/admin" element={roleRoute(['admin'], <AdminDashboard />)} />
                <Route
                    path="/dashboard/doctor"
                    element={roleRoute(['doctor'], <DoctorDashboard />)}
                />
                <Route
                    path="/dashboard/nurse"
                    element={roleRoute(['nurse', 'receptionist'], <NurseDashboard />)}
                />
                <Route
                    path="/dashboard/patient"
                    element={roleRoute(['patient'], <PatientDashboard />)}
                />
                <Route
                    path="/dashboard/pharmacist"
                    element={roleRoute(['pharmacist'], <PharmacistDashboard />)}
                />
                <Route
                    path="/dashboard/lab"
                    element={roleRoute(['lab_technician'], <LabDashboard />)}
                />
                <Route
                    path="/dashboard/radiology"
                    element={roleRoute(['radiologist'], <RadiologyDashboard />)}
                />

                <Route
                    path="/patients"
                    element={roleRoute(
                        ['admin', 'doctor', 'nurse', 'receptionist'],
                        <PatientsPage />,
                    )}
                />
                <Route
                    path="/patients/new"
                    element={roleRoute(['admin', 'receptionist'], <PatientCreatePage />)}
                />
                <Route
                    path="/patients/:id"
                    element={roleRoute(
                        ['admin', 'doctor', 'nurse', 'receptionist'],
                        <PatientProfilePage />,
                    )}
                />
                <Route
                    path="/patients/:id/edit"
                    element={roleRoute(['admin', 'nurse', 'receptionist'], <PatientEditPage />)}
                />

                <Route
                    path="/appointments"
                    element={roleRoute(
                        ['admin', 'doctor', 'nurse', 'receptionist'],
                        <AppointmentsPage />,
                    )}
                />
                <Route
                    path="/appointments/new"
                    element={roleRoute(['receptionist'], <AppointmentCreatePage />)}
                />
                <Route
                    path="/doctor-availability"
                    element={roleRoute(['receptionist'], <DoctorAvailabilityPage />)}
                />
                <Route
                    path="/appointments/:id/edit"
                    element={roleRoute(['admin', 'receptionist'], <AppointmentEditPage />)}
                />
                <Route
                    path="/queue/:id/diagnosis-report"
                    element={roleRoute(['doctor'], <DoctorConsultationPage />)}
                />
                <Route
                    path="/my/appointments"
                    element={roleRoute(['patient'], <MyAppointmentsPage />)}
                />
                <Route path="/my/bills" element={roleRoute(['patient'], <MyBillsPage />)} />
                <Route
                    path="/my/prescriptions"
                    element={roleRoute(['patient'], <MyPrescriptionsPage />)}
                />
                <Route path="/my/reports" element={roleRoute(['patient'], <MyReportsPage />)} />
                <Route
                    path="/queue"
                    element={roleRoute(['admin', 'doctor', 'nurse', 'receptionist'], <QueuePage />)}
                />
                <Route
                    path="/queue/new"
                    element={roleRoute(['admin', 'nurse', 'receptionist'], <QueueCreatePage />)}
                />
                <Route
                    path="/queue/:id/edit"
                    element={roleRoute(['admin', 'nurse', 'receptionist'], <QueueEditPage />)}
                />
                <Route
                    path="/medical-records"
                    element={roleRoute(['admin', 'doctor', 'nurse'], <MedicalRecordsPage />)}
                />
                <Route
                    path="/medical-records/new"
                    element={roleRoute(['admin', 'doctor'], <MedicalRecordCreatePage />)}
                />
                <Route
                    path="/prescriptions"
                    element={roleRoute(['admin', 'doctor', 'pharmacist'], <PrescriptionsPage />)}
                />
                <Route
                    path="/prescriptions/new"
                    element={roleRoute(['admin'], <PrescriptionCreatePage />)}
                />
                <Route
                    path="/pharmacy"
                    element={roleRoute(['admin', 'doctor', 'pharmacist'], <PharmacyPage />)}
                />
                <Route
                    path="/pharmacy/new"
                    element={roleRoute(['admin', 'pharmacist'], <MedicineCreatePage />)}
                />
                <Route
                    path="/laboratory"
                    element={roleRoute(
                        ['admin', 'doctor', 'nurse', 'lab_technician'],
                        <LaboratoryPage />,
                    )}
                />
                <Route
                    path="/laboratory/new"
                    element={roleRoute(['admin'], <LabRequestCreatePage />)}
                />
                <Route
                    path="/laboratory/:id/process"
                    element={roleRoute(
                        ['admin', 'doctor', 'lab_technician'],
                        <LabRequestProcessingPage />,
                    )}
                />
                <Route
                    path="/radiology"
                    element={roleRoute(
                        ['admin', 'doctor', 'nurse', 'radiologist'],
                        <RadiologyPage />,
                    )}
                />
                <Route
                    path="/radiology/new"
                    element={roleRoute(['admin'], <RadiologyRequestCreatePage />)}
                />
                <Route
                    path="/radiology/:id/process"
                    element={roleRoute(
                        ['admin', 'doctor', 'radiologist'],
                        <RadiologyRequestProcessingPage />,
                    )}
                />
                <Route
                    path="/billing"
                    element={roleRoute(
                        ['admin', 'receptionist', 'pharmacist', 'lab_technician', 'radiologist'],
                        <BillingPage />,
                    )}
                />
                <Route path="/billing/new" element={roleRoute(['admin'], <BillCreatePage />)} />
                <Route path="/inventory" element={roleRoute(['admin'], <InventoryPage />)} />
                <Route
                    path="/inventory/new"
                    element={roleRoute(['admin'], <InventoryCreatePage />)}
                />
                <Route
                    path="/feedback"
                    element={roleRoute(['admin', 'patient'], <FeedbackPage />)}
                />
                <Route path="/notifications" element={protectedRoute(<NotificationsPage />)} />
                <Route
                    path="/notifications/new"
                    element={roleRoute(['admin', 'receptionist'], <NotificationCreatePage />)}
                />
                <Route path="/reports" element={roleRoute(['admin'], <ReportsPage />)} />
                <Route path="/users" element={roleRoute(['admin'], <UsersPage />)} />
                <Route path="/profile" element={protectedRoute(<ProfilePage />)} />

                <Route path="/unauthorized" element={protectedRoute(<Unauthorized />)} />
                <Route path="/home" element={<Navigate to="/" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <Toaster />
        </BrowserRouter>
    );
}

export default App;
