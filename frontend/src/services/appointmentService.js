// This file contains the appointment service business workflow.

import { API_BASE_URL, apiDelete, apiGet, apiPatch, apiPost } from './apiClient.js';

// Store the appointments url setting used by this file.
const APPOINTMENTS_URL = `${API_BASE_URL}/appointments`;

// Load appointments.
export const getAppointments = async ({ token, filters = {} }) => {
    return apiGet(APPOINTMENTS_URL, token, filters, 'Unable to load appointments');
};

// Load receptionist pending appointments.
export const getReceptionistPendingAppointments = async ({ token }) => {
    return apiGet(
        `${APPOINTMENTS_URL}/receptionist/pending`,
        token,
        {},
        'Unable to load pending appointment requests',
    );
};

// Load receptionist confirmed queue.
export const getReceptionistConfirmedQueue = async ({ token }) => {
    return apiGet(
        `${APPOINTMENTS_URL}/receptionist/confirmed-queue`,
        token,
        {},
        'Unable to load confirmed appointment queue',
    );
};

// Update appointment.
export const confirmAppointment = async (id, token) => {
    return apiPatch(
        `${APPOINTMENTS_URL}/${id}/confirm`,
        {},
        token,
        'Unable to confirm appointment',
    );
};

// Update appointment paid.
export const markAppointmentPaid = async (id, token) => {
    return apiPatch(
        `${APPOINTMENTS_URL}/${id}/mark-paid`,
        {},
        token,
        'Unable to mark appointment as paid',
    );
};

// Update appointment checked.
export const markAppointmentChecked = async (id, token) => {
    return apiPatch(
        `${APPOINTMENTS_URL}/${id}/mark-checked`,
        {},
        token,
        'Unable to mark patient as checked',
    );
};

// Load appointment by id.
export const getAppointmentById = async (id, token) => {
    return apiGet(`${APPOINTMENTS_URL}/${id}`, token, {}, 'Unable to load appointment');
};

// Load my appointments.
export const getMyAppointments = async (token) => {
    return apiGet(`${APPOINTMENTS_URL}/my`, token, {}, 'Unable to load your appointments');
};

// Create appointment.
export const createAppointment = async (appointmentData, token) => {
    return apiPost(APPOINTMENTS_URL, appointmentData, token, 'Unable to create appointment');
};

// Create consultation.
export const createConsultation = async (appointmentId, consultationData, token) => {
    return apiPost(
        `${APPOINTMENTS_URL}/${appointmentId}/consultation`,
        consultationData,
        token,
        'Unable to complete consultation',
    );
};

// Update appointment.
export const updateAppointment = async (id, appointmentData, token) => {
    return apiPatch(
        `${APPOINTMENTS_URL}/${id}`,
        appointmentData,
        token,
        'Unable to update appointment',
    );
};

// Remove appointment.
export const deleteAppointment = async (id, token) => {
    return apiDelete(`${APPOINTMENTS_URL}/${id}`, token, 'Unable to delete appointment');
};
