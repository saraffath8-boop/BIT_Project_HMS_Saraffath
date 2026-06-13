import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import App from './App.jsx';
import './App.css';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthProvider>
            <NotificationProvider>
                <App />
            </NotificationProvider>
        </AuthProvider>
    </StrictMode>,
);
