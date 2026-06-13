import { z } from 'zod';

export const userRoles = [
    'admin',
    'doctor',
    'nurse',
    'pharmacist',
    'receptionist',
    'lab_technician',
    'radiologist',
    'patient',
];
export const staffRoles = userRoles.filter((role) => role !== 'patient');
export const genderOptions = ['Male', 'Female', 'Other'];
export const sriLankanPhoneRegex = /^0[1-9][0-9]{8}$/;
export const sriLankanNicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
export const personNameRegex = /^[\p{L}][\p{L}\s.'-]*$/u;
export const patientNameRegex = /^[\p{L}\p{N}][\p{L}\p{N}\s.'-]*$/u;

const requiredText = (label) => z.string().trim().min(1, `${label} is required`);

export const commonUserSchema = z.object({
    firstName: requiredText('First name')
        .min(2, 'First name must be at least 2 characters')
        .regex(personNameRegex, 'First name contains invalid characters'),
    lastName: requiredText('Last name')
        .min(2, 'Last name must be at least 2 characters')
        .regex(personNameRegex, 'Last name contains invalid characters'),
    email: requiredText('Email address').email('Enter a valid email address'),
    phone: requiredText('Phone number').regex(
        sriLankanPhoneRegex,
        'Phone number must be a valid Sri Lankan 10-digit number starting with 0.',
    ),
    nic: requiredText('NIC')
        .regex(sriLankanNicRegex, 'NIC must be 12 digits or 9 digits followed by V/X.')
        .transform((value) => value.toUpperCase()),
    dob: requiredText('Date of birth').refine((value) => {
        const date = new Date(value);
        return !Number.isNaN(date.getTime()) && date <= new Date();
    }, 'Enter a valid date of birth that is not in the future'),
    gender: z.enum(genderOptions, { error: 'Please select a valid gender.' }),
});

const credentialUserSchema = commonUserSchema.extend({
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = credentialUserSchema.extend({
    address: requiredText('Address').max(300, 'Address cannot exceed 300 characters'),
    emergencyContactName: requiredText('Emergency contact name')
        .min(2, 'Emergency contact name must be at least 2 characters')
        .regex(patientNameRegex, 'Emergency contact name contains invalid characters'),
    emergencyContactPhone: requiredText('Emergency contact phone').regex(
        sriLankanPhoneRegex,
        'Emergency contact phone must be a valid Sri Lankan 10-digit number starting with 0.',
    ),
});

export const staffUserSchema = credentialUserSchema
    .extend({
        role: z.enum(staffRoles, { error: 'Please select a valid staff role.' }),
        isActive: z.boolean(),
        department: z.string().optional(),
        specialization: z.string().trim().max(160, 'Specialization is too long').optional(),
        consultationFee: z.coerce.number().min(0, 'Consultation fee cannot be negative').optional(),
    })
    .superRefine((data, context) => {
        const birthDate = new Date(data.dob);
        const adultThreshold = new Date();
        adultThreshold.setFullYear(adultThreshold.getFullYear() - 18);
        if (birthDate > adultThreshold) {
            context.addIssue({
                code: 'custom',
                path: ['dob'],
                message: 'Staff users must be at least 18 years old',
            });
        }
        if (data.role === 'doctor' && !data.department) {
            context.addIssue({
                code: 'custom',
                path: ['department'],
                message: 'Department is required for doctors',
            });
        }
    });
