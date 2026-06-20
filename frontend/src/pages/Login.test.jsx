import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Login from './Login';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', async () => {
    const actual = await vi.importActual('../context/AuthContext');

    return {
        ...actual,
        useAuth: vi.fn(),
    };
});

describe('Login', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('logs in an admin user and redirects to the admin dashboard', async () => {
        const login = vi.fn().mockResolvedValue({
            role: 'admin',
        });

        useAuth.mockReturnValue({
            isAuthenticated: false,
            loading: false,
            login,
            user: null,
        });

        const user = userEvent.setup();

        render(
            <MemoryRouter initialEntries={['/login']}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard/admin" element={<h1>Admin dashboard</h1>} />
                </Routes>
            </MemoryRouter>,
        );

        await user.type(screen.getByLabelText(/email address/i), 'admin@hospital.com');
        await user.type(screen.getByLabelText(/password/i), 'admin123');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
            expect(login).toHaveBeenCalledWith({
                email: 'admin@hospital.com',
                password: 'admin123',
            });
        });

        expect(await screen.findByText(/admin dashboard/i)).toBeInTheDocument();
    });
});
