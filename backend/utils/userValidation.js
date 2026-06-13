export const SRI_LANKAN_PHONE_REGEX = /^0[1-9][0-9]{8}$/;
export const SRI_LANKAN_NIC_REGEX = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
export const PERSON_NAME_REGEX = /^[\p{L}][\p{L}\s.'-]*$/u;
export const PATIENT_NAME_REGEX = /^[\p{L}\p{N}][\p{L}\p{N}\s.'-]*$/u;
export const VALID_GENDERS = ['Male', 'Female', 'Other'];
export const PATIENT_ROLE = 'patient';

export const normalizeNic = (nic) => typeof nic === 'string' ? nic.trim().toUpperCase() : nic;

export const calculateAge = (dob, today = new Date()) => {
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) age -= 1;
    return age;
};

export const validateUserCreateInput = ({ firstName, lastName, email, phone, nic, dob, gender, password, role = PATIENT_ROLE }) => {
    if (!firstName || !lastName || !email || !phone || !nic || !dob || !gender || !password) {
        return 'First name, last name, email, phone number, NIC, date of birth, gender, and password are required';
    }

    if ([firstName, lastName, email, phone, nic, gender, password].some((value) => typeof value !== 'string')) {
        return 'User identity fields must be provided as text';
    }

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    if (cleanFirstName.length < 2 || !PERSON_NAME_REGEX.test(cleanFirstName)) return 'First name must be at least 2 characters and contain valid name characters';
    if (cleanLastName.length < 2 || !PERSON_NAME_REGEX.test(cleanLastName)) return 'Last name must be at least 2 characters and contain valid name characters';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'Please provide a valid email address';
    if (!SRI_LANKAN_PHONE_REGEX.test(phone.trim())) return 'Phone number must be a valid Sri Lankan 10-digit number starting with 0';
    if (!SRI_LANKAN_NIC_REGEX.test(nic.trim())) return 'NIC must be 12 digits or 9 digits followed by V/X';
    if (!VALID_GENDERS.includes(gender)) return 'Gender must be Male, Female, or Other';

    const birthDate = new Date(dob);
    if (Number.isNaN(birthDate.getTime()) || birthDate > new Date()) return 'Date of birth must be a valid date and cannot be in the future';
    if (role !== PATIENT_ROLE && calculateAge(birthDate) < 18) return 'Staff users must be at least 18 years old';
    if (password.length < 8) return 'Password must be at least 8 characters long';
    return null;
};
