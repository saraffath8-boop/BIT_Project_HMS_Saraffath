import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const loadingStyles = { display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#e0f2fe', fontFamily: 'Arial, sans-serif' };

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();
    if (loading) return <div style={loadingStyles}>Loading secure hospital portal...</div>;
    if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
    return children;
};

export default ProtectedRoute;
