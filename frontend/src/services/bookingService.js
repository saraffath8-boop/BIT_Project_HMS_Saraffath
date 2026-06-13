// This file contains the booking service business workflow.

import { API_BASE_URL, apiGet, apiPost } from './apiClient.js';

// Load departments.
export const getDepartments = async () =>
    apiGet(`${API_BASE_URL}/departments`, undefined, {}, 'Unable to load departments');

// Load doctors by department.
export const getDoctorsByDepartment = async (departmentId) =>
    apiGet(`${API_BASE_URL}/doctors`, undefined, { departmentId }, 'Unable to load doctors');

// Load doctor availability.
export const getDoctorAvailability = async (doctorId, date) =>
    apiGet(
        `${API_BASE_URL}/doctors/${doctorId}/availability`,
        undefined,
        { date },
        'Unable to load available time slots',
    );

// Handle request appointment.
export const requestAppointment = async (appointmentData, token) =>
    apiPost(
        `${API_BASE_URL}/appointments/request${token ? '' : '/public'}`,
        appointmentData,
        token,
        'Unable to submit appointment request',
    );
