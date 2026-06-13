/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, loginUser, signupUser } from '../services/authService';

const AuthContext = createContext(null);
const TOKEN_KEY = 'hms_token';
const USER_KEY = 'hms_user';

export const dashboardPathByRole = {
    admin: '/dashboard/admin',
    doctor: '/dashboard/doctor',
    nurse: '/dashboard/nurse',
    patient: '/dashboard/patient',
    pharmacist: '/dashboard/pharmacist',
    lab_technician: '/dashboard/lab',
    radiologist: '/dashboard/radiology',
    receptionist: '/dashboard/nurse',
};

export const getDashboardPath = (role) => dashboardPathByRole[role] || '/unauthorized';

const readStoredUser = () => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (!storedUser) return null;
    try {
        return JSON.parse(storedUser);
    } catch {
        localStorage.removeItem(USER_KEY);
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const saveSession = (jwtToken, userData) => {
        setToken(jwtToken);
        setUser(userData);
        localStorage.setItem(TOKEN_KEY, jwtToken);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
    };

    const clearSession = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    };

    useEffect(() => {
        const restoreSession = async () => {
            const storedToken = localStorage.getItem(TOKEN_KEY);
            const storedUser = readStoredUser();
            if (!storedToken || !storedUser) {
                clearSession();
                setLoading(false);
                return;
            }
            setToken(storedToken);
            setUser(storedUser);
            try {
                const response = await getCurrentUser(storedToken);
                if (response.success && response.user) saveSession(storedToken, response.user);
            } catch {
                clearSession();
            } finally {
                setLoading(false);
            }
        };
        restoreSession();
    }, []);

    const login = useCallback(async (credentials) => {
        const response = await loginUser(credentials);
        if (!response.success || !response.token || !response.user)
            throw new Error(response.message || 'Login failed');
        saveSession(response.token, response.user);
        return response.user;
    }, []);

    const signup = useCallback(async (formData) => {
        const response = await signupUser(formData);
        if (!response.success || !response.token || !response.user)
            throw new Error(response.message || 'Signup failed');
        saveSession(response.token, response.user);
        return response.user;
    }, []);

    const logout = useCallback(() => {
        clearSession();
    }, []);

    const value = useMemo(
        () => ({
            user,
            token,
            loading,
            isAuthenticated: Boolean(token && user),
            login,
            signup,
            logout,
            getDashboardPath,
        }),
        [user, token, loading, login, signup, logout],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside AuthProvider');
    return context;
};
